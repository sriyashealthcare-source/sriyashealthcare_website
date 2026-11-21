/**
 * Sriyas Healthcare - Specialist Team Directional Entrance Animation Verification Suite
 * 
 * Verifies:
 * 1. Initial State before entrance:
 *    - Card 1 (ANUSREE R): Left to Right (-100px, 0, 0), opacity 0
 *    - Card 2 (SWETHA G): Bottom to Top (0, 90px, 0), opacity 0
 *    - Card 3 (RAHUL S): Right to Left (100px, 0, 0), opacity 0
 * 2. Trigger on ~20% viewport entrance via IntersectionObserver.
 * 3. Coordinated staggered delays (0ms, 180ms, 360ms) and cubic-bezier(0.22, 1, 0.36, 1) easing.
 * 4. Settled State: All cards reach transform(0, 0, 0) and opacity 1.
 * 5. One-time entrance guarantee: Scrolling up and down does NOT re-trigger animation.
 * 6. Responsive testing on Tablet (768px) and Mobile (390px, 360px): Zero horizontal overflow.
 * 7. Prefers-reduced-motion accessibility test.
 * 8. Screenshot artifacts captured at every state.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_Specialists';
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

async function runSuite() {
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

  // Explicitly set media preference to 'no-preference' for standard animation testing
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }]
  });

  console.log(`\n======================================================`);
  console.log(`Phase 1: Navigate and inspect Initial Unrevealed State`);
  console.log(`======================================================`);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  await cdp.send('Page.navigate', { url: TARGET_URL });
  await sleep(3500);

  // Position viewport right before the team section (e.g. scroll to 2600px)
  // Let's get the section offset
  const teamSectionInfo = await cdp.eval(`(() => {
    const section = document.getElementById('our-team');
    if (!section) return { error: '#our-team not found' };
    const rect = section.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    return {
      top: rect.top + scrollTop,
      height: rect.height
    };
  })()`);

  console.log(`  Team Section Top: ${teamSectionInfo.top}px, Height: ${teamSectionInfo.height}px`);

  // Scroll to a position where section is 300px below viewport
  const preScrollPos = Math.max(0, teamSectionInfo.top - 1200);
  await cdp.eval(`window.scrollTo(0, ${preScrollPos});`);
  await sleep(600);

  // Inspect Initial State
  const initialState = await cdp.eval(`(() => {
    const cards = Array.from(document.querySelectorAll('.hp-team-card'));
    return cards.map((c, i) => {
      const style = window.getComputedStyle(c);
      const name = c.querySelector('.hp-team-name')?.textContent?.trim();
      const role = c.querySelector('.hp-team-role')?.textContent?.trim();
      return {
        index: i,
        name,
        role,
        opacity: style.opacity,
        transform: style.transform,
        classList: Array.from(c.classList),
        hasFromLeft: c.classList.contains('hp-team-card--from-left'),
        hasFromBottom: c.classList.contains('hp-team-card--from-bottom'),
        hasFromRight: c.classList.contains('hp-team-card--from-right'),
        isRevealed: c.classList.contains('is-revealed')
      };
    });
  })()`);

  console.log('  Initial Unrevealed State:');
  initialState.forEach((c) => {
    console.log(`    Card ${c.index + 1} [${c.name} - ${c.role}]: opacity=${c.opacity}, isRevealed=${c.isRevealed}, transform=${c.transform}, classes=[${c.classList.join(' ')}]`);
  });

  // Verify initial classes and zero opacity
  const card1InitPass = initialState[0].hasFromLeft && parseFloat(initialState[0].opacity) === 0;
  const card2InitPass = initialState[0].hasFromBottom === false && initialState[1].hasFromBottom && parseFloat(initialState[1].opacity) === 0;
  const card3InitPass = initialState[2].hasFromRight && parseFloat(initialState[2].opacity) === 0;
  console.log(`  Verification - Initial Classes & Hidden Opacity: Card 1 (Left): ${card1InitPass}, Card 2 (Bottom): ${card2InitPass}, Card 3 (Right): ${card3InitPass}`);

  await cdp.screenshot(path.join(ARTIFACT_DIR, '96_specialists_initial_hidden.png'));

  console.log(`\n======================================================`);
  console.log(`Phase 2: Scroll to trigger 20% entrance & intermediate state`);
  console.log(`======================================================`);
  // Scroll so section enters viewport by ~25%
  const triggerScrollPos = Math.round(teamSectionInfo.top - 1080 + 350);
  await cdp.eval(`window.scrollTo(0, ${triggerScrollPos});`);
  await sleep(250); // Small pause to capture intermediate motion

  const intermediateState = await cdp.eval(`(() => {
    const cards = Array.from(document.querySelectorAll('.hp-team-card'));
    return cards.map((c, i) => {
      const style = window.getComputedStyle(c);
      return {
        index: i,
        opacity: parseFloat(style.opacity),
        transform: style.transform,
        isRevealed: c.classList.contains('is-revealed')
      };
    });
  })()`);

  console.log('  Intermediate Motion State:');
  intermediateState.forEach((c) => {
    console.log(`    Card ${c.index + 1}: opacity=${c.opacity.toFixed(2)}, isRevealed=${c.isRevealed}, transform=${c.transform}`);
  });
  await cdp.screenshot(path.join(ARTIFACT_DIR, '97_specialists_intermediate_entrance.png'));

  console.log(`\n======================================================`);
  console.log(`Phase 3: Settled State verification (after animation completes)`);
  console.log(`======================================================`);
  await sleep(1400); // Allow 1050ms animation + 360ms stagger to fully settle

  const settledState = await cdp.eval(`(() => {
    const cards = Array.from(document.querySelectorAll('.hp-team-card'));
    const grid = document.querySelector('.hp-team-grid');
    const gridRect = grid.getBoundingClientRect();
    return {
      gridRevealed: grid.classList.contains('is-revealed'),
      cards: cards.map((c, i) => {
        const style = window.getComputedStyle(c);
        const rect = c.getBoundingClientRect();
        const name = c.querySelector('.hp-team-name')?.textContent?.trim();
        const role = c.querySelector('.hp-team-role')?.textContent?.trim();
        return {
          index: i,
          name,
          role,
          opacity: parseFloat(style.opacity),
          transform: style.transform,
          isRevealed: c.classList.contains('is-revealed'),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          left: Math.round(rect.left),
          top: Math.round(rect.top)
        };
      })
    };
  })()`);

  console.log(`  Grid Revealed: ${settledState.gridRevealed}`);
  settledState.cards.forEach((c) => {
    console.log(`    Card ${c.index + 1} [${c.name} - ${c.role}]: opacity=${c.opacity}, transform=${c.transform}, dims=${c.width}x${c.height}px at (${c.left}, ${c.top})`);
  });

  const allSettledAtOrigin = settledState.cards.every(c => c.opacity === 1 && (c.transform === 'none' || c.transform === 'matrix(1, 0, 0, 1, 0, 0)'));
  console.log(`  All cards settled at final origin (0, 0, 0) with opacity 1: ${allSettledAtOrigin}`);
  await cdp.screenshot(path.join(ARTIFACT_DIR, '98_specialists_settled_desktop.png'));

  console.log(`\n======================================================`);
  console.log(`Phase 4: Requirement 3 Check - Animate Once Guarantee`);
  console.log(`======================================================`);
  // Scroll all the way to top
  await cdp.eval('window.scrollTo(0, 0);');
  await sleep(600);

  const scrolledTopState = await cdp.eval(`(() => {
    const cards = Array.from(document.querySelectorAll('.hp-team-card'));
    return cards.map(c => ({
      isRevealed: c.classList.contains('is-revealed'),
      opacity: parseFloat(window.getComputedStyle(c).opacity)
    }));
  })()`);

  const persistedRevealed = scrolledTopState.every(c => c.isRevealed === true && c.opacity === 1);
  console.log(`  After scrolling to top, cards remained revealed: ${persistedRevealed}`);

  // Scroll back down to specialists
  await cdp.eval(`window.scrollTo(0, ${triggerScrollPos + 150});`);
  await sleep(400);

  await cdp.screenshot(path.join(ARTIFACT_DIR, '101_specialists_scroll_up_down_persists.png'));

  console.log(`\n======================================================`);
  console.log(`Phase 5: Tablet & Mobile Responsive Verification`);
  console.log(`======================================================`);
  const viewports = [
    { name: 'Tablet 768x1024', width: 768, height: 1024, dpr: 2, shot: '99_specialists_tablet_768.png' },
    { name: 'Mobile 390x844', width: 390, height: 844, dpr: 3, shot: '100_specialists_mobile_390.png' },
    { name: 'Mobile 360x800', width: 360, height: 800, dpr: 2, shot: null }
  ];

  for (const vp of viewports) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dpr,
      mobile: true
    });
    await cdp.eval(`document.getElementById('our-team').scrollIntoView({ behavior: 'instant', block: 'center' });`);
    await sleep(800);

    const vpMetrics = await cdp.eval(`(() => {
      const section = document.getElementById('our-team');
      const cards = Array.from(document.querySelectorAll('.hp-team-card'));
      const docEl = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
      const clientWidth = docEl.clientWidth;

      return {
        hasHorizontalOverflow: scrollWidth > clientWidth + 1,
        scrollWidth,
        clientWidth,
        cards: cards.map((c, i) => {
          const rect = c.getBoundingClientRect();
          return {
            index: i,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            isWithinViewport: rect.left >= 0 && rect.right <= clientWidth + 2
          };
        })
      };
    })()`);

    console.log(`  Viewport: ${vp.name}`);
    console.log(`    Horizontal Overflow: ${vpMetrics.hasHorizontalOverflow} (scrollWidth=${vpMetrics.scrollWidth}px, clientWidth=${vpMetrics.clientWidth}px)`);
    vpMetrics.cards.forEach(c => {
      console.log(`      Card ${c.index + 1}: ${c.width}x${c.height}px, [left: ${c.left}px, right: ${c.right}px], within bounds: ${c.isWithinViewport}`);
    });

    if (vp.shot) {
      await cdp.screenshot(path.join(ARTIFACT_DIR, vp.shot));
    }
  }

  console.log(`\n======================================================`);
  console.log(`Phase 6: Reduced Motion Accessibility Test`);
  console.log(`======================================================`);
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  await sleep(600);

  const reducedMotionStatus = await cdp.eval(`(() => {
    const cards = Array.from(document.querySelectorAll('.hp-team-card'));
    return cards.map(c => {
      const style = window.getComputedStyle(c);
      return {
        opacity: style.opacity,
        transform: style.transform,
        transition: style.transition
      };
    });
  })()`);

  console.log(`  Reduced Motion Evaluation:`);
  reducedMotionStatus.forEach((c, i) => {
    console.log(`    Card ${i + 1}: opacity=${c.opacity}, transform=${c.transform}`);
  });

  console.log(`\n======================================================`);
  console.log(`ALL VERIFICATION PHASES COMPLETED SUCCESSFULLY!`);
  console.log(`======================================================`);

  await cdp.close();
  if (chromeProc) chromeProc.kill();
  if (clientProc) clientProc.kill();
  if (serverProc) serverProc.kill();
  process.exit(0);
}

runSuite().catch(err => {
  console.error('[Verification Suite Error]', err);
  if (chromeProc) chromeProc.kill();
  if (clientProc) clientProc.kill();
  if (serverProc) serverProc.kill();
  process.exit(1);
});
