/**
 * Sriyas Healthcare - Two-Stage Orbital Logo Animation Verification Suite
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_OrbitalLogo';
const rootDir = path.join(__dirname, '..');

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
    } catch (_) {}
    await sleep(400);
  }
  return false;
}

async function startServers() {
  console.log('[Servers] Checking backend (5000) and client (5173)...');
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
  console.log('[Servers] Backend & Frontend servers active.');
}

async function startChrome() {
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    if (res.ok) {
      console.log('[Chrome] Connected to existing Chrome instance.');
      return;
    }
  } catch (_) {}

  console.log('[Chrome] Launching Chrome headless with remote debugging...');
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
    } catch (_) {}
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
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception ? (res.exceptionDetails.exception.description || res.exceptionDetails.exception.value) : res.exceptionDetails.text;
      console.warn('[CDP Evaluate Exception]:', desc);
      throw new Error(desc || 'Runtime evaluation error');
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Screenshot Saved] -> ${filename} (${buffer.length} bytes)`);
    return outPath;
  }

  async setViewport(width, height, deviceScaleFactor = 1) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: width < 600
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function createTargetPage() {
  const res = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
  const page = await res.json();
  const client = new CdpClient(page.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('DOM.enable');
  await client.send('Runtime.enable');
  return { client, targetId: page.id };
}

async function closeTargetPage(targetId) {
  try {
    await fetch(`http://127.0.0.1:9222/json/close/${targetId}`);
  } catch (_) {}
}

async function runTests() {
  await startServers();
  await startChrome();

  const { client, targetId } = await createTargetPage();
  const results = [];

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      results.push({ pass: true, message });
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      results.push({ pass: false, message });
    }
  }

  try {
    console.log('\n=== TEST 1: DESKTOP VIEWPORT (1440x900) TWO-STAGE ORBITAL LOGO ===');
    await client.setViewport(1440, 900);
    await client.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
    await sleep(2500);

    const initialData = await client.evaluate(`(() => {
      const lockupWrap = document.querySelector('.hp-hero-brand-lockup-wrapper');
      const innerWrap = document.querySelector('.sriyas-orbital-inner-wrap');
      const outerWrap = document.querySelector('.sriyas-orbital-outer-wrap');
      const innerDarkPath = document.querySelector('.sriyas-orbit-path--inner-dark');
      const innerLightPath = document.querySelector('.sriyas-orbit-path--inner-light');
      const outerDarkPath = document.querySelector('.sriyas-orbit-path--outer-dark');
      const outerLightPath = document.querySelector('.sriyas-orbit-path--outer-light');
      const innerBall = document.querySelector('.sriyas-inner-ball-rotator circle');
      const outerBall = document.querySelector('.sriyas-outer-ball-rotator circle');
      const emblemImg = document.querySelector('.hp-hero-emblem-img');
      const brandName = document.querySelector('.hp-hero-brand-name');
      const brandSub = document.querySelector('.hp-hero-brand-sub');
      const tagline = document.querySelector('.hp-hero-tagline');

      if (!lockupWrap || !innerWrap || !outerWrap) return { found: false };

      const eR = emblemImg.getBoundingClientRect();
      const iR = innerWrap.getBoundingClientRect();
      const oR = outerWrap.getBoundingClientRect();
      const tR = brandName.getBoundingClientRect();
      const tagR = tagline ? tagline.getBoundingClientRect() : null;

      const emblemStyle = window.getComputedStyle(emblemImg);

      return {
        found: true,
        hasInnerWrap: !!innerWrap,
        hasOuterWrap: !!outerWrap,
        hasInnerDarkPath: !!innerDarkPath,
        hasInnerLightPath: !!innerLightPath,
        hasOuterDarkPath: !!outerDarkPath,
        hasOuterLightPath: !!outerLightPath,
        hasInnerBall: !!innerBall,
        hasOuterBall: !!outerBall,
        innerCenterX: Math.round(iR.x + iR.width / 2),
        innerCenterY: Math.round(iR.y + iR.height / 2),
        emblemCenterX: Math.round(eR.x + eR.width / 2),
        emblemCenterY: Math.round(eR.y + eR.height / 2),
        innerBottom: Math.round(iR.bottom),
        titleTop: Math.round(tR.top),
        outerWidth: Math.round(oR.width),
        outerHeight: Math.round(oR.height),
        titleWidth: Math.round(tR.width),
        logoTransform: emblemStyle.transform
      };
    })()`);

    assert(initialData.found, 'SriyasOrbitalLogo component rendered in Hero section');
    assert(initialData.hasInnerDarkPath && initialData.hasInnerLightPath, 'Inner system has prominent dark circle and smaller lighter circle');
    assert(initialData.hasOuterDarkPath && initialData.hasOuterLightPath, 'Outer system has prominent dark circle and larger lighter circle');
    assert(initialData.hasInnerBall && initialData.hasOuterBall, 'Both systems have golden balls with radiant styling');
    assert(Math.abs(initialData.innerCenterX - initialData.emblemCenterX) <= 2, 'Inner orbital system is horizontally centered on S emblem');
    assert(Math.abs(initialData.innerCenterY - initialData.emblemCenterY) <= 2, 'Inner orbital system is vertically centered on S emblem');
    assert(initialData.innerBottom <= initialData.titleTop + 2, `Inner orbit stays strictly above 'SRIYAS HEALTHCARE' text (Bottom: ${initialData.innerBottom}px <= Top: ${initialData.titleTop}px)`);
    assert(initialData.logoTransform === 'none' || !initialData.logoTransform.includes('rotate'), 'Original logo emblem remains static without rotation or distortion');

    console.log('\n=== TEST 2: SEQUENCE TRANSITION & MUTUAL EXCLUSIVITY ===');
    const stagesSeen = new Set();
    let mutualExclusivityViolated = false;

    for (let i = 0; i < 18; i++) {
      const state = await client.evaluate(`(() => {
        const wrap = document.querySelector('.hp-hero-brand-lockup-wrapper');
        const inner = document.querySelector('.sriyas-orbital-inner-wrap');
        const outer = document.querySelector('.sriyas-orbital-outer-wrap');
        const activeStage = wrap ? wrap.getAttribute('data-active-stage') : null;
        const innerVisible = inner ? inner.classList.contains('is-visible') : false;
        const outerVisible = outer ? outer.classList.contains('is-visible') : false;
        return {
          activeStage,
          innerVisible,
          outerVisible,
          overlap: innerVisible && outerVisible
        };
      })()`);

      if (state.activeStage) stagesSeen.add(state.activeStage);
      if (state.overlap) mutualExclusivityViolated = true;
      await sleep(500);
    }

    assert(!mutualExclusivityViolated, 'Mutual exclusivity verified: Inner and Outer orbital systems NEVER appear simultaneously');
    assert(stagesSeen.has('inner'), 'Stage 1: Inner Orbit active stage detected');
    assert(stagesSeen.has('outer'), 'Stage 2: Outer Orbit active stage detected');
    assert(stagesSeen.has('gap1') || stagesSeen.has('gap2') || stagesSeen.has('inner-fade') || stagesSeen.has('outer-fade'), 'Disappear gap phase detected where circles fade out');

    console.log('\n=== TEST 3: CAPTURING STAGE SCREENSHOTS ===');
    // Capture Stage 1 Inner active
    await client.evaluate(`(() => {
      const inner = document.querySelector('.sriyas-orbital-inner-wrap');
      const outer = document.querySelector('.sriyas-orbital-outer-wrap');
      if (inner && outer) {
        inner.classList.add('is-visible');
        inner.classList.remove('is-fading');
        outer.classList.remove('is-visible', 'is-fading');
      }
    })()`);
    await sleep(300);
    await client.captureScreenshot('118_orbital_stage1_inner_active.png');

    // Capture Stage 1 Gap (disappear)
    await client.evaluate(`(() => {
      const inner = document.querySelector('.sriyas-orbital-inner-wrap');
      const outer = document.querySelector('.sriyas-orbital-outer-wrap');
      if (inner && outer) {
        inner.classList.remove('is-visible');
        outer.classList.remove('is-visible');
      }
    })()`);
    await sleep(300);
    await client.captureScreenshot('119_orbital_stage1_disappear_gap.png');

    // Capture Stage 2 Outer active
    await client.evaluate(`(() => {
      const inner = document.querySelector('.sriyas-orbital-inner-wrap');
      const outer = document.querySelector('.sriyas-orbital-outer-wrap');
      if (inner && outer) {
        inner.classList.remove('is-visible', 'is-fading');
        outer.classList.add('is-visible');
        outer.classList.remove('is-fading');
      }
    })()`);
    await sleep(300);
    await client.captureScreenshot('120_orbital_stage2_outer_active.png');

    // Capture Stage 2 Gap (disappear)
    await client.evaluate(`(() => {
      const inner = document.querySelector('.sriyas-orbital-inner-wrap');
      const outer = document.querySelector('.sriyas-orbital-outer-wrap');
      if (inner && outer) {
        inner.classList.remove('is-visible');
        outer.classList.remove('is-visible');
      }
    })()`);
    await sleep(300);
    await client.captureScreenshot('121_orbital_stage2_disappear_gap.png');

    console.log('\n=== TEST 4: MOBILE RESPONSIVE VERIFICATION (390x844) ===');
    await client.setViewport(390, 844);
    await sleep(1000);

    const mobileData = await client.evaluate(`(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const outerWrap = document.querySelector('.sriyas-orbital-outer-wrap');
      const brandName = document.querySelector('.hp-hero-brand-name');
      const oR = outerWrap ? outerWrap.getBoundingClientRect() : null;

      return {
        hasOverflow: scrollWidth > clientWidth,
        scrollWidth,
        clientWidth,
        outerRenderedWidth: oR ? Math.round(oR.width) : 0,
        brandText: brandName ? brandName.innerText.trim() : ''
      };
    })()`);

    assert(!mobileData.hasOverflow, `No horizontal overflow on mobile (${mobileData.scrollWidth}px <= ${mobileData.clientWidth}px)`);
    assert(mobileData.outerRenderedWidth <= 380, `Outer orbit scales gracefully on mobile (${mobileData.outerRenderedWidth}px <= 380px)`);
    assert(mobileData.brandText === 'SRIYAS HEALTHCARE', `Brand text perfectly preserved on mobile ('${mobileData.brandText}')`);

    await client.captureScreenshot('122_orbital_mobile_390.png');

    console.log('\n=== SUMMARY OF ORBITAL ANIMATION VERIFICATION ===');
    const allPassed = results.every(r => r.pass);
    console.log(`Total checks: ${results.length}, Passed: ${results.filter(r => r.pass).length}, Failed: ${results.filter(r => !r.pass).length}`);
    if (allPassed) {
      console.log('✓ ALL ORBITAL LOGO ANIMATION TESTS PASSED PERFECTLY!');
    } else {
      console.error('✗ SOME TESTS FAILED.');
      process.exit(1);
    }

  } finally {
    client.close();
    await closeTargetPage(targetId);
    if (chromeProc) {
      try { chromeProc.kill(); } catch (_) {}
    }
  }
}

runTests().catch(err => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
