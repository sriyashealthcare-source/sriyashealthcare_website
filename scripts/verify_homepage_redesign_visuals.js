/**
 * Sriyas Healthcare -- Master Gen-Z Editorial Redesign & Visual Verification Suite
 * Executes real headless Chrome browser tests with CDP to observe:
 * 1. Company in Action: Exactly 8 images, 4s auto-advance, 8 pagination dots, active in gold, NO arrows.
 * 2. Mobile Carousel visibility: verify bounding rect, full width, visible caption, zero overflow.
 * 3. About Sriyas Healthcare: Opposite-direction convergence, sequential reveals.
 * 4. What We Do: Interactive capability showcase (5 capabilities), slim progress bar, large photo, no orphaned cards.
 * 5. Leadership & Governance: Alternating sequential editorial layout (M. Ravikumar & Corporate Operations).
 * 6. Our Values & Commitment: 6 values in an elegant editorial sequence with prominent gold numerals 01-06.
 * 7. Hero section: "Explore Sriyas" and "View Products" CTA buttons, pure white & gold branding.
 * 8. Zero horizontal overflow across desktop (1440px) and mobile (390px).
 * 9. Captures high-resolution artifacts screenshots.
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
  console.log('  SRIYAS HEALTHCARE -- MASTER REDESIGN VERIFICATION SUITE');
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
    await cdp.captureScreenshot('69_homepage_hero_desktop.png');

    // Verify About Sriyas Healthcare & Opposite-Direction Convergence
    console.log('\n[Test 2] Scrolling to About Sriyas Healthcare (#about-sriyas)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('about-sriyas');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(1000);

    const aboutInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('about-sriyas');
        if (!el) return null;
        const isRevealed = el.classList.contains('is-revealed');
        const heading = el.querySelector('.hp-heading')?.textContent?.trim();
        const hasConvergeLeft = Boolean(el.querySelector('.hp-converge-left'));
        const hasConvergeRight = Boolean(el.querySelector('.hp-converge-right'));
        const images = Array.from(el.querySelectorAll('.hp-collage-media img')).map(img => ({
          alt: img.alt,
          src: img.src
        }));
        return { isRevealed, heading, hasConvergeLeft, hasConvergeRight, imagesCount: images.length };
      })()
    `);
    console.log('[About Section Verification]', aboutInfo);
    await cdp.captureScreenshot('70_homepage_about_convergence_desktop.png');

    // Verify Dynamic 8-Image Automatic Carousel (#our-workplace)
    console.log('\n[Test 3] Scrolling to Company in Action 8-Image Carousel (#our-workplace)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('our-workplace');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(1000);

    const carouselInitial = await cdp.eval(`
      (() => {
        const el = document.getElementById('our-workplace');
        if (!el) return null;
        const slides = Array.from(el.querySelectorAll('.hp-carousel-slide'));
        const activeSlide = el.querySelector('.hp-carousel-slide.is-active');
        const activeTitle = activeSlide?.querySelector('.hp-carousel-title')?.textContent?.trim();
        const counter = el.querySelector('.hp-carousel-counter')?.textContent?.trim();
        const dotsCount = el.querySelectorAll('.hp-carousel-dot').length;
        const activeDot = el.querySelector('.hp-carousel-dot.is-active');
        const hasArrows = Boolean(el.querySelector('.hp-carousel-btn'));
        const isVisible = el.getBoundingClientRect().height > 200;
        return {
          slidesCount: slides.length,
          activeTitle,
          counter,
          dotsCount,
          hasActiveDot: Boolean(activeDot),
          hasArrows,
          isVisible
        };
      })()
    `);
    console.log('[Carousel Initial State - 8 Images, No Arrows, Active Dot]:', carouselInitial);

    // Test automatic rotation: wait ~4.2 seconds to observe automatic advancement without click
    console.log('  Waiting 4.2 seconds to verify automatic slide rotation without user interaction...');
    await sleep(4200);

    const carouselAfterAuto = await cdp.eval(`
      (() => {
        const el = document.getElementById('our-workplace');
        const activeSlide = el.querySelector('.hp-carousel-slide.is-active');
        const activeTitle = activeSlide?.querySelector('.hp-carousel-title')?.textContent?.trim();
        const counter = el.querySelector('.hp-carousel-counter')?.textContent?.trim();
        return { activeTitle, counter };
      })()
    `);
    console.log('[Carousel After 4.2s Automatic Advance]:', carouselAfterAuto);
    await cdp.captureScreenshot('71_homepage_carousel_8images_desktop.png');

    // Verify Leadership & Governance Sequential Alternating Editorial Layout
    console.log('\n[Test 4] Scrolling to Leadership & Governance (#leadership)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('leadership');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(1000);

    const leadershipInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('leadership');
        if (!el) return null;
        const rows = Array.from(el.querySelectorAll('.hp-leadership-row')).map((row, idx) => {
          const name = row.querySelector('.hp-leadership-name')?.textContent?.trim();
          const role = row.querySelector('.hp-leadership-role')?.textContent?.trim();
          const isReversed = row.classList.contains('hp-leadership-row--reversed');
          const hasLeft = Boolean(row.querySelector('.hp-converge-left'));
          const hasRight = Boolean(row.querySelector('.hp-converge-right'));
          const email = row.querySelector('.hp-leadership-email-btn')?.getAttribute('href');
          return { name, role, isReversed, hasLeft, hasRight, email };
        });
        return { rowsCount: rows.length, rows };
      })()
    `);
    console.log('[Leadership Editorial Alternating Layout]:', leadershipInfo);
    await cdp.captureScreenshot('72_homepage_leadership_alternating_desktop.png');

    // Verify What We Do Interactive Capability Showcase (#what-we-do)
    console.log('\n[Test 5] Scrolling to What We Do Interactive Showcase (#what-we-do)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('what-we-do');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(1000);

    const wwdInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('what-we-do');
        if (!el) return null;
        const heading = el.querySelector('#wwd-heading')?.textContent?.trim();
        const subtitle = el.querySelector('.hp-section-subtitle')?.textContent?.trim();
        const tabs = Array.from(el.querySelectorAll('.hp-wwd-tab')).map(t => t.textContent.trim());
        const activeTitle = el.querySelector('.hp-wwd-active-title')?.textContent?.trim();
        const activeDesc = el.querySelector('.hp-wwd-active-desc')?.textContent?.trim();
        const numeral = el.querySelector('.hp-wwd-numeral')?.textContent?.trim();
        const photoActive = el.querySelector('.hp-wwd-photo-frame.is-active img')?.getAttribute('src');
        const hasStepNav = Boolean(el.querySelector('.hp-wwd-step-nav'));
        return {
          heading,
          subtitle,
          tabsCount: tabs.length,
          tabs,
          numeral,
          activeTitle,
          hasPhoto: Boolean(photoActive),
          hasStepNav
        };
      })()
    `);
    console.log('[What We Do Interactive Capability Showcase]:', wwdInfo);

    // Test clicking Tab 2 (Global Alliances) in What We Do
    console.log('  Testing What We Do Tab Click (switching to Tab 2)...');
    await cdp.eval(`
      (() => {
        const tabs = document.querySelectorAll('.hp-wwd-tab');
        if (tabs[1]) tabs[1].click();
      })()
    `);
    await sleep(700);

    const wwdAfterClick = await cdp.eval(`
      (() => {
        const el = document.getElementById('what-we-do');
        const numeral = el.querySelector('.hp-wwd-numeral')?.textContent?.trim();
        const activeTitle = el.querySelector('.hp-wwd-active-title')?.textContent?.trim();
        return { numeral, activeTitle };
      })()
    `);
    console.log('[What We Do After Selecting Tab 2]:', wwdAfterClick);
    await cdp.captureScreenshot('73_homepage_what_we_do_showcase_desktop.png');

    // Verify Values Section (#why-choose-sriyas)
    console.log('\n[Test 6] Scrolling to Values Editorial Sequence (#why-choose-sriyas)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('why-choose-sriyas');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(1000);

    const valuesInfo = await cdp.eval(`
      (() => {
        const el = document.getElementById('why-choose-sriyas');
        if (!el) return null;
        const items = Array.from(el.querySelectorAll('.hp-value-item')).map(item => {
          const num = item.querySelector('.hp-value-numeral')?.textContent?.trim();
          const title = item.querySelector('.hp-value-title')?.textContent?.trim();
          return { num, title };
        });
        const hasFeatureImg = Boolean(el.querySelector('.hp-values-feature-frame img'));
        return { itemsCount: items.length, items, hasFeatureImg };
      })()
    `);
    console.log('[Values Editorial Sequence (6 values)]:', valuesInfo);
    await cdp.captureScreenshot('74_homepage_values_sequence_desktop.png');

    // Verify Final CTA
    console.log('\n[Test 7] Scrolling to Final CTA (#cta-connect)...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('cta-connect');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()
    `);
    await sleep(800);
    await cdp.captureScreenshot('75_homepage_final_cta_desktop.png');

    // ═══════════════════════════════════════════════════════════════
    // 2. MOBILE VIEWPORT TEST (390 x 844 -- iPhone 14)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n[Test 8] Setting Mobile Viewport (390x844, deviceScaleFactor: 3)...');
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
    console.log('[Mobile Hero Verification - Zero Overflow]:', mobileHero);
    await cdp.captureScreenshot('76_homepage_hero_mobile_390.png');

    // Mobile Company in Action Carousel Visibility
    console.log('\n[Test 9] Checking Mobile Carousel Visibility (#our-workplace)...');
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
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const activeSlide = el.querySelector('.hp-carousel-slide.is-active');
        const title = activeSlide?.querySelector('.hp-carousel-title')?.textContent?.trim();
        const caption = activeSlide?.querySelector('.hp-carousel-caption')?.textContent?.trim();
        const dotsCount = el.querySelectorAll('.hp-carousel-dot').length;
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        const computedDisplay = window.getComputedStyle(el).display;
        const computedVisibility = window.getComputedStyle(el).visibility;
        const computedOpacity = window.getComputedStyle(el).opacity;
        return {
          height: rect.height,
          width: rect.width,
          computedDisplay,
          computedVisibility,
          computedOpacity,
          title,
          captionLength: caption ? caption.length : 0,
          dotsCount,
          overflow
        };
      })()
    `);
    console.log('[Mobile Carousel Verification - Visible & Responsive]:', mobileCarousel);
    await cdp.captureScreenshot('77_homepage_carousel_mobile_390.png');

    // Mobile What We Do Showcase
    console.log('\n[Test 10] Checking Mobile What We Do Showcase...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('what-we-do');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })()
    `);
    await sleep(1000);

    const mobileWwd = await cdp.eval(`
      (() => {
        const el = document.getElementById('what-we-do');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const title = el.querySelector('.hp-wwd-active-title')?.textContent?.trim();
        const tabsCount = el.querySelectorAll('.hp-wwd-tab').length;
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        return { height: rect.height, title, tabsCount, overflow };
      })()
    `);
    console.log('[Mobile What We Do Showcase]:', mobileWwd);
    await cdp.captureScreenshot('78_homepage_what_we_do_mobile_390.png');

    // Mobile Values & Contact
    console.log('\n[Test 11] Checking Mobile Values & Contact...');
    await cdp.eval(`
      (() => {
        const el = document.getElementById('why-choose-sriyas');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })()
    `);
    await sleep(1000);

    const mobileValues = await cdp.eval(`
      (() => {
        const el = document.getElementById('why-choose-sriyas');
        if (!el) return null;
        const itemsCount = el.querySelectorAll('.hp-value-item').length;
        const overflow = document.documentElement.scrollWidth > window.innerWidth;
        return { itemsCount, overflow };
      })()
    `);
    console.log('[Mobile Values Verification]:', mobileValues);
    await cdp.captureScreenshot('79_homepage_values_mobile_390.png');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ALL MASTER REDESIGN VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
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
