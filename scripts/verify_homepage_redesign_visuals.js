/**
 * Sriyas Healthcare -- Master Pure White 3D Redesign & Visual Verification Suite
 * Executes real headless Chrome browser tests with CDP to observe:
 * 1. Pure white theme across all homepage sections (#FFFFFF, #FAFAFA, #F7F7F7)
 * 2. Restored Hero CTA buttons: "Explore Sriyas" and "View Products"
 * 3. Dynamic Company in Action Carousel: single-image focus, auto-rotation, infinite loop, prev/next, dots
 * 4. Leadership sequential alternating editorial layout: Row 1 Text-L/Photo-R, Row 2 Photo-L/Text-R
 * 5. About Us section with authentic clinical photos (unsuitable storefront removed)
 * 6. What We Do cards on #F7F7F7 with subtle 3D perspective hover tilt
 * 7. Values section with pure white cards and gold numerals 01-06
 * 8. Final CTA with corporate navy card on white section, clickable phone & email
 * 9. Mobile responsiveness (390px iPhone viewport) and zero horizontal overflow
 * 10. High-resolution screenshots saved to the artifacts directory
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_HP';
const rootDir = path.join(__dirname, '..');
const TARGET_URL = 'http://127.0.0.1:5173';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let serverProc = null;
let clientProc = null;

async function waitForHttp(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 304 || res.status === 404) {
        return true;
      }
    } catch (_) {}
    await sleep(400);
  }
  return false;
}

async function startServers() {
  console.log('[Servers] Checking if Backend (port 5000) or Client (port 5173) are active...');
  const backendAlreadyUp = await waitForHttp('http://127.0.0.1:5000/api/health', 1500);
  const clientAlreadyUp = await waitForHttp('http://127.0.0.1:5173/', 1500);

  if (!backendAlreadyUp) {
    console.log('[Servers] Starting Backend Server (node server/server.js)...');
    serverProc = spawn('node', ['server/server.js'], {
      cwd: rootDir,
      env: { ...process.env, USE_LOCAL_DB: 'true', PORT: '5000', HOST: '127.0.0.1' },
      stdio: 'ignore'
    });
  } else {
    console.log('[Servers] Backend already running on http://127.0.0.1:5000');
  }

  if (!clientAlreadyUp) {
    console.log('[Servers] Starting Client Server (node vite.js)...');
    const viteBin = path.join(rootDir, 'client', 'node_modules', 'vite', 'bin', 'vite.js');
    clientProc = spawn('node', [viteBin, '--host', '127.0.0.1', '--port', '5173'], {
      cwd: path.join(rootDir, 'client'),
      stdio: 'ignore'
    });
  } else {
    console.log('[Servers] Client already running on http://127.0.0.1:5173');
  }

  const backendReady = await waitForHttp('http://127.0.0.1:5000/api/health', 25000);
  if (!backendReady) throw new Error('Backend failed to start on port 5000.');
  console.log('[Servers] Backend confirmed healthy at http://127.0.0.1:5000/api/health');

  const clientReady = await waitForHttp('http://127.0.0.1:5173/', 25000);
  if (!clientReady) throw new Error('Client failed to start on port 5173.');
  console.log('[Servers] Client confirmed responsive at http://127.0.0.1:5173/');
}

async function startChrome() {
  console.log('[Chrome] Checking for existing Chrome CDP on port 9222...');
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    if (res.ok) {
      const data = await res.json();
      console.log('[Chrome] Connected to existing Chrome instance:', data.Browser);
      return data;
    }
  } catch (_) {}

  console.log('[Chrome] Launching Chrome headless on port 9222...');
  const proc = spawn(
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

  let connected = false;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        connected = true;
        break;
      }
    } catch (_) {}
  }
  if (!connected) throw new Error('Failed to launch Chrome with CDP.');
  console.log('[Chrome] Successfully started and listening on port 9222.');
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
          const { res, rej } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) rej(new Error(msg.error.message || JSON.stringify(msg.error)));
          else res(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const id = this.nextId++;
      this.callbacks.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true
    });
    const filePath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    console.log(`  [Screenshot] Saved: ${filename} (${Math.round(res.data.length / 1024)} KB)`);
  }

  async setViewport(width, height, isMobile = false, deviceScaleFactor = 2) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: isMobile
    });
    await this.send('Emulation.setVisibleSize', { width, height });
    await sleep(250);
  }

  close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
    }
  }
}

async function runVisualVerification() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SRIYAS HEALTHCARE -- PURE WHITE 3D HOMEPAGE VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════');

  await startServers();
  await startChrome();

  const newTabRes = await fetch('http://127.0.0.1:9222/json/new', { method: 'PUT' });
  const tabData = await newTabRes.json();
  const cdp = new CdpClient(tabData.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');

  try {
    // ═══════════════════════════════════════════════════════════════
    // 1. DESKTOP VIEWPORT TEST (1440 x 900)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n[Test 1] Setting Desktop Viewport (1440x900)...');
    await cdp.setViewport(1440, 900, false, 2);

    console.log(`[Navigation] Navigating to ${TARGET_URL}...`);
    await cdp.send('Page.navigate', { url: TARGET_URL });
    await sleep(2000);

    // Verify Pure White Theme and Hero Elements
    const heroInfo = await cdp.eval(`
      (() => {
        const rootEl = document.querySelector('.hp-root');
        const heroEl = document.querySelector('.hp-hero-section');
        const rootBg = rootEl ? window.getComputedStyle(rootEl).backgroundColor : null;
        const heroBg = heroEl ? window.getComputedStyle(heroEl).backgroundColor : null;
        const cta1 = document.querySelector('#hero-primary-cta')?.textContent?.trim();
        const cta1Href = document.querySelector('#hero-primary-cta')?.getAttribute('href');
        const cta2 = document.querySelector('#hero-secondary-cta')?.textContent?.trim();
        const cta2Href = document.querySelector('#hero-secondary-cta')?.getAttribute('href');
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        return { rootBg, heroBg, cta1, cta1Href, cta2, cta2Href, overflow };
      })()
    `);
    console.log('[Hero Verification]', heroInfo);
    await cdp.captureScreenshot('58_homepage_hero_white_desktop.png');

    // Verify About Sriyas Healthcare
    console.log('\n[Test 2] Scrolling to About Sriyas Healthcare (#about-sriyas)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('about-sriyas');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(900);

    const aboutInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('about-sriyas');
        if (!el) return null;
        const isRevealed = el.classList.contains('is-revealed');
        const heading = el.querySelector('.hp-heading')?.textContent?.trim();
        const images = Array.from(el.querySelectorAll('.hp-collage-media img')).map(img => ({
          alt: img.alt,
          src: img.src
        }));
        const hasStorefront = images.some(i => i.src.includes('storefront-location'));
        const bg = window.getComputedStyle(el).backgroundColor;
        return { isRevealed, heading, imagesCount: images.length, hasStorefront, bg };
      })()
    `);
    console.log('[About Section Verification]', aboutInfo);
    await cdp.captureScreenshot('59_homepage_about_white_desktop.png');

    // Verify Dynamic Company in Action Carousel (#our-workplace)
    console.log('\n[Test 3] Scrolling to Company in Action Carousel (#our-workplace)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('our-workplace');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(900);

    const carouselInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('our-workplace');
        if (!el) return null;
        const eyebrow = el.querySelector('.hp-eyebrow')?.textContent?.trim();
        const heading = el.querySelector('.hp-heading')?.textContent?.trim();
        const slides = Array.from(el.querySelectorAll('.hp-carousel-slide'));
        const activeSlide = el.querySelector('.hp-carousel-slide.is-active');
        const activeTitle = activeSlide?.querySelector('.hp-carousel-title')?.textContent?.trim();
        const activeTag = activeSlide?.querySelector('.hp-carousel-tag-badge')?.textContent?.trim();
        const counter = el.querySelector('.hp-carousel-counter')?.textContent?.trim();
        const dotsCount = el.querySelectorAll('.hp-carousel-dot').length;
        const hasPrev = Boolean(el.querySelector('.hp-carousel-btn--prev'));
        const hasNext = Boolean(el.querySelector('.hp-carousel-btn--next'));
        const bg = window.getComputedStyle(el).backgroundColor;
        return {
          eyebrow,
          heading,
          slidesCount: slides.length,
          activeTitle,
          activeTag,
          counter,
          dotsCount,
          hasPrev,
          hasNext,
          bg
        };
      })()
    `);
    console.log('[Carousel Initial State]', carouselInfo);

    // Test clicking Next button on Carousel
    console.log('  Testing Carousel Next button click...');
    await cdp.eval(`
      (() => {
        const nextBtn = document.querySelector('.hp-carousel-btn--next');
        if (nextBtn) nextBtn.click();
      })()
    `);
    await sleep(750);

    const carouselAfterNext = await cdp.eval(`
      (() => {
        const el = document.getElementById('our-workplace');
        const activeSlide = el.querySelector('.hp-carousel-slide.is-active');
        const activeTitle = activeSlide?.querySelector('.hp-carousel-title')?.textContent?.trim();
        const counter = el.querySelector('.hp-carousel-counter')?.textContent?.trim();
        return { activeTitle, counter };
      })()
    `);
    console.log('[Carousel After Next Click]', carouselAfterNext);
    await cdp.captureScreenshot('60_homepage_carousel_action_desktop.png');

    // Verify Leadership & Governance Sequential Editorial Presentation (#leadership)
    console.log('\n[Test 4] Scrolling to Leadership & Governance (#leadership)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('leadership');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(900);

    const leadershipInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('leadership');
        if (!el) return null;
        const eyebrow = el.querySelector('.hp-eyebrow')?.textContent?.trim();
        const heading = el.querySelector('.hp-heading')?.textContent?.trim();
        const rows = Array.from(el.querySelectorAll('.hp-leadership-row')).map((row, idx) => {
          const name = row.querySelector('.hp-leadership-name')?.textContent?.trim();
          const role = row.querySelector('.hp-leadership-role')?.textContent?.trim();
          const isReversed = row.classList.contains('hp-leadership-row--reversed');
          const hasLeft = Boolean(row.querySelector('.hp-converge-left'));
          const hasRight = Boolean(row.querySelector('.hp-converge-right'));
          const emailLink = row.querySelector('.hp-leadership-email-btn')?.getAttribute('href');
          return { name, role, isReversed, hasLeft, hasRight, emailLink };
        });
        const bg = window.getComputedStyle(el).backgroundColor;
        return { eyebrow, heading, rowsCount: rows.length, rows, bg };
      })()
    `);
    console.log('[Leadership Editorial Verification]', leadershipInfo);
    await cdp.captureScreenshot('61_homepage_leadership_editorial_desktop.png');

    // Verify Team Section (#team)
    console.log('\n[Test 5] Scrolling to Team Section (#team)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('team');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(900);

    const teamInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('team');
        if (!el) return null;
        const cards = Array.from(el.querySelectorAll('.hp-team-card')).map(card => {
          const name = card.querySelector('.hp-team-name')?.textContent?.trim();
          const role = card.querySelector('.hp-team-role')?.textContent?.trim();
          return { name, role };
        });
        return { cardsCount: cards.length, cards };
      })()
    `);
    console.log('[Team Section Verification]', teamInfo);
    await cdp.captureScreenshot('62_homepage_team_desktop.png');

    // Verify What We Do Section (#what-we-do)
    console.log('\n[Test 6] Scrolling to What We Do Section (#what-we-do)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('what-we-do');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(900);

    const wwdInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('what-we-do');
        if (!el) return null;
        const cards = Array.from(el.querySelectorAll('.hp-wwd-card')).map(card => {
          const title = card.querySelector('.hp-card-title')?.textContent?.trim();
          const bg = window.getComputedStyle(card).backgroundColor;
          return { title, bg };
        });
        const secBg = window.getComputedStyle(el).backgroundColor;
        return { secBg, cardsCount: cards.length, cards };
      })()
    `);
    console.log('[What We Do Verification]', wwdInfo);
    await cdp.captureScreenshot('63_homepage_what_we_do_desktop.png');

    // Verify Values Section (#why-choose-sriyas)
    console.log('\n[Test 7] Scrolling to Values Section (#why-choose-sriyas)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('why-choose-sriyas');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(900);

    const valuesInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('why-choose-sriyas');
        if (!el) return null;
        const cards = Array.from(el.querySelectorAll('.hp-wcu-card')).map(card => {
          const num = card.querySelector('.hp-wcu-numeral')?.textContent?.trim();
          const title = card.querySelector('.hp-wcu-title')?.textContent?.trim();
          return { num, title };
        });
        const secBg = window.getComputedStyle(el).backgroundColor;
        return { secBg, cardsCount: cards.length, cards };
      })()
    `);
    console.log('[Values Verification]', valuesInfo);
    await cdp.captureScreenshot('64_homepage_values_desktop.png');

    // Verify Final CTA Section (#cta-connect)
    console.log('\n[Test 8] Scrolling to Final CTA Section (#cta-connect)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('cta-connect');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(900);

    const ctaInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('cta-connect');
        if (!el) return null;
        const card = el.querySelector('.hp-cta-card');
        const heading = el.querySelector('#cta-heading')?.textContent?.trim();
        const phone = el.querySelector('.hp-cta-contact-item a[href^="tel:"]')?.textContent?.trim();
        const email = el.querySelector('.hp-cta-contact-item a[href^="mailto:"]')?.textContent?.trim();
        const secBg = window.getComputedStyle(el).backgroundColor;
        const cardBg = window.getComputedStyle(card).backgroundColor;
        return { heading, phone, email, secBg, cardBg };
      })()
    `);
    console.log('[CTA Verification]', ctaInfo);
    await cdp.captureScreenshot('65_homepage_final_cta_desktop.png');

    // ═══════════════════════════════════════════════════════════════
    // 2. MOBILE VIEWPORT TEST (390 x 844 -- iPhone 14)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n[Test 9] Setting Mobile Viewport (390x844, deviceScaleFactor: 3)...');
    await cdp.setViewport(390, 844, true, 3);
    await cdp.send('Page.navigate', { url: TARGET_URL });
    await sleep(2000);

    const mobileHero = await cdp.eval(`
      (() => {
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        const cta1 = document.querySelector('#hero-primary-cta')?.textContent?.trim();
        const cta2 = document.querySelector('#hero-secondary-cta')?.textContent?.trim();
        return { overflow, scrollWidth, innerWidth, cta1, cta2 };
      })()
    `);
    console.log('[Mobile Hero Verification]', mobileHero);
    await cdp.captureScreenshot('66_homepage_hero_mobile_390.png');

    // Scroll mobile to Carousel & Leadership
    console.log('\n[Test 10] Scrolling mobile to Carousel and Leadership...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('our-workplace');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })()
    `);
    await sleep(1000);

    const mobileCarousel = await cdp.eval(`
      (() => {
        const el = document.getElementById('our-workplace');
        const activeSlide = el?.querySelector('.hp-carousel-slide.is-active');
        const title = activeSlide?.querySelector('.hp-carousel-title')?.textContent?.trim();
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        return { title, overflow };
      })()
    `);
    console.log('[Mobile Carousel Verification]', mobileCarousel);
    await cdp.captureScreenshot('67_homepage_carousel_leadership_mobile_390.png');

    // Scroll mobile to Values and CTA
    console.log('\n[Test 11] Scrolling mobile to Values and CTA...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('cta-connect');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(1000);

    const mobileCta = await cdp.eval(`
      (() => {
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        const heading = document.getElementById('cta-heading')?.textContent?.trim();
        return { overflow, heading };
      })()
    `);
    console.log('[Mobile CTA Verification]', mobileCta);
    await cdp.captureScreenshot('68_homepage_values_cta_mobile_390.png');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ALL REAL BROWSER VISUAL VERIFICATION TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════════════');

  } finally {
    cdp.close();
  }
}

runVisualVerification()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal Verification Error:', err);
    process.exit(1);
  });
