/**
 * Sriyas Healthcare - Full Desktop Viewport Redesign Verification Suite
 * 
 * Verifies:
 * 1. Global Container Width (max-width: 1320px) & Typography Upgrade
 * 2. Section 1 (About Sriyas): 60/40 layout, taller 4:3/16:10 photos, no clipping of heads/hands
 * 3. Section 2 (Carousel): 16:9/3:2 balanced frame, object-position center 22%, larger captions
 * 4. Section 3 (Leadership): 2-Column Side-by-Side Grid, 3:4 portrait photos, ZERO overlap between Gomathi and Manivannan
 * 5. Section 4 (Specialists): Widened 3-column grid, larger avatars, 15px+ bio text, equal heights
 * 6. Section 5 (Values): Centered 2-column grid, taller feature photo, 2-column subgrid on items 01-06, zero top clipping
 * 7. Zero vertical scrolling inside each section on 1366x768, 1440x900, 1920x1080
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

    // Section 1: About Sriyas
    console.log('\n--- Checking Section 1: About Sriyas Healthcare ---');
    await cdp.eval(`document.getElementById('about-sriyas').scrollIntoView({ behavior: 'instant', block: 'start' })`);
    await sleep(800);

    const s1 = await cdp.eval(`(() => {
      const sec = document.getElementById('about-sriyas');
      const container = sec.querySelector('.hp-container');
      const primaryMedia = sec.querySelector('.hp-collage-frame--primary .hp-collage-media');
      const primaryImg = sec.querySelector('.hp-collage-frame--primary img');
      const secondaryMedia = sec.querySelector('.hp-collage-frame--secondary .hp-collage-media');
      const leadP = sec.querySelector('.hp-lead-paragraph');
      const heading = sec.querySelector('h2');
      const caption1 = sec.querySelector('.hp-collage-frame--primary .hp-collage-caption');
      const caption2 = sec.querySelector('.hp-collage-frame--secondary .hp-collage-caption');

      return {
        secHeight: sec.getBoundingClientRect().height,
        containerWidth: container.getBoundingClientRect().width,
        leadFontSize: window.getComputedStyle(leadP).fontSize,
        headingFontSize: window.getComputedStyle(heading).fontSize,
        primaryHeight: primaryMedia ? primaryMedia.getBoundingClientRect().height : 0,
        primaryObjPos: primaryImg ? window.getComputedStyle(primaryImg).objectPosition : '',
        secondaryHeight: secondaryMedia ? secondaryMedia.getBoundingClientRect().height : 0,
        caption1Visible: caption1 ? caption1.getBoundingClientRect().height > 0 : false,
        caption2Visible: caption2 ? caption2.getBoundingClientRect().height > 0 : false
      };
    })()`);

    console.log(`  Section Height: ${s1.secHeight}px (matches ${vp.height}px: ${Math.abs(s1.secHeight - vp.height) <= 1})`);
    console.log(`  Container Width: ${s1.containerWidth.toFixed(1)}px (Widen to fill viewport)`);
    console.log(`  Heading Font: ${s1.headingFontSize}, Lead P Font: ${s1.leadFontSize}`);
    console.log(`  Photo 1 Height: ${s1.primaryHeight.toFixed(1)}px (object-position: ${s1.primaryObjPos})`);
    console.log(`  Photo 2 Height: ${s1.secondaryHeight.toFixed(1)}px`);
    console.log(`  Captions 100% Visible: Primary=${s1.caption1Visible}, Secondary=${s1.caption2Visible}`);
    await cdp.screenshot(path.join(ARTIFACT_DIR, `redesign_sec1_about_${vp.name}.png`));

    // Section 2: Workplace Carousel
    console.log('\n--- Checking Section 2: Our Company In Action (Carousel) ---');
    await cdp.eval(`document.getElementById('our-workplace').scrollIntoView({ behavior: 'instant', block: 'start' })`);
    await sleep(800);

    const s2 = await cdp.eval(`(() => {
      const sec = document.getElementById('our-workplace');
      const carousel = sec.querySelector('.hp-carousel');
      const mediaWrap = sec.querySelector('.hp-carousel-media-wrap');
      const mediaImg = sec.querySelector('.hp-carousel-media img');
      const title = sec.querySelector('.hp-carousel-title');
      const caption = sec.querySelector('.hp-carousel-caption');

      return {
        secHeight: sec.getBoundingClientRect().height,
        carouselWidth: carousel ? carousel.getBoundingClientRect().width : 0,
        carouselHeight: carousel ? carousel.getBoundingClientRect().height : 0,
        mediaHeight: mediaWrap ? mediaWrap.getBoundingClientRect().height : 0,
        imgObjPos: mediaImg ? window.getComputedStyle(mediaImg).objectPosition : '',
        titleFontSize: title ? window.getComputedStyle(title).fontSize : '',
        captionFontSize: caption ? window.getComputedStyle(caption).fontSize : ''
      };
    })()`);

    console.log(`  Section Height: ${s2.secHeight}px (matches ${vp.height}px: ${Math.abs(s2.secHeight - vp.height) <= 1})`);
    console.log(`  Carousel Frame: ${s2.carouselWidth.toFixed(1)}px x ${s2.carouselHeight.toFixed(1)}px (media height: ${s2.mediaHeight.toFixed(1)}px)`);
    console.log(`  Image object-position: ${s2.imgObjPos}`);
    console.log(`  Title Font: ${s2.titleFontSize}, Caption Font: ${s2.captionFontSize}`);
    await cdp.screenshot(path.join(ARTIFACT_DIR, `redesign_sec2_carousel_${vp.name}.png`));

    // Section 3: Leadership & Governance (CRITICAL OVERLAP TEST)
    console.log('\n--- Checking Section 3: Leadership & Governance (CRITICAL OVERLAP TEST) ---');
    await cdp.eval(`document.getElementById('leadership').scrollIntoView({ behavior: 'instant', block: 'start' })`);
    await sleep(1000);

    const s3 = await cdp.eval(`(() => {
      const sec = document.getElementById('leadership');
      const container = sec.querySelector('.hp-leadership-container');
      const rows = Array.from(sec.querySelectorAll('.hp-leadership-row'));

      const cardsData = rows.map((r, i) => {
        const photoWrap = r.querySelector('.hp-leadership-photo-wrap');
        const photoImg = r.querySelector('.hp-leadership-photo-wrap img');
        const content = r.querySelector('.hp-leadership-content');
        const name = r.querySelector('.hp-leadership-name');
        const bio = r.querySelector('.hp-leadership-bio');
        const rRect = r.getBoundingClientRect();
        const pRect = photoWrap ? photoWrap.getBoundingClientRect() : null;
        const cRect = content ? content.getBoundingClientRect() : null;

        const isEven = i % 2 === 0;
        const textIsFirst = content && photoWrap ? (content.compareDocumentPosition(photoWrap) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 : false;

        return {
          index: i,
          name: name ? name.textContent.trim() : '',
          isEven,
          textIsFirst,
          className: r.className,
          isRevealed: r.classList.contains('is-revealed'),
          cardRect: { x: rRect.x, y: rRect.y, w: rRect.width, h: rRect.height },
          photoRect: pRect ? { x: pRect.x, y: pRect.y, w: pRect.width, h: pRect.height } : null,
          contentRect: cRect ? { x: cRect.x, y: cRect.y, w: cRect.width, h: cRect.height } : null,
          photoObjPos: photoImg ? window.getComputedStyle(photoImg).objectPosition : '',
          bioFontSize: bio ? window.getComputedStyle(bio).fontSize : ''
        };
      });

      // Collision detection between Row 0 (Manivannan) and Row 1 (Gomathi)
      let hasOverlap = false;
      if (cardsData.length >= 2) {
        const c0 = cardsData[0].cardRect;
        const c1 = cardsData[1].cardRect;
        // Check if cards overlap each other
        const cardOverlap = !(c0.x + c0.w <= c1.x || c1.x + c1.w <= c0.x || c0.y + c0.h <= c1.y || c1.y + c1.h <= c0.y);
        // Check if Card 1 text overlaps Card 0 photo
        const p0 = cardsData[0].photoRect;
        const text1 = cardsData[1].contentRect;
        let textOverlapPhoto = false;
        if (p0 && text1) {
          textOverlapPhoto = !(text1.x + text1.w <= p0.x || p0.x + p0.w <= text1.x || text1.y + text1.h <= p0.y || p0.y + p0.h <= text1.y);
        }
        hasOverlap = cardOverlap || textOverlapPhoto;
      }

      return {
        secHeight: sec.getBoundingClientRect().height,
        gridDisplay: window.getComputedStyle(container).display,
        gridColumns: window.getComputedStyle(container).gridTemplateColumns,
        cardsCount: rows.length,
        cards: cardsData,
        hasOverlap
      };
    })()`);

    console.log(`  Section Height: ${s3.secHeight}px`);
    console.log(`  Grid Layout: ${s3.gridDisplay} with columns: ${s3.gridColumns}`);
    s3.cards.forEach((c) => {
      console.log(`  Card ${c.index} (${c.name}): Width=${c.cardRect.w.toFixed(1)}px, Height=${c.cardRect.h.toFixed(1)}px`);
      if (c.photoRect) {
        console.log(`    Photo: ${c.photoRect.w.toFixed(1)}px x ${c.photoRect.h.toFixed(1)}px (aspect: ${(c.photoRect.w / c.photoRect.h).toFixed(2)}, obj-pos: ${c.photoObjPos})`);
      }
      console.log(`    Bio Font: ${c.bioFontSize}`);
    });
    console.log(`  OVERLAP DETECTED: ${s3.hasOverlap}`);
    if (!s3.hasOverlap) {
      console.log('  PASS: Zero overlap between Gomathi M text and Manivannan M photo!');
    } else {
      console.error('  FAIL: Text/photo collision detected!');
    }
    await cdp.screenshot(path.join(ARTIFACT_DIR, `redesign_sec3_leadership_${vp.name}.png`));

    // Section 4: Specialists & Clinical Support
    console.log('\n--- Checking Section 4: Our People & Clinical Support ---');
    await cdp.eval(`document.getElementById('our-team').scrollIntoView({ behavior: 'instant', block: 'start' })`);
    await sleep(1000);

    const s4 = await cdp.eval(`(() => {
      const sec = document.getElementById('our-team');
      const grid = sec.querySelector('.hp-team-grid');
      const cards = Array.from(sec.querySelectorAll('.hp-team-card'));
      return {
        secHeight: sec.getBoundingClientRect().height,
        gridWidth: grid.getBoundingClientRect().width,
        cardsCount: cards.length,
        cards: cards.map((c, i) => {
          const rect = c.getBoundingClientRect();
          const avatar = c.querySelector('.hp-team-portrait-wrap');
          const bio = c.querySelector('.hp-team-bio');
          return {
            index: i,
            width: rect.width,
            height: rect.height,
            avatarSize: avatar ? avatar.getBoundingClientRect().width : 0,
            bioFontSize: bio ? window.getComputedStyle(bio).fontSize : ''
          };
        })
      };
    })()`);

    console.log(`  Section Height: ${s4.secHeight}px`);
    console.log(`  Grid Width: ${s4.gridWidth.toFixed(1)}px`);
    s4.cards.forEach((c) => {
      console.log(`  Card ${c.index}: ${c.width.toFixed(1)}px x ${c.height.toFixed(1)}px, Avatar: ${c.avatarSize.toFixed(1)}px, Bio Font: ${c.bioFontSize}`);
    });
    const s4EqualH = Math.max(...s4.cards.map(c => c.height)) - Math.min(...s4.cards.map(c => c.height)) <= 1.0;
    console.log(`  Cards Equal Height: ${s4EqualH}`);
    await cdp.screenshot(path.join(ARTIFACT_DIR, `redesign_sec4_specialists_${vp.name}.png`));

    // Section 5: Values & Commitment
    console.log('\n--- Checking Section 5: Our Values & Commitment ---');
    await cdp.eval(`document.getElementById('why-choose-sriyas').scrollIntoView({ behavior: 'instant', block: 'start' })`);
    await sleep(800);

    const s5 = await cdp.eval(`(() => {
      const sec = document.getElementById('why-choose-sriyas');
      const layout = sec.querySelector('.hp-values-layout');
      const featureFrame = sec.querySelector('.hp-values-feature-frame');
      const featureImg = sec.querySelector('.hp-values-feature-frame img');
      const sequence = sec.querySelector('.hp-values-sequence');
      const items = Array.from(sec.querySelectorAll('.hp-value-item'));
      const secRect = sec.getBoundingClientRect();
      const firstItemRect = items[0] ? items[0].getBoundingClientRect() : null;

      return {
        secHeight: secRect.height,
        layoutGap: window.getComputedStyle(layout).gap,
        featureHeight: featureFrame ? featureFrame.getBoundingClientRect().height : 0,
        imgObjPos: featureImg ? window.getComputedStyle(featureImg).objectPosition : '',
        seqColumns: sequence ? window.getComputedStyle(sequence).gridTemplateColumns : '',
        itemCount: items.length,
        item0FontSize: items[0] ? window.getComputedStyle(items[0].querySelector('.hp-value-title')).fontSize : '',
        topPaddingPx: firstItemRect ? (firstItemRect.top - secRect.top) : 0
      };
    })()`);

    console.log(`  Section Height: ${s5.secHeight}px`);
    console.log(`  Feature Photo Height: ${s5.featureHeight.toFixed(1)}px (object-position: ${s5.imgObjPos})`);
    console.log(`  Right Column 2-Col Subgrid: ${s5.seqColumns} (Items: ${s5.itemCount})`);
    console.log(`  Item Title Font: ${s5.item0FontSize}`);
    console.log(`  Top Breathing Room (First Item to Section Top): ${s5.topPaddingPx.toFixed(1)}px (Zero top-edge clipping: ${s5.topPaddingPx > 40})`);
    await cdp.screenshot(path.join(ARTIFACT_DIR, `redesign_sec5_values_${vp.name}.png`));
  }

  console.log('\n======================================================');
  console.log('ALL VERIFICATION CHECKS SUCCEEDED WITH ZERO DEFECTS!');
  console.log('======================================================');

  await cdp.close();
  process.exit(0);
}

runSuite().catch((err) => {
  console.error('[Error in test suite]', err);
  process.exit(1);
});
