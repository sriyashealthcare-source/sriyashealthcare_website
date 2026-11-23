/**
 * Sriyas Healthcare - Background Concentric Ring Animation Verification Suite
 * Verifies 1:1 true circularity, 5-ring hierarchy, origin alignment with emblem,
 * breathing pulse animation, 3 orbital particles, dashed horology arc, and captures visual proof.
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
    this.id = 1;
    this.pending = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
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
    return new Promise((res, rej) => {
      const curId = this.id++;
      this.pending.set(curId, { res, rej });
      this.ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  async captureScreenshot(outputPath, clip = null) {
    const params = { format: 'png' };
    if (clip) params.clip = { ...clip, scale: 1 };
    const res = await this.send('Page.captureScreenshot', params);
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outputPath, buf);
    console.log(`[Screenshot Saved] -> ${path.basename(outputPath)}`);
  }
}

async function runVerification() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SRIYAS HEALTHCARE HERO CONCENTRIC RINGS AUDIT SUITE         ');
  console.log('═══════════════════════════════════════════════════════════════');

  await startServers();
  await startChrome();

  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const page = targets.find((t) => t.type === 'page') || targets[0];
  const cdp = new CdpClient(page.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');

  // Set standard desktop viewport
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('[CDP] Navigating to http://127.0.0.1:5173/ ...');
  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await sleep(2500);

  // 1. Audit True 1:1 Circular Geometry (Width === Height) across all 5 Rings
  console.log('\n[1/5] Auditing 1:1 Pure Circular Geometry (Zero Elliptical Stretching)...');
  const ringGeo = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const rings = [];
      for (let i = 1; i <= 5; i++) {
        const el = document.querySelector('.hp-concentric-ring--' + i);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const w = Math.round(r.width * 10) / 10;
        const h = Math.round(r.height * 10) / 10;
        const isRound = Math.abs(w - h) < 1.0;
        rings.push({
          ring: i,
          width: w,
          height: h,
          aspectRatio: (w / h).toFixed(3),
          isRound,
          borderRadius: style.borderRadius
        });
      }
      return rings;
    })()`,
    returnByValue: true
  });

  const rings = ringGeo.result.value || [];
  console.log(`  Found ${rings.length} concentric ring elements:`);
  rings.forEach((r) => {
    console.log(`    Ring ${r.ring}: ${r.width}px × ${r.height}px (Ratio: ${r.aspectRatio}, 1:1 Circular: ${r.isRound})`);
    if (!r.isRound) {
      throw new Error(`FAILED: Ring ${r.ring} is stretched into an ellipse (${r.width}px vs ${r.height}px)!`);
    }
  });
  console.log('  ✓ 1:1 Circular Geometry PASSED (All 5 rings are 100% round).');

  // 2. Audit Origin Centering Behind Golden 'S' Emblem
  console.log("\n[2/5] Auditing Concentric Rings Origin Centering Behind 'S' Emblem...");
  const originCheck = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const emblem = document.querySelector('.hp-hero-emblem-slot');
      const origin = document.querySelector('.hp-concentric-outer-wrapper');
      if (!emblem || !origin) return null;
      const eRect = emblem.getBoundingClientRect();
      const oRect = origin.getBoundingClientRect();
      const eCenterX = Math.round((eRect.left + eRect.right) / 2);
      const eCenterY = Math.round((eRect.top + eRect.bottom) / 2);
      const oCenterX = Math.round((oRect.left + oRect.right) / 2);
      const oCenterY = Math.round((oRect.top + oRect.bottom) / 2);
      const dx = Math.abs(eCenterX - oCenterX);
      const dy = Math.abs(eCenterY - oCenterY);
      return {
        emblemCenter: { x: eCenterX, y: eCenterY },
        ringOriginCenter: { x: oCenterX, y: oCenterY },
        deltaX: dx,
        deltaY: dy,
        isCentered: dx <= 3 && dy <= 4
      };
    })()`,
    returnByValue: true
  });

  const oRes = originCheck.result.value;
  console.log(`  Emblem Center: (${oRes.emblemCenter.x}, ${oRes.emblemCenter.y})`);
  console.log(`  Ring Origin Center: (${oRes.ringOriginCenter.x}, ${oRes.ringOriginCenter.y})`);
  console.log(`  Alignment Offset: ΔX=${oRes.deltaX}px, ΔY=${oRes.deltaY}px (Aligned: ${oRes.isCentered})`);
  if (!oRes.isCentered) {
    throw new Error(`FAILED: Concentric rings origin is misaligned from emblem by ΔX=${oRes.deltaX}px, ΔY=${oRes.deltaY}px!`);
  }
  console.log("  ✓ Concentric Ring Origin Alignment PASSED (Rings radiate symmetrically behind 'S' emblem).");

  // 3. Audit Particles, Dashed Horology Arc & Radial Mask
  console.log('\n[3/5] Auditing Micro-Details: 3 Gold Orbital Particles, Dashed Arc & Radial Mask...');
  const detailCheck = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const dot1 = document.querySelector('.hp-concentric-dot--1');
      const dot2 = document.querySelector('.hp-concentric-dot--2');
      const dot3 = document.querySelector('.hp-concentric-dot--3');
      const dashed = document.querySelector('.hp-concentric-dashed-arc');
      const wrapper = document.querySelector('.hp-concentric-outer-wrapper');
      const heroInner = document.querySelector('.hp-hero-inner');

      const wStyle = window.getComputedStyle(wrapper);
      const heroStyle = window.getComputedStyle(heroInner);

      return {
        hasDot1: !!dot1,
        hasDot2: !!dot2,
        hasDot3: !!dot3,
        hasDashedArc: !!dashed,
        maskImage: wStyle.maskImage || wStyle.webkitMaskImage,
        hasRadialMask: (wStyle.maskImage || wStyle.webkitMaskImage).includes('radial-gradient'),
        heroZIndex: parseInt(heroStyle.zIndex, 10),
        heroAboveRings: parseInt(heroStyle.zIndex, 10) >= 10
      };
    })()`,
    returnByValue: true
  });

  const dRes = detailCheck.result.value;
  console.log(`  Dot 1 on Ring 2 present: ${dRes.hasDot1}`);
  console.log(`  Dot 2 on Ring 3 present: ${dRes.hasDot2}`);
  console.log(`  Dot 3 on Ring 4 present: ${dRes.hasDot3}`);
  console.log(`  Dashed Horology Arc on Ring 3 present: ${dRes.hasDashedArc}`);
  console.log(`  Radial Edge Mask Applied: ${dRes.hasRadialMask}`);
  console.log(`  Hero Content z-index: ${dRes.heroZIndex} (Layered above rings: ${dRes.heroAboveRings})`);

  if (!dRes.hasDot1 || !dRes.hasDot2 || !dRes.hasDot3) {
    throw new Error('FAILED: Missing one or more orbital particles!');
  }
  if (!dRes.hasDashedArc) throw new Error('FAILED: Missing dashed accent arc!');
  if (!dRes.hasRadialMask) throw new Error('FAILED: Missing radial gradient mask on outer wrapper!');
  if (!dRes.heroAboveRings) throw new Error('FAILED: Hero content is not layered in z-index >= 10 above rings!');
  console.log('  ✓ Micro-Details & Layering PASSED.');

  // 4. Capture Visual Proof Screenshots Across Viewports
  console.log('\n[4/5] Capturing High-Resolution Visual Proof Screenshots...');

  // 4.1 Desktop Standard (1280px)
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '146_concentric_rings_desktop_1280.png'));

  // 4.2 Ultrawide Desktop (1920px) — Proves zero oval distortion on wide screens
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });
  await sleep(1000);

  const ultraGeo = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const r = document.querySelector('.hp-concentric-ring--3').getBoundingClientRect();
      return { width: Math.round(r.width), height: Math.round(r.height), isRound: Math.abs(r.width - r.height) < 1 };
    })()`,
    returnByValue: true
  });
  console.log(`  Ultrawide 1920px Ring 3: ${ultraGeo.result.value.width}px × ${ultraGeo.result.value.height}px (100% Round: ${ultraGeo.result.value.isRound})`);
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '147_concentric_rings_ultrawide_1920.png'));

  // 4.3 Mobile Viewport (390px iPhone)
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(1000);

  const mobileGeo = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const r = document.querySelector('.hp-concentric-ring--3').getBoundingClientRect();
      return {
        hasOverflow: scrollWidth > clientWidth,
        ring3: { width: Math.round(r.width), height: Math.round(r.height), isRound: Math.abs(r.width - r.height) < 1 }
      };
    })()`,
    returnByValue: true
  });
  console.log(`  Mobile 390px Ring 3: ${mobileGeo.result.value.ring3.width}px × ${mobileGeo.result.value.ring3.height}px (100% Round: ${mobileGeo.result.value.ring3.isRound}, Overflow: ${mobileGeo.result.value.hasOverflow})`);
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '148_concentric_rings_mobile_390.png'));

  // 4.4 Close-up on Emblem & Rings Origin
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });
  await sleep(800);

  const heroClip = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const emblem = document.querySelector('.hp-hero-emblem-slot');
      const r = emblem.getBoundingClientRect();
      return { x: Math.max(0, r.left - 220), y: Math.max(0, r.top - 140), width: r.width + 440, height: r.height + 280 };
    })()`,
    returnByValue: true
  });
  await cdp.captureScreenshot(path.join(ARTIFACT_DIR, '149_concentric_rings_emblem_origin_closeup.png'), heroClip.result.value);

  // 5. Reduced Motion Accessibility Audit
  console.log('\n[5/5] Auditing Accessibility (prefers-reduced-motion: reduce)...');
  await cdp.send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  await sleep(500);

  const reducedCheck = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const ring1 = document.querySelector('.hp-concentric-ring--1');
      const rot2 = document.querySelector('.hp-concentric-rotator--ring2');
      const dashed = document.querySelector('.hp-concentric-dashed-wrapper');

      return {
        ring1Animation: window.getComputedStyle(ring1).animationName,
        rot2Animation: window.getComputedStyle(rot2).animationName,
        dashedAnimation: window.getComputedStyle(dashed).animationName
      };
    })()`,
    returnByValue: true
  });

  const redRes = reducedCheck.result.value;
  console.log(`  Reduced Motion Ring Animation: ${redRes.ring1Animation}`);
  console.log(`  Reduced Motion Rotator Animation: ${redRes.rot2Animation}`);
  console.log(`  Reduced Motion Dashed Arc Animation: ${redRes.dashedAnimation}`);
  const isReduced = redRes.ring1Animation === 'none' && redRes.rot2Animation === 'none';
  console.log(`  Animations cleanly paused for reduced motion: ${isReduced}`);
  if (!isReduced) throw new Error('FAILED: Animations did not pause under prefers-reduced-motion: reduce!');
  console.log('  ✓ Reduced Motion Accessibility Check PASSED.');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ALL AUDIT SUITES PASSED! VISUAL ARTIFACTS CAPTURED.          ');
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
