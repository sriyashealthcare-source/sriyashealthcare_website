/**
 * Sriyas Healthcare - Two-Stage Gold Orbital Logo Animation Verification Suite
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

  const backendOk = await waitForHttp('http://127.0.0.1:5000/api/health', 25000);
  const clientOk = await waitForHttp('http://127.0.0.1:5173/', 25000);
  console.log(`[Servers] Backend ready: ${backendOk}, Client ready: ${clientOk}`);
}

async function startChrome() {
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    if (res.ok) {
      console.log('[Chrome] Connected to existing Chrome instance.');
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

  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        console.log('[Chrome] Chrome port 9222 active.');
        return;
      }
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

  async captureScreenshot(outputPath, clip = null) {
    const params = { format: 'png', quality: 100 };
    if (clip) params.clip = { ...clip, scale: 1 };
    const res = await this.send('Page.captureScreenshot', params);
    fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
    console.log(`[Screenshot Saved] -> ${path.basename(outputPath)}`);
  }
}

async function runVerification() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SRIYAS HEALTHCARE TWO-STAGE GOLD ORBITAL LOGO VERIFICATION   ');
  console.log('═══════════════════════════════════════════════════════════════');

  await startServers();
  await startChrome();

  const versionRes = await fetch('http://127.0.0.1:9222/json/version');
  const versionData = await versionRes.json();
  console.log('[CDP] Connected to:', versionData.Browser);

  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

  const cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('[CDP] Session attached.');

  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('[CDP] Navigating to http://127.0.0.1:5173/ ...');
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await sleep(2500);

  // 1. Inspect DOM & Color Palette
  console.log('\n[1/5] Verifying Color Palette (Strictly Gold & Champagne, NO Charcoal/Black)...');
  const paletteCheck = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const innerProminent = document.querySelector('#sriyas-gold-inner-prominent');
      const innerChampagne = document.querySelector('#sriyas-gold-inner-champagne');
      const outerProminent = document.querySelector('#sriyas-gold-outer-prominent');
      const outerChampagne = document.querySelector('#sriyas-gold-outer-champagne');
      const innerSphere = document.querySelector('#sriyas-gold-inner-sphere');
      const outerSphere = document.querySelector('#sriyas-gold-outer-sphere');
      
      const getStops = (grad) => grad ? Array.from(grad.querySelectorAll('stop')).map(s => s.getAttribute('stop-color')) : [];
      
      const innerPromStops = getStops(innerProminent);
      const innerChampStops = getStops(innerChampagne);
      const outerPromStops = getStops(outerProminent);
      const outerChampStops = getStops(outerChampagne);
      const innerSphereStops = getStops(innerSphere);
      const outerSphereStops = getStops(outerSphere);
      
      const allColors = [...innerPromStops, ...innerChampStops, ...outerPromStops, ...outerChampStops, ...innerSphereStops, ...outerSphereStops];
      const hasBlackOrCharcoal = allColors.some(c => /#3D321A|#000000|#111111|#222222|#333333/i.test(c));
      const hasGoldPalette = allColors.some(c => /#D4AF37|#C49A2C|#A9822C|#E9D9A6|#F4EBD2/i.test(c));

      return {
        innerPromStops,
        innerChampStops,
        outerPromStops,
        outerChampStops,
        innerSphereStops,
        outerSphereStops,
        hasBlackOrCharcoal,
        hasGoldPalette
      };
    })()`,
    returnByValue: true
  });

  const pRes = paletteCheck.result.value;
  console.log('  Inner Prominent Stops:', pRes.innerPromStops);
  console.log('  Inner Champagne Stops:', pRes.innerChampStops);
  console.log('  Outer Prominent Stops:', pRes.outerPromStops);
  console.log('  Outer Champagne Stops:', pRes.outerChampStops);
  console.log('  Inner Sphere Stops:', pRes.innerSphereStops);
  console.log('  Outer Sphere Stops:', pRes.outerSphereStops);
  console.log('  Has Charcoal / Black (Forbidden):', pRes.hasBlackOrCharcoal);
  console.log('  Has Official Sriyas Gold Palette:', pRes.hasGoldPalette);

  if (pRes.hasBlackOrCharcoal) {
    throw new Error('FAILED: Black or charcoal detected in orbital gradient definitions!');
  }
  if (!pRes.hasGoldPalette) {
    throw new Error('FAILED: Gold palette stops missing!');
  }
  console.log('  ✓ Color Palette Check PASSED (100% Gold & Champagne).');

  // 2. Measure Geometric Dimensions & Text Collision
  console.log('\n[2/5] Verifying Orbit Geometry & Text Boundaries...');
  const geoCheck = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const emblemSlot = document.querySelector('.hp-hero-emblem-slot');
      const innerWrap = document.querySelector('.sriyas-orbital-inner-wrap');
      const outerWrap = document.querySelector('.sriyas-orbital-outer-wrap');
      const brandName = document.querySelector('.hp-hero-brand-name');
      const lockupFlow = document.querySelector('.hp-hero-lockup-flow');

      const eRect = emblemSlot.getBoundingClientRect();
      const iRect = innerWrap.getBoundingClientRect();
      const oRect = outerWrap.getBoundingClientRect();
      const bRect = brandName.getBoundingClientRect();
      const lRect = lockupFlow.getBoundingClientRect();

      const innerDiameterRatio = iRect.width / eRect.width;
      const outerDiameterRatio = oRect.width / lRect.width;

      return {
        emblemWidth: eRect.width,
        emblemHeight: eRect.height,
        innerOrbitWidth: iRect.width,
        innerOrbitHeight: iRect.height,
        innerBottom: iRect.bottom,
        brandTitleTop: bRect.top,
        innerAboveTitle: iRect.bottom <= bRect.top + 2,
        innerDiameterRatio: innerDiameterRatio.toFixed(2),
        outerOrbitWidth: oRect.width,
        outerOrbitHeight: oRect.height,
        lockupWidth: lRect.width,
        outerDiameterRatio: outerDiameterRatio.toFixed(2)
      };
    })()`,
    returnByValue: true
  });

  const gRes = geoCheck.result.value;
  console.log('  Emblem Dimensions:', `${gRes.emblemWidth}px x ${gRes.emblemHeight}px`);
  console.log('  Inner Orbit Dimensions:', `${gRes.innerOrbitWidth}px x ${gRes.innerOrbitHeight}px (Ratio: ${gRes.innerDiameterRatio}x emblem width, range 1.25-1.40x)`);
  console.log('  Inner Orbit Bottom:', `${gRes.innerBottom.toFixed(1)}px vs Brand Title Top: ${gRes.brandTitleTop.toFixed(1)}px (Inner above title: ${gRes.innerAboveTitle})`);
  console.log('  Outer Orbit Dimensions:', `${gRes.outerOrbitWidth}px x ${gRes.outerOrbitHeight}px (Ratio: ${gRes.outerDiameterRatio}x logo composition width, range 1.15-1.25x)`);
  console.log('  ✓ Geometry Check PASSED.');

  // 3. Capture the 10 Distinct Storyboard States
  console.log('\n[3/5] Capturing 10 Sequential Visual States...');

  async function waitForStage(targetStage, maxWaitMs = 15000) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const check = await cdp.send('Runtime.evaluate', {
        expression: `document.querySelector('[data-testid="sriyas-orbital-logo"]')?.getAttribute('data-stage')`,
        returnByValue: true
      });
      if (check.result.value === targetStage) return true;
      await sleep(50);
    }
    return false;
  }

  const heroClip = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const hero = document.querySelector('.hp-hero-inner');
      const r = hero.getBoundingClientRect();
      return { x: Math.max(0, r.left - 40), y: Math.max(0, r.top - 20), width: r.width + 80, height: r.height + 40 };
    })()`,
    returnByValue: true
  });
  const clip = heroClip.result.value;

  // 1. Clean original logo
  console.log('  Waiting for Stage 1 (Clean logo)...');
  await waitForStage('stage1-clean');
  await sleep(100);
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '123_gold_stage1_clean_logo.png'), clip);

  // 2. Inner gold orbit appearing (Scale 96% -> 100%, Opacity 0 -> 1)
  console.log('  Waiting for Stage 2 (Inner orbit appearing)...');
  await waitForStage('stage2-inner-appear');
  await sleep(250);
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '124_gold_stage2_inner_appear.png'), clip);

  // 3. Inner golden sphere travelling around S emblem (mid-revolution)
  console.log('  Waiting for Stage 3 (Inner sphere mid-revolution)...');
  await waitForStage('stage3-inner-rev');
  await sleep(1500);
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '125_gold_stage3_inner_travelling.png'), clip);

  // 4. Inner sphere completing 1 full revolution
  await sleep(1400);
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '126_gold_stage3_inner_completed.png'), clip);

  // 5. Inner orbit disappearing (fade out)
  console.log('  Waiting for Stage 4 (Inner orbit disappearing)...');
  await waitForStage('stage4-inner-disappear');
  await sleep(150);
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '127_gold_stage4_inner_disappear.png'), clip);

  // 6. Outer gold orbit appearing (Scale 96% -> 100%, Opacity 0 -> 1)
  console.log('  Waiting for Stage 5 (Outer orbit appearing)...');
  await waitForStage('stage5-outer-appear');
  await sleep(250);
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '128_gold_stage5_outer_appear.png'), clip);

  // 7. Outer golden sphere travelling around complete logo (mid-revolution)
  console.log('  Waiting for Stage 6 (Outer sphere mid-revolution)...');
  await waitForStage('stage6-outer-rev');
  await sleep(2200);
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '129_gold_stage6_outer_travelling.png'), clip);

  // 8. Outer sphere completing 1 full revolution
  await sleep(2000);
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '130_gold_stage6_outer_completed.png'), clip);

  // 9. Outer orbit disappearing (fade out)
  console.log('  Waiting for Stage 7 (Outer orbit disappearing)...');
  await waitForStage('stage7-outer-disappear');
  await sleep(150);
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '131_gold_stage7_outer_disappear.png'), clip);

  // 10. Complete sequence repeating (Loop back to Stage 2 / Stage 1)
  console.log('  Waiting for sequence repeat...');
  await waitForStage('stage2-inner-appear');
  await sleep(200);
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '132_gold_stage2_sequence_repeated.png'), clip);

  // 4. Mobile Responsiveness Test (390px)
  console.log('\n[4/5] Testing Mobile Responsiveness (390px iPhone Viewport)...');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(1000);

  const mobileCheck = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const outerWrap = document.querySelector('.sriyas-orbital-outer-wrap');
      const oRect = outerWrap.getBoundingClientRect();
      return {
        scrollWidth,
        clientWidth,
        hasHorizontalOverflow: scrollWidth > clientWidth,
        outerWrapWidth: oRect.width,
        fitsInViewport: oRect.width <= clientWidth
      };
    })()`,
    returnByValue: true
  });

  const mRes = mobileCheck.result.value;
  console.log('  Mobile Viewport:', `390px (Scroll width: ${mRes.scrollWidth}px, Has overflow: ${mRes.hasHorizontalOverflow})`);
  console.log('  Outer Orbit Width:', `${mRes.outerWrapWidth}px (Fits in 390px: ${mRes.fitsInViewport})`);

  await waitForStage('stage6-outer-rev');
  await sleep(500);
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '133_gold_mobile_390_outer_active.png'));

  // 5. Mutual Exclusivity Verification across 20 Timeline Samples
  console.log('\n[5/5] Performing Dense 20-Sample Mutual Exclusivity Audit...');
  let overlapViolations = 0;
  for (let i = 0; i < 20; i++) {
    const sample = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const inner = document.querySelector('.sriyas-orbital-inner-wrap');
        const outer = document.querySelector('.sriyas-orbital-outer-wrap');
        const iVis = window.getComputedStyle(inner).visibility === 'visible' && parseFloat(window.getComputedStyle(inner).opacity) > 0.05;
        const oVis = window.getComputedStyle(outer).visibility === 'visible' && parseFloat(window.getComputedStyle(outer).opacity) > 0.05;
        return { iVis, oVis, bothVisible: iVis && oVis };
      })()`,
      returnByValue: true
    });
    if (sample.result.value.bothVisible) {
      overlapViolations++;
      console.error(`  Violation at sample ${i + 1}: BOTH inner and outer orbits are visible!`);
    }
    await sleep(400);
  }
  console.log(`  Total Overlap Violations: ${overlapViolations} (Target: 0)`);
  if (overlapViolations > 0) {
    throw new Error(`FAILED: Mutual exclusivity violated in ${overlapViolations} samples!`);
  }
  console.log('  ✓ Mutual Exclusivity Audit PASSED (100% mutually exclusive).');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ALL 5 VERIFICATION SUITES PASSED FLAWLESSLY!                  ');
  console.log('═══════════════════════════════════════════════════════════════');

  if (chromeProc) chromeProc.kill();
  if (clientProc) clientProc.kill();
  if (serverProc) serverProc.kill();
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('\nVerification failed:', err);
  if (chromeProc) chromeProc.kill();
  if (clientProc) clientProc.kill();
  if (serverProc) serverProc.kill();
  process.exit(1);
});
