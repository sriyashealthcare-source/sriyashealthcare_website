const fs = require('fs');
const path = require('path');
const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';

async function debugLive() {
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

  const logs = [];
  const networkErrors = [];

  const requestedUrls = [];
  const requestMap = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Network.requestWillBeSent') {
      requestedUrls.push(msg.params.request.url);
      requestMap.set(msg.params.requestId, msg.params.request.url);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      logs.push(`[CONSOLE ${msg.params.type}] ` + msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      logs.push(`[EXCEPTION] ` + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
    }
    if (msg.method === 'Network.loadingFailed') {
      console.log(`[LOADING FAILED] ${requestMap.get(msg.params.requestId) || msg.params.requestId} errorText: ${msg.params.errorText}`);
    }
    if (msg.method === 'Network.responseReceived') {
      console.log(`[RESPONSE ${msg.params.response.status}] ${msg.params.response.url}`);
      if (msg.params.response.status >= 400) {
        networkErrors.push(`[HTTP ${msg.params.response.status}] ${msg.params.response.url}`);
      }
    }
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
  await send('Network.enable');

  console.log('Navigating to https://sriyashealthcare.com/contact ...');
  await send('Page.navigate', { url: 'https://sriyashealthcare.com/contact' });

  console.log('Waiting 14 seconds for JS bundle to load and React to hydrate/mount...');
  await new Promise(r => setTimeout(r, 14000));

  console.log('--- NETWORK ERRORS (>= 400) ---');
  console.log(requestedUrls);

  console.log('--- NETWORK ERRORS (>= 400) ---');
  console.log(networkErrors.length ? networkErrors.join('\n') : 'None');

  console.log('--- CONSOLE LOGS & EXCEPTIONS ---');
  console.log(logs.length ? logs.join('\n') : 'None');

  const rootHtml = await send('Runtime.evaluate', {
    expression: 'document.getElementById("root") ? document.getElementById("root").innerHTML.substring(0, 400) : "No root"',
    returnByValue: true
  });
  console.log('--- ROOT HTML ---');
  console.log(rootHtml.result.value);

  const portraitCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const frame = document.querySelector('.office-portrait-frame');
      const img = document.querySelector('.office-portrait-img');
      const legacyMapWrap = document.querySelector('.map-wrap');
      const allImgs = Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src, alt: i.alt, className: i.className }));
      return {
        hasPortraitFrame: !!frame,
        hasPortraitImg: !!img,
        hasLegacyMapWrap: !!legacyMapWrap,
        frameRect: frame ? frame.getBoundingClientRect() : null,
        imgStyle: img ? {
          objectFit: window.getComputedStyle(img).objectFit,
          width: window.getComputedStyle(img).width,
          height: window.getComputedStyle(img).height
        } : null,
        allImgs
      };
    })()`,
    returnByValue: true
  });
  console.log('--- PORTRAIT CHECK RESULT ---');
  console.log(JSON.stringify(portraitCheck.result.value, null, 2));

  // scroll to portrait card
  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector('.contact-office-section, .office-portrait-card, .map-wrap');
      if (el) el.scrollIntoView({ block: 'center' });
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(screenshot.data, 'base64');
  const screenshotPath = path.join(ARTIFACT_DIR, '117_live_production_contact_page.png');
  fs.writeFileSync(screenshotPath, buffer);
  console.log('Screenshot of LIVE PRODUCTION saved to:', screenshotPath);

  ws.close();
  await fetch(`http://127.0.0.1:9222/json/close/${page.id}`);
}

debugLive().catch(console.error);
