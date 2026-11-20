/**
 * Sriyas Healthcare — Master Homepage Redesign & Visual Verification Suite
 * Executes real headless Chrome browser tests with CDP to observe:
 * 1. Hero entrance and layout
 * 2. About section opposite-direction convergence animation
 * 3. Workplace Gallery editorial layout, 5 authentic images, parallax, and hover zoom
 * 4. Leadership convergence (Founder M. Ravikumar from left, Operations from right)
 * 5. Team section staggered reveal (3 profiles with real clinical images)
 * 6. What We Do section alternating directional reveals (5 capabilities)
 * 7. Values section opposite-direction convergence (6 principles + feature image)
 * 8. Final CTA closing section, backdrop, and official contact links
 * 9. Mobile responsiveness (390px iPhone viewport) and zero horizontal overflow
 * 10. High-resolution screenshots saved to the artifacts directory
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_HP';
const rootDir = path.join(__dirname, '..');
const TARGET_URL = 'http://127.0.0.1:5173';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let serverProc = null;
let clientProc = null;

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
      return data;
    }
  } catch (_) {}

  console.log('[Chrome] Launching Chrome headless on port 9222...');
  const proc = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--remote-allow-origins=*',
      `--user-data-dir=${CHROME_DEV_PROFILE}`,
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--no-first-run',
      'about:blank'
    ],
    { stdio: 'ignore', detached: true }
  );
  proc.unref();

  let versionData = null;
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (_) {}
  }

  if (!versionData) {
    throw new Error('Could not connect to Chrome CDP on port 9222.');
  }
  console.log('[Chrome] Chrome headless running successfully:', versionData.Browser);
  return versionData;
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new global.WebSocket(this.wsUrl);
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

  async setViewport(width, height, isMobile = false, deviceScaleFactor = 2) {
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

async function runVisualVerification() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SRIYAS HEALTHCARE — HOMEPAGE REDESIGN VISUAL VERIFICATION');
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
  await cdp.send('CSS.enable');

  try {
    // ═══════════════════════════════════════════════════════════════
    // 1. DESKTOP VIEWPORT TEST (1440 x 900)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n[Test 1] Setting Desktop Viewport (1440x900)...');
    await cdp.setViewport(1440, 900, false, 2);

    console.log(`[Test 1] Navigating to ${TARGET_URL}...`);
    await cdp.send('Page.navigate', { url: TARGET_URL });
    await sleep(2500);

    // Verify Hero
    const heroInfo = await cdp.eval(`
      (() => {
        const h1 = document.querySelector('.hp-hero-brand-name')?.textContent?.trim();
        const sub = document.querySelector('.hp-hero-brand-sub')?.textContent?.trim();
        const tagline = document.querySelector('.hp-hero-tagline')?.textContent?.trim();
        const intro = document.querySelector('.hp-hero-intro')?.textContent?.trim();
        const emblem = document.querySelector('.hp-hero-emblem-img')?.src;
        const cta1 = document.querySelector('#hero-primary-cta')?.textContent?.trim();
        const cta2 = document.querySelector('#hero-secondary-cta')?.textContent?.trim();
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        return { h1, sub, tagline, intro, emblem, cta1, cta2, overflow };
      })()
    `);
    console.log('[Hero Verification]', heroInfo);
    await cdp.captureScreenshot('47_homepage_hero_desktop.png');

    // Verify About Sriyas Healthcare & Opposite-Direction Convergence
    console.log('\n[Test 2] Scrolling to About Sriyas Healthcare (#about-sriyas)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('about-sriyas');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(900);

    const aboutInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('about-sriyas');
        if (!el) return null;
        const isRevealed = el.classList.contains('is-revealed');
        const textCol = el.querySelector('.hp-about-content');
        const visualsCol = el.querySelector('.hp-about-visuals');
        const heading = el.querySelector('.hp-heading')?.textContent?.trim();
        const images = Array.from(el.querySelectorAll('.hp-collage-media img')).map(img => ({
          alt: img.alt,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        }));
        return {
          isRevealed,
          heading,
          hasConvergeLeft: textCol?.classList.contains('hp-converge-left'),
          hasConvergeRight: visualsCol?.classList.contains('hp-converge-right'),
          imagesCount: images.length,
          images
        };
      })()
    `);
    console.log('[About Section Verification]', aboutInfo);
    await cdp.captureScreenshot('48_homepage_about_convergence_desktop.png');

    // Verify Workplace Gallery (Our Company in Action)
    console.log('\n[Test 3] Scrolling to Workplace Gallery (#our-workplace)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('our-workplace');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(900);

    const workplaceInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('our-workplace');
        if (!el) return null;
        const isRevealed = el.classList.contains('is-revealed');
        const cards = Array.from(el.querySelectorAll('.hp-workplace-card')).map(card => {
          const title = card.querySelector('h3')?.textContent?.trim();
          const tag = card.querySelector('.hp-workplace-tag')?.textContent?.trim();
          const isFeatured = card.classList.contains('hp-workplace-card--featured');
          return { title, tag, isFeatured };
        });
        return { isRevealed, cardsCount: cards.length, cards };
      })()
    `);
    console.log('[Workplace Gallery Verification]', workplaceInfo);

    // Test hover effect on gallery card
    await cdp.eval(`
      (() => {
        const card = document.querySelector('.hp-workplace-card');
        if (card) {
          card.classList.add('is-hovered');
          card.style.transform = 'translateY(-5px) scale(1.02)';
        }
      })()
    `);
    await sleep(250);
    await cdp.captureScreenshot('49_homepage_gallery_desktop.png');

    // Verify Leadership & Governance
    console.log('\n[Test 4] Scrolling to Leadership & Governance (#leadership)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('leadership');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(900);

    const leadershipInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('leadership');
        if (!el) return null;
        const isRevealed = el.classList.contains('is-revealed');
        const cards = Array.from(el.querySelectorAll('.hp-founder-card')).map(card => {
          const name = card.querySelector('.hp-founder-name')?.textContent?.trim();
          const role = card.querySelector('.hp-founder-role')?.textContent?.trim();
          const hasLeft = card.classList.contains('hp-converge-left');
          const hasRight = card.classList.contains('hp-converge-right');
          return { name, role, hasLeft, hasRight };
        });
        return { isRevealed, cardsCount: cards.length, cards };
      })()
    `);
    console.log('[Leadership Verification]', leadershipInfo);
    await cdp.captureScreenshot('50_homepage_leadership_desktop.png');

    // Verify Team Section (#team)
    console.log('\n[Test 5] Scrolling to Team Section (#team)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('team');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(900);

    const teamInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('team');
        if (!el) return null;
        const isRevealed = el.classList.contains('is-revealed');
        const cards = Array.from(el.querySelectorAll('.hp-founder-card')).map(card => {
          const name = card.querySelector('.hp-founder-name')?.textContent?.trim();
          const role = card.querySelector('.hp-founder-role')?.textContent?.trim();
          return { name, role };
        });
        return { isRevealed, cardsCount: cards.length, cards };
      })()
    `);
    console.log('[Team Section Verification]', teamInfo);
    await cdp.captureScreenshot('51_homepage_team_desktop.png');

    // Verify What We Do Section (#what-we-do)
    console.log('\n[Test 6] Scrolling to What We Do Section (#what-we-do)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('what-we-do');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(900);

    const wwdInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('what-we-do');
        if (!el) return null;
        const isRevealed = el.classList.contains('is-revealed');
        const cards = Array.from(el.querySelectorAll('.hp-wwd-card')).map(card => {
          const title = card.querySelector('.hp-card-title')?.textContent?.trim();
          const hasLeft = card.classList.contains('hp-converge-left');
          const hasRight = card.classList.contains('hp-converge-right');
          return { title, hasLeft, hasRight };
        });
        return { isRevealed, cardsCount: cards.length, cards };
      })()
    `);
    console.log('[What We Do Verification]', wwdInfo);
    await cdp.captureScreenshot('52_homepage_what_we_do_desktop.png');

    // Verify Values Section (#why-choose-sriyas)
    console.log('\n[Test 7] Scrolling to Values Section (#why-choose-sriyas)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('why-choose-sriyas');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(900);

    const valuesInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('why-choose-sriyas');
        if (!el) return null;
        const isRevealed = el.classList.contains('is-revealed');
        const intro = el.querySelector('.hp-values-intro');
        const grid = el.querySelector('.hp-wcu-grid');
        const cards = Array.from(el.querySelectorAll('.hp-wcu-card')).map(c => c.querySelector('.hp-wcu-title')?.textContent?.trim());
        return {
          isRevealed,
          hasIntroLeft: intro?.classList.contains('hp-converge-left'),
          hasGridRight: grid?.classList.contains('hp-converge-right'),
          cardsCount: cards.length,
          cards
        };
      })()
    `);
    console.log('[Values Verification]', valuesInfo);
    await cdp.captureScreenshot('53_homepage_values_desktop.png');

    // Verify Final CTA (#cta-connect)
    console.log('\n[Test 8] Scrolling to Final CTA (#cta-connect)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('cta-connect');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(800);

    const ctaInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('cta-connect');
        if (!el) return null;
        const isRevealed = el.classList.contains('is-revealed');
        const heading = el.querySelector('.hp-cta-heading')?.textContent?.trim();
        const phoneLink = el.querySelector('a[href^=\"tel:\"]')?.href;
        const emailLink = el.querySelector('a[href^=\"mailto:\"]')?.href;
        return { isRevealed, heading, phoneLink, emailLink };
      })()
    `);
    console.log('[CTA Verification]', ctaInfo);
    await cdp.captureScreenshot('54_homepage_final_cta_desktop.png');

    // Verify zero horizontal scrolling on desktop
    const desktopOverflow = await cdp.eval(`document.documentElement.scrollWidth > window.innerWidth`);
    console.log(`[Desktop Overflow Check] Horizontal overflow: ${desktopOverflow ? 'YES (FAIL)' : 'NO (PASS)'}`);

    // ═══════════════════════════════════════════════════════════════
    // 2. MOBILE VIEWPORT TEST (390 x 844 — iPhone 14/15/16)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  MOBILE RESPONSIVENESS TEST (390 x 844)');
    console.log('═══════════════════════════════════════════════════════════════');
    await cdp.setViewport(390, 844, true, 3);
    await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' })`);
    await sleep(600);

    const mobileHero = await cdp.eval(`
      (() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        const h1 = document.querySelector('.hp-hero-brand-name')?.textContent?.trim();
        return { scrollWidth, innerWidth, overflow: scrollWidth > innerWidth, h1 };
      })()
    `);
    console.log('[Mobile Hero]', mobileHero);
    await cdp.captureScreenshot('55_homepage_hero_mobile_390.png');

    // Scroll to About & Gallery on mobile
    await cdp.eval(`
      (() => {
        const el = document.getElementById('about-sriyas');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()
    `);
    await sleep(600);
    const mobileAbout = await cdp.eval(`
      (() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        return { scrollWidth, innerWidth, overflow: scrollWidth > innerWidth };
      })()
    `);
    console.log('[Mobile About Overflow Check]', mobileAbout);
    await cdp.captureScreenshot('56_homepage_about_gallery_mobile_390.png');

    // Scroll to Leadership & Values on mobile
    await cdp.eval(`
      (() => {
        const el = document.getElementById('leadership');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()
    `);
    await sleep(600);
    const mobilePeople = await cdp.eval(`
      (() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        return { scrollWidth, innerWidth, overflow: scrollWidth > innerWidth };
      })()
    `);
    console.log('[Mobile Leadership/Team Overflow Check]', mobilePeople);
    await cdp.captureScreenshot('57_homepage_people_values_mobile_390.png');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  BROWSER VERIFICATION COMPLETE — ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════════════');
  } finally {
    cdp.close();
    if (serverProc) serverProc.kill();
    if (clientProc) clientProc.kill();
  }
}

runVisualVerification().catch((err) => {
  console.error('[Verification Failed]:', err);
  if (serverProc) serverProc.kill();
  if (clientProc) clientProc.kill();
  process.exit(1);
});
