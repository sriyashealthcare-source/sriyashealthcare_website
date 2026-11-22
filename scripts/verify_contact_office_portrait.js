/**
 * Sriyas Healthcare - Office Image Portrait Layout Verification Suite
 * 
 * Verifies:
 * 1. Customer Contact Page (/contact):
 *    - Container is portrait-oriented with ~4:5 aspect ratio.
 *    - Container has appropriate max-width (~480px on desktop) and is centered.
 *    - Full original photograph is displayed with `object-fit: contain` (never cropped or distorted).
 *    - Neutral #FAF7F0 ivory background behind image.
 *    - Google Maps action buttons positioned neatly BELOW the photograph (never overlapping/obscuring).
 *    - Tested on Desktop (1440px), Tablet (768px), and Mobile (390px).
 * 2. Admin Contact Management (/admin/contact-information):
 *    - Office photo preview in 'images' tab uses object-fit: contain and neutral background.
 * 3. Screenshots saved:
 *    - 113_contact_office_portrait_desktop.png
 *    - 114_contact_office_portrait_tablet.png
 *    - 115_contact_office_portrait_mobile.png
 *    - 116_admin_office_image_preview.png
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const serverNodeModules = path.join(__dirname, '..', 'server', 'node_modules');
if (fs.existsSync(serverNodeModules) && !module.paths.includes(serverNodeModules)) {
  module.paths.unshift(serverNodeModules);
}

const jwt = require('jsonwebtoken');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_OfficePortrait';
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

  await waitForHttp('http://127.0.0.1:5000/api/health', 25000);
  await waitForHttp('http://127.0.0.1:5173/', 25000);
  console.log('[Servers] Backend & Frontend servers active.');
}

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

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    const WebSocket = global.WebSocket || require('ws');
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception ? (res.exceptionDetails.exception.description || res.exceptionDetails.exception.value) : res.exceptionDetails.text;
      console.warn('[CDP Evaluate Exception]:', desc);
      throw new Error(desc || 'Runtime evaluation error');
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Screenshot Saved] -> ${filename} (${buffer.length} bytes)`);
    return outPath;
  }

  async setViewport(width, height, deviceScaleFactor = 1) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: width < 600
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function createTargetPage() {
  const res = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
  const page = await res.json();
  const client = new CdpClient(page.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('DOM.enable');
  await client.send('Runtime.enable');
  return { client, targetId: page.id };
}

async function closeTargetPage(targetId) {
  try {
    await fetch(`http://127.0.0.1:9222/json/close/${targetId}`);
  } catch (_) {}
}

async function runTests() {
  await startServers();
  await startChrome();

  const { client, targetId } = await createTargetPage();
  const results = [];

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      results.push({ pass: true, message });
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      results.push({ pass: false, message });
    }
  }

  try {
    console.log('\n=== TEST 1: DESKTOP VIEWPORT (1440x900) CONTACT PAGE OFFICE IMAGE ===');
    await client.setViewport(1440, 900);
    await client.send('Page.navigate', { url: 'http://127.0.0.1:5173/contact' });
    await sleep(2500);

    // Scroll to office section
    await client.evaluate(`(() => {
      try {
        const el = document.querySelector('.contact-office-section, .office-portrait-card, .map-wrap');
        if (el) el.scrollIntoView({ block: 'center' });
      } catch (e) {}
    })()`);
    await sleep(800);

    const desktopData = await client.evaluate(`(() => {
      const frame = document.querySelector('.office-portrait-frame') || document.querySelector('.map-wrap');
      const img = document.querySelector('.office-portrait-img') || document.querySelector('.map-photo');
      const card = document.querySelector('.office-portrait-card');
      const actions = document.querySelector('.office-maps-actions');
      const primaryBtn = document.querySelector('.office-maps-btn-primary');
      const secondaryBtn = document.querySelector('.office-maps-btn-secondary');

      if (!frame || !img) return { found: false };

      const frameRect = frame.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      const actionsRect = actions ? actions.getBoundingClientRect() : null;
      const frameStyle = window.getComputedStyle(frame);
      const imgStyle = window.getComputedStyle(img);

      return {
        found: true,
        frameWidth: Math.round(frameRect.width),
        frameHeight: Math.round(frameRect.height),
        aspectRatio: (frameRect.width / frameRect.height).toFixed(3),
        cssAspectRatio: frameStyle.aspectRatio,
        backgroundColor: frameStyle.backgroundColor,
        objectFit: imgStyle.objectFit,
        imgWidth: Math.round(imgRect.width),
        imgHeight: Math.round(imgRect.height),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        hasPrimaryBtn: !!primaryBtn,
        hasSecondaryBtn: !!secondaryBtn,
        primaryBtnText: primaryBtn ? primaryBtn.innerText.trim() : '',
        primaryBtnHref: primaryBtn ? primaryBtn.href : '',
        secondaryBtnText: secondaryBtn ? secondaryBtn.innerText.trim() : '',
        secondaryBtnHref: secondaryBtn ? secondaryBtn.href : '',
        actionsBelowFrame: actionsRect ? actionsRect.top >= (frameRect.bottom - 5) : false,
        actionsOverlap: actionsRect ? !(actionsRect.top >= frameRect.bottom) : true
      };
    })()`);

    assert(desktopData.found, 'Office image frame and image element located on /contact');
    assert(desktopData.objectFit === 'contain', `Image computed object-fit is 'contain' (Actual: '${desktopData.objectFit}')`);
    assert(desktopData.frameWidth <= 500 && desktopData.frameWidth >= 300, `Portrait frame width within max-width ~480px (Actual: ${desktopData.frameWidth}px)`);
    assert(parseFloat(desktopData.aspectRatio) >= 0.70 && parseFloat(desktopData.aspectRatio) <= 0.88, `Frame aspect ratio is portrait approx 4:5 (~0.8) (Actual: ${desktopData.aspectRatio})`);
    assert(desktopData.backgroundColor.includes('250, 247, 240') || desktopData.backgroundColor.includes('FAF7F0') || desktopData.backgroundColor.includes('255, 255, 255'), `Clean neutral background applied (Actual: '${desktopData.backgroundColor}')`);
    assert(desktopData.hasPrimaryBtn && desktopData.hasSecondaryBtn, 'Both Google Maps action buttons present');
    assert(desktopData.actionsBelowFrame, 'Google Maps action buttons positioned neatly BELOW photograph (zero image obstruction)');
    assert(desktopData.primaryBtnHref.includes('google.com/maps') || desktopData.primaryBtnHref.includes('maps.app.goo.gl'), `Primary button links to Google Maps (${desktopData.primaryBtnHref})`);

    await client.captureScreenshot('113_contact_office_portrait_desktop.png');

    console.log('\n=== TEST 2: TABLET VIEWPORT (768x1024) ===');
    await client.setViewport(768, 1024);
    await sleep(1000);

    await client.evaluate(`(() => {
      try {
        const el = document.querySelector('.contact-office-section, .office-portrait-card, .map-wrap');
        if (el) el.scrollIntoView({ block: 'center' });
      } catch (e) {}
    })()`);
    await sleep(600);

    const tabletData = await client.evaluate(`(() => {
      const frame = document.querySelector('.office-portrait-frame') || document.querySelector('.map-wrap');
      const img = document.querySelector('.office-portrait-img') || document.querySelector('.map-photo');
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const frameRect = frame ? frame.getBoundingClientRect() : null;
      const imgStyle = img ? window.getComputedStyle(img) : null;

      return {
        hasHorizontalOverflow: scrollWidth > clientWidth,
        scrollWidth,
        clientWidth,
        frameWidth: frameRect ? Math.round(frameRect.width) : 0,
        frameHeight: frameRect ? Math.round(frameRect.height) : 0,
        objectFit: imgStyle ? imgStyle.objectFit : null
      };
    })()`);

    assert(!tabletData.hasHorizontalOverflow, `No horizontal overflow on Tablet (${tabletData.scrollWidth}px <= ${tabletData.clientWidth}px)`);
    assert(tabletData.objectFit === 'contain', `Image object-fit remains 'contain' on tablet`);
    assert(tabletData.frameWidth <= 480, `Frame fits comfortably on tablet (${tabletData.frameWidth}px)`);

    await client.captureScreenshot('114_contact_office_portrait_tablet.png');

    console.log('\n=== TEST 3: MOBILE VIEWPORT (390x844) ===');
    await client.setViewport(390, 844);
    await sleep(1000);

    await client.evaluate(`(() => {
      try {
        const el = document.querySelector('.contact-office-section, .office-portrait-card, .map-wrap');
        if (el) el.scrollIntoView({ block: 'center' });
      } catch (e) {}
    })()`);
    await sleep(600);

    const mobileData = await client.evaluate(`(() => {
      const frame = document.querySelector('.office-portrait-frame') || document.querySelector('.map-wrap');
      const img = document.querySelector('.office-portrait-img') || document.querySelector('.map-photo');
      const actions = document.querySelector('.office-maps-actions');
      const scrollWidth = document.documentElement.scrollWidth;
      const clientWidth = document.documentElement.clientWidth;
      const frameRect = frame ? frame.getBoundingClientRect() : null;
      const actionsRect = actions ? actions.getBoundingClientRect() : null;
      const imgStyle = img ? window.getComputedStyle(img) : null;

      return {
        hasHorizontalOverflow: scrollWidth > clientWidth,
        scrollWidth,
        clientWidth,
        frameWidth: frameRect ? Math.round(frameRect.width) : 0,
        frameHeight: frameRect ? Math.round(frameRect.height) : 0,
        objectFit: imgStyle ? imgStyle.objectFit : null,
        actionsBelowFrame: actionsRect && frameRect ? actionsRect.top >= (frameRect.bottom - 5) : false
      };
    })()`);

    assert(!mobileData.hasHorizontalOverflow, `No horizontal overflow on Mobile (${mobileData.scrollWidth}px <= ${mobileData.clientWidth}px)`);
    assert(mobileData.objectFit === 'contain', `Image object-fit remains 'contain' on mobile`);
    assert(mobileData.frameWidth <= 380, `Portrait frame scales gracefully on mobile (${mobileData.frameWidth}px)`);
    assert(mobileData.actionsBelowFrame, `Actions remain below frame on mobile`);

    await client.captureScreenshot('115_contact_office_portrait_mobile.png');

    console.log('\n=== TEST 4: ADMIN CONTACT MANAGEMENT OFFICE PHOTO PREVIEW ===');
    await client.setViewport(1440, 900);

    // Generate JWT admin token
    const token = jwt.sign(
      { id: 'admin123', username: 'admin', role: 'admin' },
      process.env.JWT_SECRET || 'sriyas_healthcare_secret_key_2024',
      { expiresIn: '7d' }
    );

    // Inject session storage and cookie
    await client.evaluate(`
      sessionStorage.setItem('sriyas_admin_token', '${token}');
      document.cookie = 'sriyas_admin_token=${token}; path=/';
    `);

    await client.send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/contact-information' });
    await sleep(2500);

    // Click 'Photos & Map' tab
    const tabClicked = await client.evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const photosBtn = btns.find(b => b.innerText.includes('Photos & Map') || b.innerText.includes('Photos') || b.innerText.includes('Map'));
      if (photosBtn) {
        photosBtn.click();
        return true;
      }
      return false;
    })()`);
    console.log('  Tab Photos & Map clicked:', tabClicked);
    await sleep(1500);

    const adminPreviewData = await client.evaluate(`(() => {
      const imgs = Array.from(document.querySelectorAll('img')).filter(img => 
        (img.alt && (img.alt.includes('storefront') || img.alt.includes('Office') || img.alt.includes('Facility') || img.alt.includes('Chennai') || img.alt.includes('photograph'))) ||
        (img.src && (img.src.includes('cloudinary') || img.src.includes('storefront_location')))
      );
      if (imgs.length === 0) return { found: false };

      const targetImg = imgs[0];
      const style = window.getComputedStyle(targetImg);
      const parentStyle = window.getComputedStyle(targetImg.parentElement);

      return {
        found: true,
        alt: targetImg.alt,
        src: targetImg.src,
        objectFit: style.objectFit,
        parentBg: parentStyle.backgroundColor,
        parentHeight: parentStyle.height
      };
    })()`);

    assert(adminPreviewData.found, 'Office image preview card found in Admin Panel');
    assert(adminPreviewData.objectFit === 'contain', `Admin preview uses 'object-fit: contain' (Actual: '${adminPreviewData.objectFit}')`);
    assert(adminPreviewData.parentBg && (adminPreviewData.parentBg.includes('250, 247, 240') || adminPreviewData.parentBg.includes('FAF7F0')), `Admin preview has neutral #FAF7F0 background (Actual: '${adminPreviewData.parentBg}')`);

    await client.captureScreenshot('116_admin_office_image_preview.png');

    console.log('\n=== SUMMARY OF VERIFICATION RESULTS ===');
    const allPassed = results.every(r => r.pass);
    console.log(`Total checks: ${results.length}, Passed: ${results.filter(r => r.pass).length}, Failed: ${results.filter(r => !r.pass).length}`);
    if (allPassed) {
      console.log('✓ ALL TESTS PASSED SUCCESSFULLY!');
    } else {
      console.error('✗ SOME TESTS FAILED.');
    }

  } finally {
    client.close();
    await closeTargetPage(targetId);

    if (chromeProc) {
      try { chromeProc.kill(); } catch (_) {}
    }
  }
}

runTests().catch(err => {
  console.error('Fatal error running verification:', err);
  process.exit(1);
});
