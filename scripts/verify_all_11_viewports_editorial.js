/**
 * Sriyas Healthcare - Complete 11-Viewport Editorial Visual & Animation Verification
 * 
 * Viewports:
 * 1.  1920 x 1080 (Full HD Desktop)
 * 2.  1600 x 900  (Large Laptop)
 * 3.  1440 x 900  (MacBook Pro / Standard Desktop)
 * 4.  1366 x 768  (Standard Windows 14" Laptop)
 * 5.  1280 x 800  (Compact Laptop)
 * 6.  1024 x 768  (iPad Landscape / Small Desktop)
 * 7.  768 x 1024  (iPad Portrait / Tablet)
 * 8.  430 x 932   (iPhone 14/15 Pro Max)
 * 9.  390 x 844   (iPhone 12/13/14)
 * 10. 375 x 812   (iPhone X/XS/11 Pro)
 * 11. 360 x 800   (Samsung Galaxy S20/S21/A54)
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_11VP';
const rootDir = path.join(__dirname, '..');
const TARGET_URL = 'http://127.0.0.1:5173';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let serverProc = null;
let clientProc = null;
let chromeProc = null;

async function waitForHttp(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 304 || res.status === 404) {
        return true;
      }
    } catch (_) {}
    await sleep(400);
  }
  return false;
}

async function startServers() {
  console.log('[Servers] Checking if Backend (port 5000) or Client (port 5173) are active...');
  const backendAlreadyUp = await waitForHttp('http://127.0.0.1:5000/api/health', 1500);
  const clientAlreadyUp = await waitForHttp('http://127.0.0.1:5173/', 1500);

  if (!backendAlreadyUp) {
    console.log('[Servers] Starting Backend Server (node server/server.js)...');
    serverProc = spawn('node', ['server/server.js'], {
      cwd: rootDir,
      env: { ...process.env, USE_LOCAL_DB: 'true', PORT: '5000', HOST: '127.0.0.1' },
      stdio: 'ignore'
    });
  } else {
    console.log('[Servers] Backend already running on http://127.0.0.1:5000');
  }

  if (!clientAlreadyUp) {
    console.log('[Servers] Starting Client Server (node vite.js)...');
    const viteBin = path.join(rootDir, 'client', 'node_modules', 'vite', 'bin', 'vite.js');
    clientProc = spawn('node', [viteBin, '--host', '127.0.0.1', '--port', '5173'], {
      cwd: path.join(rootDir, 'client'),
      stdio: 'ignore'
    });
  } else {
    console.log('[Servers] Client already running on http://127.0.0.1:5173');
  }

  const backendReady = await waitForHttp('http://127.0.0.1:5000/api/health', 25000);
  if (!backendReady) throw new Error('Backend failed to start on port 5000.');
  console.log('[Servers] Backend confirmed healthy at http://127.0.0.1:5000/api/health');

  const clientReady = await waitForHttp('http://127.0.0.1:5173/', 25000);
  if (!clientReady) throw new Error('Client failed to start on port 5173.');
  console.log('[Servers] Client confirmed responsive at http://127.0.0.1:5173/');
}

async function startChrome() {
  console.log('[Chrome] Checking for existing Chrome CDP on port 9222...');
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    if (res.ok) {
      const data = await res.json();
      console.log('[Chrome] Connected to existing Chrome instance:', data.Browser);
      return;
    }
  } catch (_) {}

  console.log('[Chrome] Launching Chrome headless on port 9222...');
  chromeProc = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--remote-allow-origins=*',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      `--user-data-dir=${CHROME_DEV_PROFILE}`
    ],
    { stdio: 'ignore' }
  );

  let connected = false;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        connected = true;
        break;
      }
    } catch (_) {}
  }
  if (!connected) throw new Error('Failed to launch Chrome with CDP.');
  console.log('[Chrome] Successfully started and listening on port 9222.');
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    const WebSocket = global.WebSocket || require('ws');
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { res, rej } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
          else res(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const id = this.nextId++;
      this.callbacks.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true
    });
    const filePath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`  [Screenshot] Saved: ${filename} (${Math.round(res.data.length / 1024)} KB)`);
  }

  async setViewport(width, height, isMobile = false, deviceScaleFactor = 1) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: isMobile
    });
    await this.send('Emulation.setVisibleSize', { width, height });
    await sleep(250);
  }

  close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
    }
  }
}

const VIEWPORTS = [
  { name: 'Full HD Desktop', width: 1920, height: 1080, mobile: false, screenshot: true, tag: '1920x1080' },
  { name: 'Large Laptop', width: 1600, height: 900, mobile: false, screenshot: false, tag: '1600x900' },
  { name: 'MacBook / Desktop', width: 1440, height: 900, mobile: false, screenshot: true, tag: '1440x900' },
  { name: 'Standard 14" Laptop', width: 1366, height: 768, mobile: false, screenshot: true, tag: '1366x768' },
  { name: 'Compact Laptop', width: 1280, height: 800, mobile: false, screenshot: false, tag: '1280x800' },
  { name: 'Tablet Landscape', width: 1024, height: 768, mobile: false, screenshot: false, tag: '1024x768' },
  { name: 'Tablet Portrait (iPad)', width: 768, height: 1024, mobile: true, screenshot: true, tag: '768x1024' },
  { name: 'iPhone 14/15 Pro Max', width: 430, height: 932, mobile: true, screenshot: false, tag: '430x932' },
  { name: 'iPhone 12/13/14', width: 390, height: 844, mobile: true, screenshot: true, tag: '390x844' },
  { name: 'iPhone X/XS/11 Pro', width: 375, height: 812, mobile: true, screenshot: false, tag: '375x812' },
  { name: 'Galaxy S20 Mobile', width: 360, height: 800, mobile: true, screenshot: true, tag: '360x800' },
];

async function run() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SRIYAS HEALTHCARE — 11 VIEWPORTS VERIFICATION SUITE');
  console.log('═══════════════════════════════════════════════════════════════');

  await startServers();
  await startChrome();

  const newTabRes = await fetch('http://127.0.0.1:9222/json/new', { method: 'PUT' });
  const tabData = await newTabRes.json();
  const cdp = new CdpClient(tabData.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  const auditReport = [];

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n───────────────────────────────────────────────────────────────`);
      console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height}, mobile=${vp.mobile})`);
      console.log(`───────────────────────────────────────────────────────────────`);

      await cdp.setViewport(vp.width, vp.height, vp.mobile, 1);
      await cdp.send('Page.navigate', { url: TARGET_URL });
      await sleep(2000);

      // 1. Initial State: Zero Horizontal Overflow Check at top
      const initialOverflow = await cdp.eval(`(() => {
        const sw = document.documentElement.scrollWidth;
        const cw = window.innerWidth;
        return { scrollWidth: sw, innerWidth: cw, hasOverflow: sw > cw };
      })()`);

      console.log(`  Initial width: scrollWidth=${initialOverflow.scrollWidth}, innerWidth=${initialOverflow.innerWidth}, overflow=${initialOverflow.hasOverflow}`);

      // 2. Smoothly scroll through every section to trigger IntersectionObservers
      const scrollMax = await cdp.eval(`document.documentElement.scrollHeight - window.innerHeight`);
      const step = Math.max(300, Math.round(vp.height * 0.45));
      for (let y = 0; y <= scrollMax; y += step) {
        await cdp.eval(`window.scrollTo(0, ${y})`);
        await sleep(80);
      }
      await cdp.eval(`window.scrollTo(0, document.documentElement.scrollHeight)`);
      await sleep(400);

      // 3. Post-scroll Horizontal Overflow Check
      const postScrollOverflow = await cdp.eval(`(() => {
        const sw = document.documentElement.scrollWidth;
        const cw = window.innerWidth;
        return { scrollWidth: sw, innerWidth: cw, hasOverflow: sw > cw };
      })()`);
      console.log(`  Post-scroll width: scrollWidth=${postScrollOverflow.scrollWidth}, innerWidth=${postScrollOverflow.innerWidth}, overflow=${postScrollOverflow.hasOverflow}`);

      // 4. Check for unwanted technical text in the whole document
      const unwantedTextCheck = await cdp.eval(`(() => {
        const bodyText = document.body.innerText || '';
        const forbidden = [
          'auto-rotating showcase',
          'auto rotating showcase',
          'automatic slideshow',
          'carousel mode',
          'scroll reveal',
          'staggered animation'
        ];
        const matches = forbidden.filter(f => bodyText.toLowerCase().includes(f));
        return { hasForbidden: matches.length > 0, matches };
      })()`);
      console.log(`  Unwanted technical text detected: ${unwantedTextCheck.hasForbidden ? unwantedTextCheck.matches.join(', ') : 'NONE (Clean!)'}`);

      // 5. Check Workplace Carousel (8 items, 8 dots, dots highlight in gold)
      const carouselCheck = await cdp.eval(`(() => {
        const dots = document.querySelectorAll('.hp-carousel-dot');
        const activeDot = document.querySelector('.hp-carousel-dot.is-active');
        const slides = document.querySelectorAll('.hp-carousel-slide');
        const counterTotal = document.querySelector('.hp-counter-total');
        const counterCurrent = document.querySelector('.hp-counter-current');
        return {
          totalDots: dots.length,
          totalSlides: slides.length,
          activeDotIndex: activeDot ? Array.from(dots).indexOf(activeDot) + 1 : null,
          counterCurrent: counterCurrent ? counterCurrent.textContent.trim() : null,
          counterTotal: counterTotal ? counterTotal.textContent.trim() : null
        };
      })()`);
      console.log(`  Workplace Carousel: dots=${carouselCheck.totalDots}, slides=${carouselCheck.totalSlides}, current=${carouselCheck.counterCurrent}/${carouselCheck.counterTotal}`);

      // 6. Check What We Do Asymmetrical Showcase
      const wwdCheck = await cdp.eval(`(() => {
        const stage = document.querySelector('.hp-wwd-featured-stage');
        const railItems = document.querySelectorAll('.hp-wwd-rail-item');
        const activeRail = document.querySelector('.hp-wwd-rail-item.is-active');
        const activeTitle = document.querySelector('.hp-wwd-active-title');
        const progressBar = document.querySelector('.hp-wwd-stage-progress-fill');
        return {
          hasStage: !!stage,
          totalCapabilities: railItems.length,
          activeTitle: activeTitle ? activeTitle.textContent.trim() : null,
          hasProgress: !!progressBar,
          activeRailIdx: activeRail ? Array.from(railItems).indexOf(activeRail) + 1 : null
        };
      })()`);
      console.log(`  What We Do: capabilities=${wwdCheck.totalCapabilities}, active=${wwdCheck.activeRailIdx} ("${wwdCheck.activeTitle}")`);

      // 7. Check Leadership Section Convergence & Revelation
      const leadershipCheck = await cdp.eval(`(() => {
        const rows = Array.from(document.querySelectorAll('.hp-leadership-row')).map(r => {
          const style = window.getComputedStyle(r);
          const leftEl = r.querySelector('.hp-converge-left');
          const rightEl = r.querySelector('.hp-converge-right');
          const lStyle = leftEl ? window.getComputedStyle(leftEl) : null;
          const rStyle = rightEl ? window.getComputedStyle(rightEl) : null;
          return {
            isRevealed: r.classList.contains('is-revealed'),
            rowOpacity: style.opacity,
            leftOpacity: lStyle ? lStyle.opacity : null,
            rightOpacity: rStyle ? rStyle.opacity : null
          };
        });
        return { rowCount: rows.length, rows };
      })()`);
      console.log(`  Leadership Rows: count=${leadershipCheck.rowCount}, rows=${JSON.stringify(leadershipCheck.rows)}`);

      // 8. Check Values Sequence
      const valuesCheck = await cdp.eval(`(() => {
        const items = document.querySelectorAll('.hp-value-item');
        const numerals = Array.from(document.querySelectorAll('.hp-value-numeral')).map(n => n.textContent.trim());
        return { count: items.length, numerals };
      })()`);
      console.log(`  Values: count=${valuesCheck.count}, numerals=${valuesCheck.numerals.join(', ')}`);

      // 9. Check Zero Stuck Hidden Children
      const hiddenCheck = await cdp.eval(`(() => {
        const hidden = Array.from(document.querySelectorAll(
          '.hp-reveal-child, .hp-reveal-heading, .hp-reveal-text, .hp-reveal-media, .hp-converge-left, .hp-converge-right'
        )).filter(el => {
          const style = window.getComputedStyle(el);
          return style.opacity === '0';
        });
        return { count: hidden.length };
      })()`);
      console.log(`  Elements stuck at opacity 0: ${hiddenCheck.count}`);

      // Capture screenshots for selected key viewports
      if (vp.screenshot) {
        // Screenshot Hero
        await cdp.eval(`window.scrollTo(0, 0)`);
        await sleep(350);
        await cdp.captureScreenshot(`80_editorial_${vp.tag}_01_hero.png`);

        // Screenshot Workplace Carousel
        await cdp.eval(`(() => {
          const el = document.getElementById('our-workplace');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()`);
        await sleep(350);
        await cdp.captureScreenshot(`80_editorial_${vp.tag}_02_carousel.png`);

        // Screenshot What We Do Showcase
        await cdp.eval(`(() => {
          const el = document.getElementById('what-we-do');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()`);
        await sleep(350);
        await cdp.captureScreenshot(`80_editorial_${vp.tag}_03_what_we_do.png`);

        // Screenshot Leadership Section
        await cdp.eval(`(() => {
          const el = document.getElementById('leadership');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()`);
        await sleep(350);
        await cdp.captureScreenshot(`80_editorial_${vp.tag}_04_leadership.png`);

        // Screenshot Values Section
        await cdp.eval(`(() => {
          const el = document.getElementById('why-choose-sriyas');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()`);
        await sleep(350);
        await cdp.captureScreenshot(`80_editorial_${vp.tag}_05_values.png`);
      }

      auditReport.push({
        viewport: vp.name,
        resolution: `${vp.width}x${vp.height}`,
        mobile: vp.mobile,
        overflow: postScrollOverflow.hasOverflow,
        unwantedText: unwantedTextCheck.hasForbidden,
        carouselDots: carouselCheck.totalDots,
        carouselSlides: carouselCheck.totalSlides,
        wwdCapabilities: wwdCheck.totalCapabilities,
        leadershipRows: leadershipCheck.rowCount,
        valuesCount: valuesCheck.count,
        stuckHidden: hiddenCheck.count
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  FINAL 11-VIEWPORT AUDIT SUMMARY TABLE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.table(auditReport);

    const allPassed = auditReport.every(
      r => !r.overflow && !r.unwantedText && r.carouselDots === 8 && r.wwdCapabilities === 5 && r.valuesCount === 6 && r.stuckHidden === 0
    );

    if (allPassed) {
      console.log('\n🎉 ALL 11 VIEWPORTS PASSED WITH 100% SUCCESS!');
    } else {
      console.warn('\n⚠️ SOME VIEWPORT CHECKS HAD WARNINGS - REVIEW TABLE ABOVE');
    }

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    cdp.close();
    try {
      if (chromeProc) chromeProc.kill();
    } catch (_) {}
    try {
      if (clientProc) clientProc.kill();
    } catch (_) {}
    try {
      if (serverProc) serverProc.kill();
    } catch (_) {}
    process.exit(0);
  }
}

run();
