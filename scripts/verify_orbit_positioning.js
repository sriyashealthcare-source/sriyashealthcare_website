const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_OrbitVerification';
const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let serverProc = null;
let chromeProc = null;

async function startServers() {
  try {
    const res = await fetch('http://127.0.0.1:5173/');
    if (res.ok) return;
  } catch (_) {}

  console.log('[Dev Server] Starting Vite dev server...');
  const viteBin = path.join(__dirname, '..', 'client', 'node_modules', 'vite', 'bin', 'vite.js');
  serverProc = spawn('node', [viteBin, '--host', '127.0.0.1', '--port', '5173'], {
    cwd: path.join(__dirname, '..', 'client'),
    stdio: 'pipe'
  });

  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:5173/');
      if (res.ok) {
        console.log('[Dev Server] Ready.');
        break;
      }
    } catch (_) {}
  }
}

async function startChrome() {
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    if (res.ok) return;
  } catch (_) {}

  console.log('[Chrome] Launching Chrome...');
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
        console.log('[Chrome] Ready.');
        break;
      }
    } catch (_) {}
  }
}

async function run() {
  await startServers();
  await startChrome();

  const pageRes = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
  const page = await pageRes.json();
  const WebSocket = global.WebSocket || require('ws');
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let nextId = 1;
  const callbacks = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = nextId++;
      callbacks.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      if (msg.error) cb.reject(new Error(msg.error.message));
      else cb.resolve(msg.result);
    }
  };

  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Runtime.enable');

  // Test across Desktop 1440x900 and Laptop 1366x768
  for (const viewport of [
    { w: 1440, h: 900, name: 'desktop_1440x900' },
    { w: 1366, h: 768, name: 'laptop_1366x768' }
  ]) {
    console.log(`\n=== VERIFYING VIEWPORT ${viewport.w}x${viewport.h} (${viewport.name}) ===`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: viewport.w,
      height: viewport.h,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
    await sleep(4000);

    const metrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const heroSection = document.querySelector('.hp-hero-section');
        const innerRing = document.querySelector('.sriyas-inner-ring-circle');
        const outerRing = document.querySelector('.sriyas-outer-ring-circle');
        const outerWrap = document.querySelector('.sriyas-outer-orbital-wrap');
        const innerWrap = document.querySelector('.sriyas-two-stage-orbital-wrap');
        const emblemSlot = document.querySelector('.hp-hero-emblem-slot');
        const title = document.querySelector('.hp-hero-title-slot');
        const tagline = document.querySelector('.hp-hero-tagline');
        const intro = document.querySelector('.hp-hero-intro');
        const values = document.querySelector('.hp-hero-values');
        const actions = document.querySelector('.hp-hero-actions');

        function rect(el) {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return {
            x: Math.round(r.x),
            y: Math.round(r.y),
            width: Math.round(r.width),
            height: Math.round(r.height),
            cx: Math.round(r.x + r.width / 2),
            cy: Math.round(r.y + r.height / 2)
          };
        }

        const hR = rect(heroSection);
        const owR = rect(outerWrap);
        const eR = rect(emblemSlot);
        const tR = rect(title);
        const tagR = rect(tagline);
        const intR = rect(intro);
        const valR = rect(values);
        const actR = rect(actions);

        // Calculate Hero Block Bounds
        const heroBlockTop = eR ? eR.y : 0;
        const heroBlockBottom = actR ? (actR.y + actR.height) : 0;
        const heroBlockHeight = heroBlockBottom - heroBlockTop;
        const heroBlockLeft = Math.min(eR?.x || 9999, tR?.x || 9999, actR?.x || 9999);
        const heroBlockRight = Math.max(eR ? eR.x + eR.width : 0, tR ? tR.x + tR.width : 0, actR ? actR.x + actR.width : 0);

        // Check if outer circle encompasses hero block
        const outerRadius = owR ? owR.width / 2 : 0;
        const outerTop = owR ? owR.y : 0;
        const outerBottom = owR ? owR.y + owR.height : 0;
        const outerLeft = owR ? owR.x : 0;
        const outerRight = owR ? owR.x + owR.width : 0;

        const isOuterCenteredOnScreen = owR && hR && (
          Math.abs(owR.cx - hR.cx) <= 2 &&
          Math.abs(owR.cy - hR.cy) <= 2
        );

        const encompassesTop = outerTop <= heroBlockTop;
        const encompassesBottom = outerBottom >= heroBlockBottom;

        return {
          heroSection: hR,
          outerWrap: owR,
          emblemSlot: eR,
          actions: actR,
          heroBlock: {
            top: heroBlockTop,
            bottom: heroBlockBottom,
            height: heroBlockHeight,
            left: heroBlockLeft,
            right: heroBlockRight
          },
          outerOrbit: {
            isCenteredOnScreen: isOuterCenteredOnScreen,
            outerDiameter: owR?.width,
            outerHeight: owR?.height,
            cx: owR?.cx,
            cy: owR?.cy,
            encompassesHeroBlock: encompassesTop && encompassesBottom,
            topClearance: heroBlockTop - outerTop,
            bottomClearance: outerBottom - heroBlockBottom
          },
          innerOrbit: {
            cxAttr: innerRing?.getAttribute('cx'),
            cyAttr: innerRing?.getAttribute('cy'),
            rAttr: innerRing?.getAttribute('r')
          }
        };
      })()`,
      returnByValue: true
    });

    console.log(JSON.stringify(metrics.result.value, null, 2));

    // Force Inner Stage visible & capture screenshot
    await send('Runtime.evaluate', {
      expression: `(() => {
        const innerG = document.querySelector('.sriyas-stage-inner-group');
        const outerG = document.querySelector('.sriyas-stage-outer-group');
        if (innerG) {
          innerG.style.animation = 'none';
          innerG.style.opacity = '1';
          innerG.style.visibility = 'visible';
          innerG.style.transform = 'scale(1)';
        }
        if (outerG) {
          outerG.style.animation = 'none';
          outerG.style.opacity = '0';
          outerG.style.visibility = 'hidden';
        }
      })()`
    });
    await sleep(500);

    const innerShot = await send('Page.captureScreenshot', { format: 'png' });
    const innerPath = path.join(ARTIFACT_DIR, `verify_orbit_inner_${viewport.name}.png`);
    fs.writeFileSync(innerPath, Buffer.from(innerShot.data, 'base64'));
    console.log(`Saved screenshot: ${innerPath}`);

    // Force Outer Stage visible & capture screenshot
    await send('Runtime.evaluate', {
      expression: `(() => {
        const innerG = document.querySelector('.sriyas-stage-inner-group');
        const outerG = document.querySelector('.sriyas-stage-outer-group');
        if (innerG) {
          innerG.style.opacity = '0';
          innerG.style.visibility = 'hidden';
        }
        if (outerG) {
          outerG.style.animation = 'none';
          outerG.style.opacity = '1';
          outerG.style.visibility = 'visible';
          outerG.style.transform = 'scale(1)';
        }
      })()`
    });
    await sleep(500);

    const outerShot = await send('Page.captureScreenshot', { format: 'png' });
    const outerPath = path.join(ARTIFACT_DIR, `verify_orbit_outer_${viewport.name}.png`);
    fs.writeFileSync(outerPath, Buffer.from(outerShot.data, 'base64'));
    console.log(`Saved screenshot: ${outerPath}`);
  }

  ws.close();
  await fetch(`http://127.0.0.1:9222/json/close/${page.id}`);
  if (serverProc) serverProc.kill();
  console.log('\nVerification completed successfully!');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  if (serverProc) serverProc.kill();
  process.exit(1);
});
