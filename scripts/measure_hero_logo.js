const fs = require('fs');
const { spawn } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_MeasureHero';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let chromeProc = null;

async function startChrome() {
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    if (res.ok) return;
  } catch (_) {}

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

async function measure() {
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

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  for (const w of [1440, 1024, 768, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url: 'https://sriyashealthcare.com/' });
    await new Promise(r => setTimeout(r, 8000));

    const metrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const emblem = document.querySelector('.hp-hero-emblem-wrap');
        const emblemSlot = document.querySelector('.hp-hero-emblem-slot');
        const title = document.querySelector('.hp-hero-title-slot');
        const brandName = document.querySelector('.hp-hero-brand-name');
        const brandSub = document.querySelector('.hp-hero-brand-sub');
        const tagline = document.querySelector('.hp-hero-tagline');
        const lockup = document.querySelector('.hp-hero-lockup-flow');

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

        const eR = rect(emblemSlot);
        const tR = rect(title);
        const tagR = rect(tagline);
        const lR = rect(lockup);

        // Combined bounding box from top of emblem to bottom of tagline
        const combinedTop = eR ? eR.y : 0;
        const combinedBottom = tagR ? (tagR.y + tagR.height) : (tR ? tR.y + tR.height : 0);
        const combinedHeight = combinedBottom - combinedTop;
        const combinedCenterY = Math.round(combinedTop + combinedHeight / 2);
        const combinedWidth = Math.max(eR ? eR.width : 0, tR ? tR.width : 0, tagR ? tagR.width : 0);

        return {
          viewport: ${w},
          emblem: eR,
          title: tR,
          tagline: tagR,
          lockup: lR,
          combined: {
            top: combinedTop,
            bottom: combinedBottom,
            height: combinedHeight,
            width: combinedWidth,
            centerX: eR ? eR.cx : 0,
            centerY: combinedCenterY
          }
        };
      })()`,
      returnByValue: true
    });

    console.log(`=== VIEWPORT ${w}px METRICS ===`);
    console.log(JSON.stringify(metrics.result.value, null, 2));
  }

  ws.close();
  await fetch(`http://127.0.0.1:9222/json/close/${page.id}`);
}

measure().catch(console.error);
