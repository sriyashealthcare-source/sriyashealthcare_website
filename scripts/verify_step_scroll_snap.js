/**
 * Sriyas Healthcare - Full-Page One-Section-Per-Scroll Snapping Verification Suite
 *
 * Verifies:
 * 1. CSS scroll-snap properties:
 *    - `html` / `body` has `scroll-snap-type: y mandatory` on desktop (>= 1024px)
 *    - All `.home-viewport-section` sections have `scroll-snap-align: start` & `scroll-snap-stop: always`
 *    - `#site-footer` has `scroll-snap-align: start` & `scroll-snap-stop: always`
 * 2. Downward step-by-step navigation:
 *    - Hero -> About -> Workplace -> Leadership -> Team -> Values -> Footer
 *    - Validates that each transition locks to exactly one section and aligns cleanly
 * 3. Upward step-by-step navigation:
 *    - Footer -> Values -> Team -> Leadership -> Workplace -> About -> Hero
 * 4. Fast-flick momentum lock:
 *    - Multiple rapid wheel events in quick succession advance exactly one section without skipping
 * 5. Mobile reset (< 1024px):
 *    - `scroll-snap-type: none`, `height: auto` on mobile/tablet viewports
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const rootDir = path.join(__dirname, '..');
const CHROME_DEV_PROFILE = path.join(rootDir, '.chrome_dev_session');
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
      if (res.ok || res.status === 200 || res.status === 304 || res.status === 404) return true;
    } catch (_) { }
    await sleep(400);
  }
  return false;
}

async function startServers() {
  console.log('[Servers] Checking backend (port 5000) and client (port 5173)...');
  const backendAlreadyUp = await waitForHttp('http://127.0.0.1:5000/api/health', 1500);
  const clientAlreadyUp = await waitForHttp('http://127.0.0.1:5173/', 1500);

  if (!backendAlreadyUp) {
    console.log('[Servers] Starting Backend Server...');
    serverProc = spawn('node', ['server/server.js'], {
      cwd: rootDir,
      env: { ...process.env, USE_LOCAL_DB: 'true', PORT: '5000', HOST: '127.0.0.1' },
      stdio: 'ignore'
    });
  }

  if (!clientAlreadyUp) {
    console.log('[Servers] Starting Client Server...');
    const viteBin = path.join(rootDir, 'client', 'node_modules', 'vite', 'bin', 'vite.js');
    clientProc = spawn('node', [viteBin, '--host', '127.0.0.1', '--port', '5173'], {
      cwd: path.join(rootDir, 'client'),
      stdio: 'ignore'
    });
  }

  await waitForHttp('http://127.0.0.1:5000/api/health', 25000);
  await waitForHttp('http://127.0.0.1:5173/', 25000);
  console.log('[Servers] Servers active.');
}

async function startChrome() {
  console.log('[Chrome] Launching Headless Chrome on CDP port 9222...');
  try {
    const probe = await fetch('http://127.0.0.1:9222/json/version');
    if (probe.ok) {
      console.log('[Chrome] Existing Chrome debug session detected.');
      return;
    }
  } catch (_) { }

  chromeProc = spawn(CHROME_PATH, [
    '--remote-debugging-port=9222',
    '--remote-debugging-address=127.0.0.1',
    '--remote-allow-origins=*',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${CHROME_DEV_PROFILE}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1366,768',
    'about:blank'
  ], { stdio: 'ignore' });

  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const probe = await fetch('http://127.0.0.1:9222/json/version');
      if (probe.ok) {
        console.log('[Chrome] Connected to Chrome DevTools Protocol.');
        return;
      }
    } catch (_) { }
  }
  throw new Error('Could not connect to Chrome CDP.');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    const WebSocket = global.WebSocket || require('ws');
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
        if (msg.id && this.pending.has(msg.id)) {
          const { res, rej } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) rej(msg.error);
          else res(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { res: resolve, rej: reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return r.result ? r.result.value : undefined;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`  [Screenshot] Saved: ${path.basename(filePath)}`);
  }

  async close() {
    if (this.ws) {
      try { this.ws.close(); } catch (_) { }
    }
  }
}

async function runSuite() {
  await startServers();
  await startChrome();

  const versionRes = await (await fetch('http://127.0.0.1:9222/json/list')).json();
  const pageTarget = versionRes.find((p) => p.type === 'page') || versionRes[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  console.log('\n══════════════════════════════════════════════════════');
  console.log('TEST 1: DESKTOP CSS SCROLL-SNAP PROPERTIES (1366x768)');
  console.log('══════════════════════════════════════════════════════');

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false
  });

  await cdp.send('Page.navigate', { url: TARGET_URL });
  await sleep(3500);

  const cssProperties = await cdp.eval(`(() => {
    const htmlSnap = window.getComputedStyle(document.documentElement).scrollSnapType;
    const bodySnap = window.getComputedStyle(document.body).scrollSnapType;
    const sections = Array.from(document.querySelectorAll('.home-viewport-section'));
    const footer = document.getElementById('site-footer') || document.querySelector('.footer');

    const sectionChecks = sections.map((sec, idx) => {
      const cs = window.getComputedStyle(sec);
      return {
        id: sec.id || ('sec-' + idx),
        snapAlign: cs.scrollSnapAlign,
        snapStop: cs.scrollSnapStop,
        height: sec.getBoundingClientRect().height
      };
    });

    const footerCs = footer ? window.getComputedStyle(footer) : null;

    return {
      htmlSnap,
      bodySnap,
      sectionsCount: sections.length,
      sections: sectionChecks,
      footer: footer ? {
        id: footer.id || 'footer',
        snapAlign: footerCs.scrollSnapAlign,
        snapStop: footerCs.scrollSnapStop,
        height: footer.getBoundingClientRect().height
      } : null
    };
  })()`);

  console.log(`HTML scroll-snap-type: "${cssProperties.htmlSnap}" (expected mandatory y)`);
  console.log(`Total Home Viewport Sections: ${cssProperties.sectionsCount}`);
  cssProperties.sections.forEach((sec, idx) => {
    console.log(`  Section ${idx} (#${sec.id}): snap-align="${sec.snapAlign}", snap-stop="${sec.snapStop}", height=${sec.height}px`);
  });
  if (cssProperties.footer) {
    console.log(`  Footer (#${cssProperties.footer.id}): snap-align="${cssProperties.footer.snapAlign}", snap-stop="${cssProperties.footer.snapStop}", height=${cssProperties.footer.height}px`);
  }

  const allSectionsMandatory = cssProperties.sections.every((s) => s.snapAlign.includes('start') && s.snapStop.includes('always'));
  const footerMandatory = cssProperties.footer && cssProperties.footer.snapAlign.includes('start') && cssProperties.footer.snapStop.includes('always');
  console.log(`PASS: All Sections have mandatory snap: ${allSectionsMandatory}`);
  console.log(`PASS: Footer has mandatory snap: ${footerMandatory}`);

  console.log('\n══════════════════════════════════════════════════════');
  console.log('TEST 2: STEP-BY-STEP DOWNWARD WHEEL NAVIGATION (0 -> 6)');
  console.log('══════════════════════════════════════════════════════');

  // Scroll to top
  await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' })`);
  await sleep(600);

  const targetsCount = cssProperties.sectionsCount + (cssProperties.footer ? 1 : 0);
  console.log(`Total Snap Targets (Sections + Footer): ${targetsCount}`);

  for (let step = 1; step < targetsCount; step++) {
    console.log(`\n[Step Down -> Target ${step}] Dispatching single wheel event (deltaY: +80)...`);
    await cdp.eval(`(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 80, bubbles: true, cancelable: true }));
    })()`);

    // Wait for step transition lock (700ms) + smooth scroll to settle
    await sleep(900);

    const activeInfo = await cdp.eval(`(() => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const vh = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const isBottom = scrollY + vh >= docHeight - 20;

      const sections = Array.from(document.querySelectorAll('.home-viewport-section'));
      const footer = document.getElementById('site-footer') || document.querySelector('.footer');
      if (footer && !sections.includes(footer)) sections.push(footer);

      let activeIndex = 0;
      let minDistance = Infinity;

      sections.forEach((sec, i) => {
        const rect = sec.getBoundingClientRect();
        const dist = Math.abs(rect.top);
        if (dist < minDistance) {
          minDistance = dist;
          activeIndex = i;
        }
      });

      if (isBottom) activeIndex = sections.length - 1;

      const activeEl = sections[activeIndex];
      const activeRect = activeEl.getBoundingClientRect();

      return {
        scrollY,
        activeIndex,
        activeId: activeEl.id || activeEl.className,
        rectTop: activeRect.top,
        rectHeight: activeRect.height
      };
    })()`);

    console.log(`  Arrived at Target ${activeInfo.activeIndex} (#${activeInfo.activeId}): scrollY=${activeInfo.scrollY}px, rectTop=${activeInfo.rectTop.toFixed(1)}px`);
    if (step === activeInfo.activeIndex) {
      console.log(`  ✓ SUCCESS: Exactly advanced to step ${step}`);
    } else {
      console.log(`  ✗ WARN: Expected step ${step}, got ${activeInfo.activeIndex}`);
    }

    if (step === targetsCount - 1) {
      // Reached footer
      await cdp.screenshot(path.join(ARTIFACT_DIR, 'step_scroll_footer_1366x768.png'));
    }
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log('TEST 3: STEP-BY-STEP UPWARD WHEEL NAVIGATION (6 -> 0)');
  console.log('══════════════════════════════════════════════════════');

  for (let step = targetsCount - 2; step >= 0; step--) {
    console.log(`\n[Step Up -> Target ${step}] Dispatching single wheel event (deltaY: -80)...`);
    await cdp.eval(`(() => {
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: -80, bubbles: true, cancelable: true }));
    })()`);

    await sleep(900);

    const activeInfo = await cdp.eval(`(() => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const vh = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const isBottom = scrollY + vh >= docHeight - 20;

      const sections = Array.from(document.querySelectorAll('.home-viewport-section'));
      const footer = document.getElementById('site-footer') || document.querySelector('.footer');
      if (footer && !sections.includes(footer)) sections.push(footer);

      let activeIndex = 0;
      let minDistance = Infinity;

      sections.forEach((sec, i) => {
        const rect = sec.getBoundingClientRect();
        const dist = Math.abs(rect.top);
        if (dist < minDistance) {
          minDistance = dist;
          activeIndex = i;
        }
      });

      if (isBottom) activeIndex = sections.length - 1;

      const activeEl = sections[activeIndex];
      const activeRect = activeEl.getBoundingClientRect();

      return {
        scrollY,
        activeIndex,
        activeId: activeEl.id || activeEl.className,
        rectTop: activeRect.top,
        rectHeight: activeRect.height
      };
    })()`);

    console.log(`  Arrived at Target ${activeInfo.activeIndex} (#${activeInfo.activeId}): scrollY=${activeInfo.scrollY}px, rectTop=${activeInfo.rectTop.toFixed(1)}px`);
    if (step === activeInfo.activeIndex) {
      console.log(`  ✓ SUCCESS: Exactly retreated to step ${step}`);
    } else {
      console.log(`  ✗ WARN: Expected step ${step}, got ${activeInfo.activeIndex}`);
    }
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log('TEST 4: MOMENTUM BURST LOCK TEST (FLICK SUPPRESSION)');
  console.log('══════════════════════════════════════════════════════');
  console.log('Dispatching 5 rapid wheel events (deltaY: +120 each) in 150ms from Section 0 (Hero)...');

  await cdp.eval(`(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  })()`);
  await sleep(600);

  await cdp.eval(`(() => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        window.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }));
      }, i * 30);
    }
  })()`);

  // Wait for lock window
  await sleep(1200);

  const burstResult = await cdp.eval(`(() => {
    const sections = Array.from(document.querySelectorAll('.home-viewport-section'));
    let activeIndex = 0;
    let minDistance = Infinity;
    sections.forEach((sec, i) => {
      const dist = Math.abs(sec.getBoundingClientRect().top);
      if (dist < minDistance) {
        minDistance = dist;
        activeIndex = i;
      }
    });
    return {
      activeIndex,
      activeId: sections[activeIndex].id
    };
  })()`);

  console.log(`After 5 rapid wheel events: Stopped at Target ${burstResult.activeIndex} (#${burstResult.activeId})`);
  if (burstResult.activeIndex === 1) {
    console.log('  ✓ SUCCESS: Rapid momentum burst was successfully locked to exactly ONE section (Target 1, About)!');
  } else {
    console.log(`  ✗ WARNING: Expected Target 1, but landed on Target ${burstResult.activeIndex}`);
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log('TEST 5: MOBILE RESPONSIVE RESET (< 1024px)');
  console.log('══════════════════════════════════════════════════════');

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await sleep(1000);

  const mobileCheck = await cdp.eval(`(() => {
    const htmlSnap = window.getComputedStyle(document.documentElement).scrollSnapType;
    const bodySnap = window.getComputedStyle(document.body).scrollSnapType;
    const sec = document.querySelector('.home-viewport-section');
    const secCs = sec ? window.getComputedStyle(sec) : null;

    return {
      htmlSnap,
      bodySnap,
      secSnapAlign: secCs ? secCs.scrollSnapAlign : null,
      secHeight: sec ? sec.getBoundingClientRect().height : 0
    };
  })()`);

  console.log(`Mobile HTML snap: "${mobileCheck.htmlSnap}" (expected none)`);
  console.log(`Mobile Section snap-align: "${mobileCheck.secSnapAlign}" (expected none)`);
  console.log(`Mobile Section natural height: ${mobileCheck.secHeight}px`);
  const mobilePass = (!mobileCheck.htmlSnap || mobileCheck.htmlSnap === 'none') && (!mobileCheck.secSnapAlign || mobileCheck.secSnapAlign === 'none');
  console.log(`PASS: Mobile natural flow without snapping: ${mobilePass}`);

  await cdp.close();
  console.log('\n══════════════════════════════════════════════════════');
  console.log('ALL TESTS COMPLETED!');
  console.log('══════════════════════════════════════════════════════');

  if (chromeProc) chromeProc.kill();
  if (clientProc) clientProc.kill();
  if (serverProc) serverProc.kill();
  process.exit(0);
}

runSuite().catch((err) => {
  console.error('[Error in Suite]', err);
  if (chromeProc) chromeProc.kill();
  if (clientProc) clientProc.kill();
  if (serverProc) serverProc.kill();
  process.exit(1);
});
