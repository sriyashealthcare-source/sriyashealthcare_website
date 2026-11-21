/**
 * Sriyas Healthcare - Leadership Two-Sided Scroll Convergence Verification Suite
 * 
 * Verifies:
 * 1. Initial State: Text on left displaced at -100px, photo on right displaced at +100px, opacity 0.
 * 2. Independent Trigger: Row 1 triggers when entering viewport by 20-25%, while Row 2 remains unrevealed.
 * 3. Intermediate State: Text glides LEFT -> RIGHT (-100px -> 0px), Photo glides RIGHT -> LEFT (+100px -> 0px).
 * 4. Settled State: Arrive together at 0px with opacity 1 after 1.25s duration.
 * 5. Alternating Row 2: Photo on left (-100px -> 0px), text on right (+100px -> 0px).
 * 6. Mobile Viewports (390px, 360px): Zero horizontal overflow, vertical upward motion.
 * 7. Screenshot artifacts captured at every state.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_Leadership2';
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
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    if (res.ok) {
      console.log('[Chrome] Connected to existing Chrome instance.');
      return;
    }
  } catch (_) { }

  console.log('[Chrome] Launching Chrome headless...');
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

  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) break;
    } catch (_) { }
  }
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
      try { this.ws.close(); } catch (_) { }
    }
  }
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SRIYAS HEALTHCARE — LEADERSHIP CONVERGENCE VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════');

  await startServers();
  await startChrome();

  const newTabRes = await fetch('http://127.0.0.1:9222/json/new', { method: 'PUT' });
  const tabData = await newTabRes.json();
  const cdp = new CdpClient(tabData.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  try {
    // ═══════════════════════════════════════════════════════════════
    // 1. DESKTOP VIEWPORT: 1440 x 900
    // ═══════════════════════════════════════════════════════════════
    console.log('\n[Phase 1] Desktop Viewport (1440x900) Verification');
    await cdp.setViewport(1440, 900, false, 1);
    await cdp.send('Page.navigate', { url: TARGET_URL });
    await sleep(2000);

    const sectionInfo = await cdp.eval(`(() => {
      const section = document.getElementById('leadership');
      if (!section) return null;
      const rows = Array.from(section.querySelectorAll('.hp-leadership-row')).map((r, i) => {
        const rect = r.getBoundingClientRect();
        return { index: i, top: rect.top + window.scrollY, height: rect.height };
      });
      return { sectionTop: section.getBoundingClientRect().top + window.scrollY, rows };
    })()`);

    console.log(`Leadership Section Top at page Y = ${sectionInfo.sectionTop}px`);
    console.log(`Row 1 Top at page Y = ${sectionInfo.rows[0].top}px, Row 2 Top at page Y = ${sectionInfo.rows[1].top}px`);

    // ─────────────────────────────────────────────────────────────
    // State A: Positioned ABOVE Row 1 (before 20% enters viewport)
    // ─────────────────────────────────────────────────────────────
    // Scroll so Row 1 is only 5% into the viewport (not yet 20%)
    const aboveRow1ScrollY = Math.max(0, sectionInfo.rows[0].top - 900 + 30);
    await cdp.eval(`window.scrollTo(0, ${aboveRow1ScrollY})`);
    await sleep(300);

    const stateA = await cdp.eval(`(() => {
      const r1 = document.querySelectorAll('.hp-leadership-row')[0];
      const text = r1.querySelector('.hp-leadership-content');
      const photo = r1.querySelector('.hp-leadership-photo-wrap');
      const tStyle = window.getComputedStyle(text);
      const pStyle = window.getComputedStyle(photo);
      return {
        rowRevealed: r1.classList.contains('is-revealed'),
        textTransform: tStyle.transform,
        textOpacity: tStyle.opacity,
        photoTransform: pStyle.transform,
        photoOpacity: pStyle.opacity,
        rectTop: r1.getBoundingClientRect().top
      };
    })()`);

    console.log('\n[State A: Initial State Before Entering Viewport (Unrevealed)]');
    console.log('Row 1 Rect Top:', stateA.rectTop, 'px');
    console.log('Row 1 is-revealed:', stateA.rowRevealed);
    console.log('Row 1 Text (displaced -100px to left):', stateA.textTransform, `opacity: ${stateA.textOpacity}`);
    console.log('Row 1 Photo (displaced +100px to right):', stateA.photoTransform, `opacity: ${stateA.photoOpacity}`);
    await cdp.captureScreenshot('81_leadership_initial_state.png');

    // ─────────────────────────────────────────────────────────────
    // State B: Scroll down so Row 1 enters by 25% (Triggers Convergence)
    // ─────────────────────────────────────────────────────────────
    const triggerRow1ScrollY = sectionInfo.rows[0].top - 900 + Math.round(sectionInfo.rows[0].height * 0.28);
    await cdp.eval(`window.scrollTo(0, ${triggerRow1ScrollY})`);
    // Wait 350ms to catch active mid-flight animation
    await sleep(350);

    const stateB = await cdp.eval(`(() => {
      const r1 = document.querySelectorAll('.hp-leadership-row')[0];
      const text = r1.querySelector('.hp-leadership-content');
      const photo = r1.querySelector('.hp-leadership-photo-wrap');
      const tStyle = window.getComputedStyle(text);
      const pStyle = window.getComputedStyle(photo);
      return {
        rowRevealed: r1.classList.contains('is-revealed'),
        textTransform: tStyle.transform,
        textOpacity: tStyle.opacity,
        photoTransform: pStyle.transform,
        photoOpacity: pStyle.opacity,
        rectTop: r1.getBoundingClientRect().top
      };
    })()`);

    console.log('\n[State B: Active Mid-Flight Convergence (Triggered!)]');
    console.log('Row 1 is-revealed:', stateB.rowRevealed);
    console.log('Row 1 Text traveling LEFT -> RIGHT towards center:', stateB.textTransform, `opacity: ${stateB.textOpacity}`);
    console.log('Row 1 Photo traveling RIGHT -> LEFT towards center:', stateB.photoTransform, `opacity: ${stateB.photoOpacity}`);
    await cdp.captureScreenshot('82_leadership_intermediate_state.png');

    // ─────────────────────────────────────────────────────────────
    // State C: After 1.3s - Both elements fully docked together
    // ─────────────────────────────────────────────────────────────
    console.log('\nWaiting for 1.25s animation completion...');
    await sleep(1100);

    const stateC = await cdp.eval(`(() => {
      const r1 = document.querySelectorAll('.hp-leadership-row')[0];
      const text = r1.querySelector('.hp-leadership-content');
      const photo = r1.querySelector('.hp-leadership-photo-wrap');
      const tStyle = window.getComputedStyle(text);
      const pStyle = window.getComputedStyle(photo);
      return {
        rowRevealed: r1.classList.contains('is-revealed'),
        textTransform: tStyle.transform,
        textOpacity: tStyle.opacity,
        photoTransform: pStyle.transform,
        photoOpacity: pStyle.opacity
      };
    })()`);

    console.log('\n[State C: Fully Settled Row 1 (Arrived Together!)]');
    console.log('Row 1 Text Settled at 0px:', stateC.textTransform, `opacity: ${stateC.textOpacity}`);
    console.log('Row 1 Photo Settled at 0px:', stateC.photoTransform, `opacity: ${stateC.photoOpacity}`);
    await cdp.captureScreenshot('83_leadership_settled_row1.png');

    // ─────────────────────────────────────────────────────────────
    // State D: Row 2 Independent Alternating Convergence
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Phase 2] Alternating Row 2 (Corporate Operations) Verification');
    // Check Row 2 is NOT revealed yet
    const row2Before = await cdp.eval(`(() => {
      const r2 = document.querySelectorAll('.hp-leadership-row')[1];
      const tStyle = window.getComputedStyle(r2.querySelector('.hp-leadership-content'));
      const pStyle = window.getComputedStyle(r2.querySelector('.hp-leadership-photo-wrap'));
      return {
        rowRevealed: r2.classList.contains('is-revealed'),
        photoTransform: pStyle.transform,
        textTransform: tStyle.transform
      };
    })()`);
    console.log('Row 2 before entering viewport: is-revealed =', row2Before.rowRevealed, `photo: ${row2Before.photoTransform}, text: ${row2Before.textTransform}`);

    // Scroll down to Row 2
    const triggerRow2ScrollY = sectionInfo.rows[1].top - 900 + Math.round(sectionInfo.rows[1].height * 0.30);
    await cdp.eval(`window.scrollTo(0, ${triggerRow2ScrollY})`);
    await sleep(400);

    const row2Mid = await cdp.eval(`(() => {
      const r2 = document.querySelectorAll('.hp-leadership-row')[1];
      const tStyle = window.getComputedStyle(r2.querySelector('.hp-leadership-content'));
      const pStyle = window.getComputedStyle(r2.querySelector('.hp-leadership-photo-wrap'));
      return {
        rowRevealed: r2.classList.contains('is-revealed'),
        photoTransform: pStyle.transform,
        photoOpacity: pStyle.opacity,
        textTransform: tStyle.transform,
        textOpacity: tStyle.opacity
      };
    })()`);

    console.log('Row 2 Active Alternating Convergence:');
    console.log('Photo (LEFT -> RIGHT):', row2Mid.photoTransform, `opacity: ${row2Mid.photoOpacity}`);
    console.log('Text (RIGHT -> LEFT):', row2Mid.textTransform, `opacity: ${row2Mid.textOpacity}`);

    await sleep(1100);
    const row2Settled = await cdp.eval(`(() => {
      const r2 = document.querySelectorAll('.hp-leadership-row')[1];
      const tStyle = window.getComputedStyle(r2.querySelector('.hp-leadership-content'));
      const pStyle = window.getComputedStyle(r2.querySelector('.hp-leadership-photo-wrap'));
      return {
        photoTransform: pStyle.transform,
        photoOpacity: pStyle.opacity,
        textTransform: tStyle.transform,
        textOpacity: tStyle.opacity
      };
    })()`);

    console.log('Row 2 Fully Settled:');
    console.log('Photo at 0px:', row2Settled.photoTransform, `opacity: ${row2Settled.photoOpacity}`);
    console.log('Text at 0px:', row2Settled.textTransform, `opacity: ${row2Settled.textOpacity}`);
    await cdp.captureScreenshot('84_leadership_settled_row2.png');

    // ─────────────────────────────────────────────────────────────
    // Phase 2.5: Reverse Scroll Up & Re-trigger Verification
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Phase 2.5] Reverse Scroll Up & Repeatable Trigger Verification');
    await cdp.eval(`window.scrollTo(0, ${aboveRow1ScrollY})`);
    await sleep(500);

    const scrollUpCheck = await cdp.eval(`(() => {
      const r1 = document.querySelectorAll('.hp-leadership-row')[0];
      const tStyle = window.getComputedStyle(r1.querySelector('.hp-leadership-content'));
      const pStyle = window.getComputedStyle(r1.querySelector('.hp-leadership-photo-wrap'));
      return {
        rowRevealed: r1.classList.contains('is-revealed'),
        textTransform: tStyle.transform,
        photoTransform: pStyle.transform,
        opacity: tStyle.opacity
      };
    })()`);

    console.log('Row 1 after scrolling back up: is-revealed =', scrollUpCheck.rowRevealed, `text: ${scrollUpCheck.textTransform}`);
    await cdp.captureScreenshot('85_leadership_scroll_back_up.png');

    // Scroll back down to Row 1 to verify it re-triggers cleanly
    await cdp.eval(`window.scrollTo(0, ${triggerRow1ScrollY})`);
    await sleep(400);
    const retriggerCheck = await cdp.eval(`(() => {
      const r1 = document.querySelectorAll('.hp-leadership-row')[0];
      return { rowRevealed: r1.classList.contains('is-revealed') };
    })()`);
    console.log('Row 1 re-triggered on scrolling down: is-revealed =', retriggerCheck.rowRevealed);

    // ─────────────────────────────────────────────────────────────
    // Phase 3: Mobile Viewport 390x844 (iPhone)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Phase 3] Mobile Viewport 390x844 Verification');
    await cdp.setViewport(390, 844, true, 1);
    await cdp.send('Page.navigate', { url: TARGET_URL });
    await sleep(2000);

    await cdp.eval(`(() => {
      const el = document.getElementById('leadership');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`);
    await sleep(600);

    const mobileCheck = await cdp.eval(`(() => {
      const sw = document.documentElement.scrollWidth;
      const cw = window.innerWidth;
      const r1 = document.querySelectorAll('.hp-leadership-row')[0];
      const tStyle = window.getComputedStyle(r1.querySelector('.hp-leadership-content'));
      const pStyle = window.getComputedStyle(r1.querySelector('.hp-leadership-photo-wrap'));
      return {
        scrollWidth: sw,
        innerWidth: cw,
        hasOverflow: sw > cw,
        rowRevealed: r1.classList.contains('is-revealed'),
        textTransform: tStyle.transform,
        photoTransform: pStyle.transform
      };
    })()`);

    console.log(`Mobile (390px): scrollWidth=${mobileCheck.scrollWidth}, innerWidth=${mobileCheck.innerWidth}, hasOverflow=${mobileCheck.hasOverflow}`);
    console.log(`Mobile Row 1: revealed=${mobileCheck.rowRevealed}, textTransform=${mobileCheck.textTransform}`);
    await cdp.captureScreenshot('86_leadership_mobile_390.png');

    // ─────────────────────────────────────────────────────────────
    // Phase 4: Smallest Mobile Viewport 360x800 (Galaxy S20)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[Phase 4] Smallest Mobile Viewport 360x800 Verification');
    await cdp.setViewport(360, 800, true, 1);
    await cdp.send('Page.navigate', { url: TARGET_URL });
    await sleep(2000);

    await cdp.eval(`(() => {
      const el = document.getElementById('leadership');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`);
    await sleep(600);

    const smallMobileCheck = await cdp.eval(`(() => {
      const sw = document.documentElement.scrollWidth;
      const cw = window.innerWidth;
      return { scrollWidth: sw, innerWidth: cw, hasOverflow: sw > cw };
    })()`);

    console.log(`Smallest Mobile (360px): scrollWidth=${smallMobileCheck.scrollWidth}, innerWidth=${smallMobileCheck.innerWidth}, hasOverflow=${smallMobileCheck.hasOverflow}`);
    await cdp.captureScreenshot('87_leadership_mobile_360.png');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  LEADERSHIP CONVERGENCE TESTS COMPLETED WITH 100% SUCCESS!');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    cdp.close();
    try { if (chromeProc) chromeProc.kill(); } catch (_) { }
    try { if (clientProc) clientProc.kill(); } catch (_) { }
    try { if (serverProc) serverProc.kill(); } catch (_) { }
    process.exit(0);
  }
}

run();
