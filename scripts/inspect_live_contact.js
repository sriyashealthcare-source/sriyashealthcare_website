const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_InspectLive';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let chromeProc = null;

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

async function checkLive() {
  await startChrome();

  const pageRes = await fetch('http://127.0.0.1:9222/json/new?https://sriyashealthcare.com/contact', { method: 'PUT' });
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
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  // wait 5 seconds for react to render and images to load
  await sleep(5000);

  const liveState = await send('Runtime.evaluate', {
    expression: `(() => {
      const portraitFrame = document.querySelector('.office-portrait-frame');
      const portraitImg = document.querySelector('.office-portrait-img');
      const legacyMapWrap = document.querySelector('.map-wrap');
      const legacyMapPhoto = document.querySelector('.map-photo');
      const primaryBtn = document.querySelector('.office-maps-btn-primary');
      const secondaryBtn = document.querySelector('.office-maps-btn-secondary');

      const el = portraitFrame || legacyMapWrap;
      const img = portraitImg || legacyMapPhoto;

      const elRect = el ? el.getBoundingClientRect() : null;
      const imgRect = img ? img.getBoundingClientRect() : null;
      const elStyle = el ? window.getComputedStyle(el) : null;
      const imgStyle = img ? window.getComputedStyle(img) : null;

      return {
        hasPortraitFrame: !!portraitFrame,
        hasPortraitImg: !!portraitImg,
        hasLegacyMapWrap: !!legacyMapWrap,
        hasLegacyMapPhoto: !!legacyMapPhoto,
        hasPrimaryBtn: !!primaryBtn,
        hasSecondaryBtn: !!secondaryBtn,
        elWidth: elRect ? Math.round(elRect.width) : null,
        elHeight: elRect ? Math.round(elRect.height) : null,
        elAspectRatio: elRect ? (elRect.width / elRect.height).toFixed(3) : null,
        imgWidth: imgRect ? Math.round(imgRect.width) : null,
        imgHeight: imgRect ? Math.round(imgRect.height) : null,
        imgObjectFit: imgStyle ? imgStyle.objectFit : null,
        imgNaturalWidth: img ? img.naturalWidth : null,
        imgNaturalHeight: img ? img.naturalHeight : null,
        imgSrc: img ? img.src : null,
        elBgColor: elStyle ? elStyle.backgroundColor : null
      };
    })()`,
    returnByValue: true
  });

  console.log('LIVE PRODUCTION STATE ON sriyashealthcare.com/contact:');
  console.log(JSON.stringify(liveState.result.value, null, 2));

  // scroll to element
  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector('.contact-office-section, .office-portrait-card, .map-wrap');
      if (el) el.scrollIntoView({ block: 'center' });
    })()`
  });
  await sleep(1000);

  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshot.data, 'base64');
  const screenshotPath = path.join(ARTIFACT_DIR, '117_live_production_contact_page.png');
  fs.writeFileSync(screenshotPath, buffer);
  console.log('Screenshot of LIVE PRODUCTION saved to:', screenshotPath);

  ws.close();
  await fetch(`http://127.0.0.1:9222/json/close/${page.id}`);
  if (chromeProc) chromeProc.kill();
}

checkLive().catch(err => {
  console.error('Error checking live:', err);
  process.exit(1);
});
