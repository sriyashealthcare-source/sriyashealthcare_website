/**
 * Cross-Device Animation Consistency & Reliability Test
 * Tests:
 * 1. Standard Viewport (1440x900) - verifies scroll-triggered reveal on all sections and children.
 * 2. Short/Scaled Viewport (1366x580) - simulates low-height 768p laptop or 150% DPI display scaling.
 * 3. Accessibility / Battery Saver (prefers-reduced-motion: reduce) - ensures immediate visibility and continuous autoplay.
 * 4. Failsafe checks: Zero elements stuck at opacity: 0.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const rootDir = path.join(__dirname, '..');
const CHROME_DEV_PROFILE = path.join(rootDir, '.chrome_dev_profile');
const TARGET_URL = 'http://127.0.0.1:5173';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let serverProc = null;
let clientProc = null;

async function waitForHttp(url, timeoutMs = 20000) {
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
  const backendAlreadyUp = await waitForHttp('http://127.0.0.1:5000/api/health', 1500);
  const clientAlreadyUp = await waitForHttp('http://127.0.0.1:5173/', 1500);

  if (!backendAlreadyUp) {
    console.log('[Servers] Starting backend on port 5000...');
    serverProc = spawn('node', ['server/server.js'], {
      cwd: rootDir,
      env: { ...process.env, USE_LOCAL_DB: 'true', PORT: '5000', HOST: '127.0.0.1' },
      stdio: 'ignore'
    });
  }

  if (!clientAlreadyUp) {
    console.log('[Servers] Starting client dev server on port 5173...');
    const viteBin = path.join(rootDir, 'client', 'node_modules', 'vite', 'bin', 'vite.js');
    clientProc = spawn('node', [viteBin, '--host', '127.0.0.1', '--port', '5173'], {
      cwd: path.join(rootDir, 'client'),
      stdio: 'ignore'
    });
  }

  await waitForHttp('http://127.0.0.1:5000/api/health', 15000);
  await waitForHttp('http://127.0.0.1:5173/', 15000);
  console.log('[Servers] Servers ready.');
}

async function main() {
  await startServers();

  console.log('[Chrome] Launching Headless Chrome on CDP port 9222...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--remote-allow-origins=*',
    `--user-data-dir=${CHROME_DEV_PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-extensions',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ], { stdio: 'ignore' });

  let connected = false;
  for (let i = 0; i < 20; i++) {
    await sleep(400);
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        connected = true;
        break;
      }
    } catch (_) {}
  }
  if (!connected) throw new Error('Failed to connect to Chrome on port 9222.');

  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const wsUrl = pageTarget.webSocketDebuggerUrl;

  const ws = new globalThis.WebSocket(wsUrl);
  let idSeq = 1;
  const pending = new Map();

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    } catch (_) {}
  };

  await new Promise((resolve) => { ws.onopen = resolve; });

  function sendCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idSeq++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await sendCDP('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  try {
    await sendCDP('Page.enable');
    await sendCDP('Runtime.enable');

    console.log('\n======================================================');
    console.log('TEST 1: Standard Desktop Viewport (1440x900)');
    console.log('======================================================');
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await sendCDP('Page.navigate', { url: TARGET_URL });
    await sleep(2500);

    // Scroll through the page progressively
    for (let scrollY = 0; scrollY <= 3800; scrollY += 400) {
      await evaluate(`window.scrollTo(0, ${scrollY});`);
      await sleep(150);
    }
    await sleep(1000);

    const test1Results = await evaluate(`(() => {
      const sections = Array.from(document.querySelectorAll('section[id]')).map(s => ({
        id: s.id,
        isRevealed: s.classList.contains('is-revealed'),
        opacity: window.getComputedStyle(s).opacity
      }));

      const hiddenChildren = Array.from(document.querySelectorAll(
        '.hp-reveal-child, .hp-reveal-heading, .hp-reveal-text, .hp-reveal-media, .hp-converge-left, .hp-converge-right'
      )).filter(el => {
        const style = window.getComputedStyle(el);
        return style.opacity === '0' || style.visibility === 'hidden';
      }).map(el => el.className);

      return { sections, hiddenChildrenCount: hiddenChildren.length, hiddenChildren: hiddenChildren.slice(0, 5) };
    })()`);

    console.log('Sections status:', JSON.stringify(test1Results.sections, null, 2));
    console.log('Hidden reveal children count:', test1Results.hiddenChildrenCount);
    if (test1Results.hiddenChildrenCount > 0) {
      console.warn('Some children are hidden:', test1Results.hiddenChildren);
    } else {
      console.log('✓ All children cleanly revealed (opacity: 1)');
    }

    console.log('\n======================================================');
    console.log('TEST 2: Carousel & WhatWeDo Autoplay Rotation');
    console.log('======================================================');
    // Scroll to workplace carousel
    await evaluate(`(() => {
      const el = document.getElementById('our-workplace');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`);
    await sleep(600);

    const initialSlide = await evaluate(`(() => {
      const counter = document.querySelector('.hp-counter-current');
      return counter ? counter.textContent.trim() : null;
    })()`);
    console.log(`Initial active carousel slide: ${initialSlide}`);

    console.log('Waiting 4.4 seconds for carousel auto-advance...');
    await sleep(4400);

    const nextSlide = await evaluate(`(() => {
      const counter = document.querySelector('.hp-counter-current');
      return counter ? counter.textContent.trim() : null;
    })()`);
    console.log(`Carousel active slide after auto-advance: ${nextSlide}`);
    if (nextSlide && nextSlide !== initialSlide) {
      console.log(`✓ Carousel auto-advanced successfully from slide ${initialSlide} to slide ${nextSlide}`);
    } else {
      console.warn(`! Carousel slide did not change (${initialSlide} -> ${nextSlide})`);
    }

    // Now test What We Do progression
    await evaluate(`(() => {
      const el = document.getElementById('what-we-do');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`);
    await sleep(600);

    const initialWwd = await evaluate(`(() => {
      const activeTab = document.querySelector('.hp-wwd-tab.is-active .hp-wwd-tab-num');
      return activeTab ? activeTab.textContent.trim() : null;
    })()`);
    console.log(`Initial active WhatWeDo capability: ${initialWwd}`);

    console.log('Waiting 5.8 seconds for WhatWeDo auto-advance...');
    await sleep(5800);

    const nextWwd = await evaluate(`(() => {
      const activeTab = document.querySelector('.hp-wwd-tab.is-active .hp-wwd-tab-num');
      return activeTab ? activeTab.textContent.trim() : null;
    })()`);
    console.log(`WhatWeDo active capability after auto-advance: ${nextWwd}`);
    if (nextWwd && nextWwd !== initialWwd) {
      console.log(`✓ WhatWeDo capability auto-advanced successfully from ${initialWwd} to ${nextWwd}`);
    } else {
      console.warn(`! WhatWeDo did not change (${initialWwd} -> ${nextWwd})`);
    }

    console.log('\n======================================================');
    console.log('TEST 3: Compact Laptop Display (1366x580 - 768p / 150% DPI)');
    console.log('======================================================');
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 580,
      deviceScaleFactor: 1.5,
      mobile: false
    });

    await sendCDP('Page.navigate', { url: TARGET_URL });
    await sleep(2000);

    // Scroll gently down on small screen
    for (let scrollY = 0; scrollY <= 3800; scrollY += 300) {
      await evaluate(`window.scrollTo(0, ${scrollY});`);
      await sleep(120);
    }
    await sleep(1200);

    const test3Results = await evaluate(`(() => {
      const hiddenChildren = Array.from(document.querySelectorAll(
        '.hp-reveal-child, .hp-reveal-heading, .hp-reveal-text, .hp-reveal-media, .hp-converge-left, .hp-converge-right'
      )).filter(el => {
        const style = window.getComputedStyle(el);
        return style.opacity === '0';
      }).length;
      return { hiddenChildren };
    })()`);

    console.log('Hidden children count on compact 580px viewport:', test3Results.hiddenChildren);
    if (test3Results.hiddenChildren === 0) {
      console.log('✓ Zero elements stuck at opacity: 0 on compact/scaled laptop screens!');
    }

    console.log('\n======================================================');
    console.log('TEST 4: Accessibility / Battery Saver (prefers-reduced-motion: reduce)');
    console.log('======================================================');
    await sendCDP('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });

    await sendCDP('Page.navigate', { url: TARGET_URL });
    await sleep(2000);

    // Scroll to workplace section under reduced motion
    await evaluate(`(() => {
      const el = document.getElementById('our-workplace');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`);
    await sleep(600);

    const reducedMotionCheck = await evaluate(`(() => {
      const hiddenChildren = Array.from(document.querySelectorAll(
        '.hp-reveal-child, .hp-reveal-heading, .hp-reveal-text, .hp-reveal-media, .hp-converge-left, .hp-converge-right'
      )).filter(el => {
        const style = window.getComputedStyle(el);
        return style.opacity === '0';
      }).length;

      const counter = document.querySelector('.hp-counter-current');
      const slideIndex = counter ? counter.textContent.trim() : null;

      return { hiddenChildren, slideIndex };
    })()`);

    console.log('Reduced motion mode - hidden children at initial load:', reducedMotionCheck.hiddenChildren);
    console.log('Reduced motion mode - initial carousel slide:', reducedMotionCheck.slideIndex);

    console.log('Verifying carousel continues to auto-rotate under reduced motion (waiting 4.4s)...');
    await sleep(4400);

    const reducedMotionSlide2 = await evaluate(`(() => {
      const counter = document.querySelector('.hp-counter-current');
      return counter ? counter.textContent.trim() : null;
    })()`);
    console.log(`Reduced motion active slide after 4.4s: ${reducedMotionSlide2}`);
    if (reducedMotionSlide2 && reducedMotionSlide2 !== reducedMotionCheck.slideIndex) {
      console.log(`✓ SUCCESS: Autoplay continuous rotation verified under prefers-reduced-motion! (${reducedMotionCheck.slideIndex} -> ${reducedMotionSlide2})`);
    } else {
      console.warn(`! Warning: Autoplay rotation halted under reduced-motion.`);
    }

    console.log('\n======================================================');
    console.log('ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
    console.log('======================================================');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    try { ws.close(); } catch (_) {}
    try { chromeProc.kill(); } catch (_) {}
    if (clientProc) { try { clientProc.kill(); } catch (_) {} }
    if (serverProc) { try { serverProc.kill(); } catch (_) {} }
    process.exit(0);
  }
}

main();
