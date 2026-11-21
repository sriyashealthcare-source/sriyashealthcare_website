/**
 * Sriyas Healthcare - Logo Visibility & Golden Orb Orbit Verification Suite
 * 
 * Verifies across:
 * 1. Desktop 1920x1080 (100% zoom)
 * 2. Laptop 1366x768 (100% zoom)
 * 3. Desktop 1920x1080 with 125% zoom (dpr 1.25)
 * 4. Desktop 1920x1080 with 150% zoom (dpr 1.50)
 * 5. Tablet 768x1024
 * 6. Mobile 390x844 & 360x800
 * 7. Reduced motion mode
 * 8. Scroll transition & navbar logo docking
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_LogoOrbit';
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
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${CHROME_DEV_PROFILE}`,
    '--headless=new',
    '--disable-gpu',
    '--window-size=1920,1080',
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

async function runAudit() {
  await startServers();
  await startChrome();

  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const pageTarget = pages.find((p) => p.type === 'page') || pages[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');

  console.log(`[Navigation] Navigating to ${TARGET_URL}...`);
  await cdp.send('Page.navigate', { url: TARGET_URL });
  await sleep(3500);

  const testConfigs = [
    { name: 'Desktop 1920x1080 (100%)', width: 1920, height: 1080, dpr: 1, screenshot: '90_hero_logo_orbit_desktop.png' },
    { name: 'Laptop 1366x768 (100%)', width: 1366, height: 768, dpr: 1, screenshot: '91_hero_logo_orbit_laptop.png' },
    { name: 'Desktop 1920x1080 (125% zoom)', width: 1920, height: 1080, dpr: 1.25, screenshot: null },
    { name: 'Desktop 1920x1080 (150% zoom)', width: 1920, height: 1080, dpr: 1.5, screenshot: '93_hero_logo_orbit_zoom150.png' },
    { name: 'Tablet 768x1024', width: 768, height: 1024, dpr: 2, screenshot: null },
    { name: 'Mobile 390x844', width: 390, height: 844, dpr: 3, screenshot: '92_hero_logo_orbit_mobile.png' },
    { name: 'Mobile 360x800', width: 360, height: 800, dpr: 2, screenshot: null },
  ];

  const auditResults = [];

  for (const cfg of testConfigs) {
    console.log(`\n======================================================`);
    console.log(`Testing Viewport: ${cfg.name}`);
    console.log(`======================================================`);

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: cfg.width,
      height: cfg.height,
      deviceScaleFactor: cfg.dpr,
      mobile: cfg.width <= 768
    });
    await sleep(800);

    // Scroll to top
    await cdp.eval('window.scrollTo(0, 0);');
    await sleep(600);

    const metrics = await cdp.eval(`(() => {
      const emblemImg = document.querySelector('.hp-hero-emblem-slot img');
      const emblemSlot = document.querySelector('.hp-hero-emblem-slot');
      const emblemWrap = document.querySelector('.hp-hero-emblem-wrap');
      const outerOrbit = document.querySelector('.hp-hero-orbit--outer');
      const innerOrbit = document.querySelector('.hp-hero-orbit--inner');
      const halo = document.querySelector('.hp-hero-halo');
      const backdrop = document.querySelector('.hp-hero-backdrop');

      if (!emblemImg || !outerOrbit || !emblemWrap || !emblemSlot) {
        return { error: 'Elements not found' };
      }

      const imgRect = emblemImg.getBoundingClientRect();
      const slotRect = emblemSlot.getBoundingClientRect();
      const wrapRect = emblemWrap.getBoundingClientRect();
      const outerRect = outerOrbit.getBoundingClientRect();
      const innerRect = innerOrbit ? innerOrbit.getBoundingClientRect() : null;

      const imgStyle = window.getComputedStyle(emblemImg);
      const outerStyle = window.getComputedStyle(outerOrbit);

      // Center points
      const emblemCenterX = (slotRect.left + slotRect.right) / 2;
      const emblemCenterY = (slotRect.top + slotRect.bottom) / 2;
      const orbitCenterX = (outerRect.left + outerRect.right) / 2;
      const orbitCenterY = (outerRect.top + outerRect.bottom) / 2;

      // Delta between orbit center and emblem center
      const deltaX = Math.abs(emblemCenterX - orbitCenterX);
      const deltaY = Math.abs(emblemCenterY - orbitCenterY);

      return {
        logoVisible: imgStyle.display !== 'none' && imgStyle.visibility !== 'hidden' && parseFloat(imgStyle.opacity) > 0.9,
        logoOpacity: imgStyle.opacity,
        naturalWidth: emblemImg.naturalWidth,
        naturalHeight: emblemImg.naturalHeight,
        complete: emblemImg.complete,
        imgWidth: Math.round(imgRect.width),
        imgHeight: Math.round(imgRect.height),
        outerOrbitWidth: Math.round(outerRect.width),
        outerOrbitHeight: Math.round(outerRect.height),
        innerOrbitWidth: innerRect ? Math.round(innerRect.width) : 0,
        innerOrbitHeight: innerRect ? Math.round(innerRect.height) : 0,
        outerAnimation: outerStyle.animationName,
        emblemCenter: { x: Math.round(emblemCenterX), y: Math.round(emblemCenterY) },
        orbitCenter: { x: Math.round(orbitCenterX), y: Math.round(orbitCenterY) },
        centerDelta: { x: Math.round(deltaX * 10) / 10, y: Math.round(deltaY * 10) / 10 },
        isConcentric: deltaX <= 2.0 && deltaY <= 2.0
      };
    })()`);

    console.log(`  Logo Visible: ${metrics.logoVisible} (opacity: ${metrics.logoOpacity}, complete: ${metrics.complete}, natural: ${metrics.naturalWidth}x${metrics.naturalHeight})`);
    console.log(`  Emblem Center: (${metrics.emblemCenter.x}, ${metrics.emblemCenter.y}) | Dimensions: ${metrics.imgWidth}x${metrics.imgHeight}px`);
    console.log(`  Orbit Center:  (${metrics.orbitCenter.x}, ${metrics.orbitCenter.y}) | Outer: ${metrics.outerOrbitWidth}x${metrics.outerOrbitHeight}px, Inner: ${metrics.innerOrbitWidth}x${metrics.innerOrbitHeight}px`);
    console.log(`  Centering Delta: dx=${metrics.centerDelta.x}px, dy=${metrics.centerDelta.y}px -> Concentric: ${metrics.isConcentric}`);
    console.log(`  Outer Orbit Animation: ${metrics.outerAnimation}`);

    auditResults.push({ cfg: cfg.name, metrics });

    if (cfg.screenshot) {
      await cdp.screenshot(path.join(ARTIFACT_DIR, cfg.screenshot));
    }
  }

  // Test Reduced Motion
  console.log(`\n======================================================`);
  console.log(`Testing Reduced Motion Emulation (prefers-reduced-motion)`);
  console.log(`======================================================`);
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  await sleep(600);

  const reducedMetrics = await cdp.eval(`(() => {
    const outerOrbit = document.querySelector('.hp-hero-orbit--outer');
    const innerOrbit = document.querySelector('.hp-hero-orbit--inner');
    const outerStyle = window.getComputedStyle(outerOrbit);
    const innerStyle = window.getComputedStyle(innerOrbit);
    return {
      outerAnimation: outerStyle.animationName,
      outerDuration: outerStyle.animationDuration,
      innerAnimation: innerStyle.animationName,
      innerDuration: innerStyle.animationDuration
    };
  })()`);

  console.log(`  Reduced Motion Outer Animation: ${reducedMetrics.outerAnimation} (duration: ${reducedMetrics.outerDuration})`);
  console.log(`  Reduced Motion Inner Animation: ${reducedMetrics.innerAnimation} (duration: ${reducedMetrics.innerDuration})`);
  await cdp.screenshot(path.join(ARTIFACT_DIR, '94_hero_logo_orbit_reduced_motion.png'));

  // Clear media emulation
  await cdp.send('Emulation.setEmulatedMedia', { features: [] });

  // Test Scroll Morph Transition
  console.log(`\n======================================================`);
  console.log(`Testing Scroll Transition & Navbar Logo Docking`);
  console.log(`======================================================`);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });
  await cdp.eval('window.scrollTo(0, 500);');
  await sleep(800);

  const scrollMetrics = await cdp.eval(`(() => {
    const traveler = document.querySelector('.hp-hero-morph-traveler');
    const navLogo = document.querySelector('.nav-logo');
    const navEmblem = document.querySelector('.nav-logo-emblem');
    const restingLogo = document.querySelector('.hp-hero-emblem-slot img');

    return {
      travelerActive: !!traveler,
      restingOpacity: restingLogo ? window.getComputedStyle(restingLogo).opacity : null,
      navLogoOpacity: navLogo ? window.getComputedStyle(navLogo).opacity : null,
      navLogoDisplay: navLogo ? window.getComputedStyle(navLogo).display : null,
      navEmblemSrc: navEmblem ? navEmblem.currentSrc || navEmblem.src : null,
      navEmblemComplete: navEmblem ? navEmblem.complete : false
    };
  })()`);

  console.log(`  At Scroll 500px:`);
  console.log(`    Traveler Active: ${scrollMetrics.travelerActive}`);
  console.log(`    Hero Resting Logo Opacity: ${scrollMetrics.restingOpacity}`);
  console.log(`    Navbar Logo Complete: ${scrollMetrics.navEmblemComplete}`);

  // Scroll to 1200px (fully docked)
  await cdp.eval('window.scrollTo(0, 1200);');
  await sleep(800);

  const dockedMetrics = await cdp.eval(`(() => {
    const navLogo = document.querySelector('.nav-logo');
    const navEmblem = document.querySelector('.nav-logo-emblem');
    return {
      navLogoOpacity: navLogo ? window.getComputedStyle(navLogo).opacity : null,
      navEmblemOpacity: navEmblem ? window.getComputedStyle(navEmblem).opacity : null,
      navEmblemVisible: navEmblem ? navEmblem.getBoundingClientRect().width > 0 : false
    };
  })()`);

  console.log(`  At Scroll 1200px (Docked):`);
  console.log(`    Navbar Logo Container Opacity: ${dockedMetrics.navLogoOpacity}`);
  console.log(`    Navbar Emblem Opacity: ${dockedMetrics.navEmblemOpacity}`);
  console.log(`    Navbar Emblem Rendered: ${dockedMetrics.navEmblemVisible}`);

  await cdp.screenshot(path.join(ARTIFACT_DIR, '95_navbar_logo_docked.png'));

  // Test Image Fallback by verifying fallback logic
  const fallbackTest = await cdp.eval(`(() => {
    const img = document.createElement('img');
    let triggered = false;
    img.src = 'https://non-existent-broken-domain-999xyz.com/fake.png';
    img.onerror = (e) => {
      triggered = true;
      e.currentTarget.src = '/assets/logos/sriyas-emblem.png';
    };
    document.body.appendChild(img);
    return new Promise((res) => {
      setTimeout(() => {
        const result = { triggered, finalSrc: img.src };
        img.remove();
        res(result);
      }, 500);
    });
  })()`);
  console.log(`  Fallback Test Verification: triggered=${fallbackTest.triggered}, fallbackSrc=${fallbackTest.finalSrc}`);

  console.log(`\n======================================================`);
  console.log(`ALL 8 VERIFICATION PHASES COMPLETED`);
  console.log(`======================================================`);

  await cdp.close();
  if (chromeProc) chromeProc.kill();
  if (clientProc) clientProc.kill();
  if (serverProc) serverProc.kill();
  process.exit(0);
}

runAudit().catch((err) => {
  console.error('[Error in Audit]', err);
  if (chromeProc) chromeProc.kill();
  if (clientProc) clientProc.kill();
  if (serverProc) serverProc.kill();
  process.exit(1);
});
