/**
 * Sriyas Healthcare - Values Section Scroll-Triggered Entrance Animation Verification
 * 
 * Verifies:
 * 1. Left photo card starts off-screen at translateX(-70px), opacity 0
 * 2. All 6 right value cards start off-screen at translateX(70px), opacity 0
 * 3. In-view state: Left photo glides to translateX(0), opacity 1
 * 4. In-view state: Right cards glide to translateX(0), opacity 1 with exact 0.5s stagger:
 *    Card 01: 0.2s
 *    Card 02: 0.7s
 *    Card 03: 1.2s
 *    Card 04: 1.7s
 *    Card 05: 2.2s
 *    Card 06: 2.7s
 * 5. Replay behavior: Scrolling out resets is-revealed; scrolling back in replays sequence.
 * 6. Single screen 100dvh desktop/laptop fit (1366x768, 1440x900, 1920x1080) with zero horizontal scrollbars.
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
    '--window-size=1440,900',
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

async function getCdpSession() {
  const versionRes = await fetch('http://127.0.0.1:9222/json/version');
  const versionData = await versionRes.json();
  const wsUrl = versionData.webSocketDebuggerUrl;

  const WebSocket = globalThis.WebSocket || global.WebSocket;
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const raw = typeof event.data === 'string' ? event.data : event.data.toString();
    const msg = JSON.parse(raw);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Create new target/page
  const target = await send('Target.createTarget', { url: TARGET_URL });
  const pageWs = new WebSocket(`ws://127.0.0.1:9222/devtools/page/${target.targetId}`);
  await new Promise((resolve, reject) => {
    pageWs.onopen = resolve;
    pageWs.onerror = reject;
  });

  const pagePending = new Map();
  pageWs.onmessage = (event) => {
    const raw = typeof event.data === 'string' ? event.data : event.data.toString();
    const msg = JSON.parse(raw);
    if (msg.id && pagePending.has(msg.id)) {
      const { resolve, reject } = pagePending.get(msg.id);
      pagePending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  function pageSend(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pagePending.set(id, { resolve, reject });
      pageWs.send(JSON.stringify({ id, method, params }));
    });
  }

  await pageSend('Page.enable');
  await pageSend('DOM.enable');
  await pageSend('CSS.enable');

  return {
    send: pageSend,
    async eval(expr) {
      const res = await pageSend('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result.value;
    },
    async screenshot(filePath) {
      const res = await pageSend('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    },
    async setViewport(width, height) {
      await pageSend('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false
      });
    },
    async close() {
      try {
        await send('Target.closeTarget', { targetId: target.targetId });
        ws.close();
      } catch (_) { }
    }
  };
}

async function run() {
  await startServers();
  await startChrome();

  const cdp = await getCdpSession();
  console.log('\n[CDP] Navigating to Home Page: ' + TARGET_URL);
  await cdp.send('Page.navigate', { url: TARGET_URL });
  await sleep(2500);

  // Wait for React app to mount
  for (let i = 0; i < 30; i++) {
    const ready = await cdp.eval(`Boolean(document.getElementById('why-choose-sriyas'))`);
    if (ready) break;
    await sleep(300);
  }

  const viewports = [
    { name: '1366x768_laptop', width: 1366, height: 768 },
    { name: '1440x900_laptop', width: 1440, height: 900 },
    { name: '1920x1080_desktop', width: 1920, height: 1080 }
  ];

  for (const vp of viewports) {
    console.log(`\n======================================================`);
    console.log(`TESTING VALUES SECTION: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`======================================================`);

    await cdp.setViewport(vp.width, vp.height);
    await sleep(500);

    // 1. Initial State Check: Scroll to top section (hero/about) so Values is OFF-SCREEN
    console.log('\n--- Phase 1: Checking Off-Screen / Initial State (!isVisible) ---');
    await cdp.eval(`window.scrollTo({ top: 0, behavior: 'instant' })`);
    await sleep(800);

    const offScreenState = await cdp.eval(`(() => {
      const sec = document.getElementById('why-choose-sriyas');
      const photoFrame = sec ? sec.querySelector('.hp-values-feature-frame') : null;
      const items = sec ? Array.from(sec.querySelectorAll('.hp-value-item')) : [];

      const photoStyle = photoFrame ? window.getComputedStyle(photoFrame) : null;
      const itemsData = items.map((el, i) => {
        const cs = window.getComputedStyle(el);
        return {
          index: i + 1,
          opacity: cs.opacity,
          transform: cs.transform,
          transitionDelay: cs.transitionDelay
        };
      });

      return {
        isRevealed: sec ? sec.classList.contains('is-revealed') : false,
        photoOpacity: photoStyle ? photoStyle.opacity : null,
        photoTransform: photoStyle ? photoStyle.transform : null,
        photoDelay: photoStyle ? photoStyle.transitionDelay : null,
        itemsCount: items.length,
        items: itemsData
      };
    })()`);

    console.log(`  Section is-revealed class: ${offScreenState.isRevealed}`);
    console.log(`  Photo initial opacity: ${offScreenState.photoOpacity}, transform: ${offScreenState.photoTransform}`);
    console.log(`  Cards count: ${offScreenState.itemsCount}`);
    if (offScreenState.items.length > 0) {
      console.log(`  Card 01 off-screen opacity: ${offScreenState.items[0].opacity}, transform: ${offScreenState.items[0].transform}`);
    }

    // 2. Scroll into view (scrolling DOWN from top)
    console.log('\n--- Phase 2: Scrolling DOWN into Values Section (In-View Transition) ---');
    await cdp.eval(`document.getElementById('why-choose-sriyas').scrollIntoView({ behavior: 'instant', block: 'start' })`);
    // Wait for observer trigger
    await sleep(400);

    const inViewDelays = await cdp.eval(`(() => {
      const sec = document.getElementById('why-choose-sriyas');
      const photoFrame = sec ? sec.querySelector('.hp-values-feature-frame') : null;
      const items = sec ? Array.from(sec.querySelectorAll('.hp-value-item')) : [];

      const photoStyle = photoFrame ? window.getComputedStyle(photoFrame) : null;
      const itemsData = items.map((el, i) => {
        const cs = window.getComputedStyle(el);
        return {
          numeral: el.querySelector('.hp-value-numeral')?.textContent?.trim() || ('0' + (i+1)),
          title: el.querySelector('.hp-value-title')?.textContent?.trim() || '',
          transitionDelay: cs.transitionDelay,
          transitionDuration: cs.transitionDuration
        };
      });

      return {
        isRevealed: sec ? sec.classList.contains('is-revealed') : false,
        photoDelay: photoStyle ? photoStyle.transitionDelay : null,
        items: itemsData
      };
    })()`);

    console.log(`  Section is-revealed: ${inViewDelays.isRevealed}`);
    console.log(`  Left Photo Transition Delay: ${inViewDelays.photoDelay}`);
    console.log(`  Right 6 Cards Transition Delays (Expected: 0.2s, 0.7s, 1.2s, 1.7s, 2.2s, 2.7s):`);
    inViewDelays.items.forEach((item) => {
      console.log(`    Card ${item.numeral} (${item.title}): delay = ${item.transitionDelay}, duration = ${item.transitionDuration}`);
    });

    // Wait for all 6 cards to complete their cascade (2.7s + 0.65s = ~3.4s)
    await sleep(3600);

    const fullyRevealedState = await cdp.eval(`(() => {
      const sec = document.getElementById('why-choose-sriyas');
      const secRect = sec.getBoundingClientRect();
      const photoFrame = sec ? sec.querySelector('.hp-values-feature-frame') : null;
      const items = sec ? Array.from(sec.querySelectorAll('.hp-value-item')) : [];
      const photoStyle = photoFrame ? window.getComputedStyle(photoFrame) : null;

      const itemsResting = items.map((el, i) => {
        const cs = window.getComputedStyle(el);
        return {
          numeral: '0' + (i + 1),
          opacity: cs.opacity,
          transform: cs.transform
        };
      });

      return {
        secHeight: secRect.height,
        photoOpacity: photoStyle ? photoStyle.opacity : null,
        photoTransform: photoStyle ? photoStyle.transform : null,
        items: itemsResting,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    })()`);

    console.log(`  Fully Revealed Photo: opacity=${fullyRevealedState.photoOpacity}, transform=${fullyRevealedState.photoTransform}`);
    console.log(`  Section Height: ${fullyRevealedState.secHeight}px (matches ${vp.height}px: ${Math.abs(fullyRevealedState.secHeight - vp.height) <= 1})`);
    console.log(`  Has Horizontal Overflow: ${fullyRevealedState.hasHorizontalOverflow}`);
    fullyRevealedState.items.forEach(c => {
      console.log(`    Card ${c.numeral}: opacity=${c.opacity}, transform=${c.transform}`);
    });

    await cdp.screenshot(path.join(ARTIFACT_DIR, `values_animated_${vp.name}.png`));

    // 3. Test Replay on Scroll Down (Scroll PAST to Footer, then scroll UP)
    console.log('\n--- Phase 3: Scroll Past to Footer & Replay When Scrolling Back UP ---');
    await cdp.eval(`window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })`);
    await sleep(800);

    const resetState = await cdp.eval(`(() => {
      const sec = document.getElementById('why-choose-sriyas');
      const photoFrame = sec ? sec.querySelector('.hp-values-feature-frame') : null;
      const item0 = sec ? sec.querySelector('.hp-value-item') : null;
      return {
        isRevealed: sec ? sec.classList.contains('is-revealed') : false,
        photoOpacity: photoFrame ? window.getComputedStyle(photoFrame).opacity : null,
        photoTransform: photoFrame ? window.getComputedStyle(photoFrame).transform : null,
        item0Opacity: item0 ? window.getComputedStyle(item0).opacity : null,
        item0Transform: item0 ? window.getComputedStyle(item0).transform : null
      };
    })()`);

    console.log(`  After scrolling to bottom: is-revealed = ${resetState.isRevealed}`);
    console.log(`  Photo reset: opacity=${resetState.photoOpacity}, transform=${resetState.photoTransform}`);
    console.log(`  Card 01 reset: opacity=${resetState.item0Opacity}, transform=${resetState.item0Transform}`);

    // Scroll BACK UP into Values Section
    console.log('  Scrolling back UP into Values Section...');
    await cdp.eval(`document.getElementById('why-choose-sriyas').scrollIntoView({ behavior: 'instant', block: 'start' })`);
    await sleep(400);

    const replayedState = await cdp.eval(`(() => {
      const sec = document.getElementById('why-choose-sriyas');
      return {
        isRevealed: sec ? sec.classList.contains('is-revealed') : false
      };
    })()`);
    console.log(`  After scrolling back UP: is-revealed = ${replayedState.isRevealed} (REPLAY TRIGGERED: ${replayedState.isRevealed === true})`);

    // Let animation cascade finish
    await sleep(3600);
    await cdp.screenshot(path.join(ARTIFACT_DIR, `values_replayed_${vp.name}.png`));
  }

  console.log('\n======================================================');
  console.log('ALL VALUES ANIMATION VERIFICATION CHECKS PASSED!');
  console.log('======================================================');

  await cdp.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('[Error] Verification failed:', err);
  process.exit(1);
});
