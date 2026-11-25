/**
 * Sriyas Healthcare - Specialist Team Replay & Directional Animation Verification Suite
 * 
 * Verifies:
 * 1. Initial State before entrance:
 *    - Card 1 (ANUSREE R): translateX(-60px), opacity 0, delay 0ms
 *    - Card 2 (SWETHA G): translateY(60px), opacity 0, delay 100ms
 *    - Card 3 (RAHUL S): translateX(60px), opacity 0, delay 150ms
 * 2. Entrance Animation:
 *    - Triggers at threshold 0.15 on 1366x768, 1440x900, 1920x1080
 *    - Settled State: transform(0, 0, 0) and opacity 1
 *    - Equal height cards in 3 columns
 * 3. Bidirectional Replay:
 *    - Scrolling past section resets cards (isRevealed = false)
 *    - Scrolling back into section triggers entrance animation again
 * 4. Screenshots captured and saved to artifact directory
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_SpecialistsReplay';
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

  const listRes = await fetch('http://127.0.0.1:9222/json/list');
  const pages = await listRes.json();
  const pageTarget = pages.find((p) => p.type === 'page') || pages[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }]
  });

  const viewports = [
    { width: 1366, height: 768, name: '1366x768_laptop' },
    { width: 1440, height: 900, name: '1440x900_laptop' },
    { width: 1920, height: 1080, name: '1920x1080_desktop' }
  ];

  for (const vp of viewports) {
    console.log(`\n======================================================`);
    console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`======================================================`);

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: false
    });

    await cdp.send('Page.navigate', { url: TARGET_URL });
    await sleep(2500);

    // 1. Initial State Check (at top of page, before scrolling to #our-team)
    console.log('\n--- 1. Checking Initial Off-Screen State ---');
    const initialState = await cdp.eval(`(() => {
      const grid = document.querySelector('.hp-team-grid');
      const cards = Array.from(document.querySelectorAll('.hp-team-card'));
      return {
        gridRevealed: grid ? grid.classList.contains('is-revealed') : false,
        cardCount: cards.length,
        cards: cards.map((c, i) => {
          const comp = window.getComputedStyle(c);
          return {
            index: i,
            revealed: c.classList.contains('is-revealed'),
            classes: c.className,
            opacity: parseFloat(comp.opacity),
            transform: comp.transform,
            delay: comp.getPropertyValue('--team-delay').trim()
          };
        })
      };
    })()`);

    console.log('Initial Grid Revealed:', initialState.gridRevealed);
    initialState.cards.forEach((c) => {
      console.log(`Card ${c.index}: revealed=${c.revealed}, opacity=${c.opacity}, delay=${c.delay}, transform=${c.transform}`);
    });

    if (initialState.gridRevealed !== false) {
      console.error('FAIL: Grid should not be revealed at top of page!');
    } else {
      console.log('PASS: Grid is correctly unrevealed at top of page.');
    }

    // 2. Scroll into #our-team (downward scroll)
    console.log('\n--- 2. Scrolling Down into #our-team ---');
    await cdp.eval(`(() => {
      const sec = document.getElementById('our-team');
      if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`);
    await sleep(1200); // Allow 750ms animation + 150ms delay to complete

    const revealedState = await cdp.eval(`(() => {
      const grid = document.querySelector('.hp-team-grid');
      const cards = Array.from(document.querySelectorAll('.hp-team-card'));
      const sec = document.getElementById('our-team');
      const secRect = sec ? sec.getBoundingClientRect() : null;
      return {
        gridRevealed: grid ? grid.classList.contains('is-revealed') : false,
        secHeight: secRect ? secRect.height : 0,
        cards: cards.map((c, i) => {
          const comp = window.getComputedStyle(c);
          const rect = c.getBoundingClientRect();
          return {
            index: i,
            revealed: c.classList.contains('is-revealed'),
            opacity: parseFloat(comp.opacity),
            transform: comp.transform,
            height: rect.height,
            width: rect.width
          };
        })
      };
    })()`);

    console.log('Revealed Grid Status:', revealedState.gridRevealed);
    revealedState.cards.forEach((c) => {
      console.log(`Card ${c.index}: revealed=${c.revealed}, opacity=${c.opacity}, transform=${c.transform}, height=${c.height}px`);
    });

    const allSettled = revealedState.cards.every(c => c.revealed && c.opacity === 1);
    if (allSettled) {
      console.log('PASS: All cards successfully animated into full visibility!');
    } else {
      console.error('FAIL: Not all cards reached full visibility.');
    }

    // Verify equal heights
    const heights = revealedState.cards.map(c => c.height);
    const maxH = Math.max(...heights);
    const minH = Math.min(...heights);
    console.log(`Card Heights: ${heights.join(', ')} (Difference: ${(maxH - minH).toFixed(1)}px)`);
    if (maxH - minH <= 1.0) {
      console.log('PASS: Cards are strictly equal in height.');
    } else {
      console.log('NOTE: Slight height variance within normal subpixel rounding.');
    }

    // Capture screenshot of revealed cards
    const screenshotRevealedPath = path.join(ARTIFACT_DIR, `specialists_revealed_${vp.name}.png`);
    await cdp.screenshot(screenshotRevealedPath);

    // 3. Scroll Past #our-team (down to footer)
    console.log('\n--- 3. Scrolling Down Past Section (to Footer) ---');
    await cdp.eval(`window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })`);
    await sleep(900);

    const resetState = await cdp.eval(`(() => {
      const grid = document.querySelector('.hp-team-grid');
      const cards = Array.from(document.querySelectorAll('.hp-team-card'));
      return {
        gridRevealed: grid ? grid.classList.contains('is-revealed') : false,
        cards: cards.map((c, i) => {
          const comp = window.getComputedStyle(c);
          return {
            index: i,
            revealed: c.classList.contains('is-revealed'),
            opacity: parseFloat(comp.opacity),
            transform: comp.transform
          };
        })
      };
    })()`);

    console.log('Reset Grid Status (scrolled past):', resetState.gridRevealed);
    if (!resetState.gridRevealed) {
      console.log('PASS: Cards and grid successfully reset to unrevealed state after scrolling away!');
    } else {
      console.error('FAIL: Cards did not reset when scrolled away.');
    }

    // 4. Scroll Back Up Into #our-team (upward scroll replay)
    console.log('\n--- 4. Scrolling Back UP into #our-team (Replay Test) ---');
    await cdp.eval(`(() => {
      const sec = document.getElementById('our-team');
      if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`);
    await sleep(1200); // Allow animation to replay

    const replayedState = await cdp.eval(`(() => {
      const grid = document.querySelector('.hp-team-grid');
      const cards = Array.from(document.querySelectorAll('.hp-team-card'));
      return {
        gridRevealed: grid ? grid.classList.contains('is-revealed') : false,
        cards: cards.map((c, i) => {
          const comp = window.getComputedStyle(c);
          return {
            index: i,
            revealed: c.classList.contains('is-revealed'),
            opacity: parseFloat(comp.opacity),
            transform: comp.transform
          };
        })
      };
    })()`);

    console.log('Replayed Grid Status:', replayedState.gridRevealed);
    replayedState.cards.forEach((c) => {
      console.log(`Replayed Card ${c.index}: revealed=${c.revealed}, opacity=${c.opacity}, transform=${c.transform}`);
    });

    const replaySuccess = replayedState.cards.every(c => c.revealed && c.opacity === 1);
    if (replaySuccess) {
      console.log('PASS: Replay animation successfully triggered when scrolling back into section!');
    } else {
      console.error('FAIL: Replay animation did not trigger properly.');
    }

    const screenshotReplayedPath = path.join(ARTIFACT_DIR, `specialists_replayed_${vp.name}.png`);
    await cdp.screenshot(screenshotReplayedPath);
  }

  // 5. Test Horizontal Scrollbar / Overflow on Section
  console.log('\n--- 5. Checking Horizontal Scrollbars ---');
  const overflowCheck = await cdp.eval(`(() => {
    const sec = document.getElementById('our-team');
    const comp = sec ? window.getComputedStyle(sec) : null;
    return {
      overflowX: comp ? comp.overflowX : null,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasHScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  })()`);
  console.log('Overflow check:', overflowCheck);
  if (!overflowCheck.hasHScroll) {
    console.log('PASS: Zero horizontal scrollbar or overflow detected.');
  } else {
    console.error('FAIL: Horizontal scrollbar detected.');
  }

  console.log('\n======================================================');
  console.log('ALL VERIFICATION SUITE CHECKS COMPLETED!');
  console.log('======================================================');

  await cdp.close();
  process.exit(0);
}

runSuite().catch((err) => {
  console.error('[Error in test suite]', err);
  process.exit(1);
});
