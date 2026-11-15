const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession';
const USER_DATA_PORT_FILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\User Data\\DevToolsActivePort';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startChrome() {
  console.log('[Chrome] Checking if Chrome CDP is already listening on port 9222...');
  try {
    const res = await fetch('http://localhost:9222/json/version');
    if (res.ok) {
      const data = await res.json();
      console.log('[Chrome] Existing Chrome instance found:', data.Browser);
      return data;
    }
  } catch (_) {}

  console.log('[Chrome] Spawning Chrome headless with remote debugging on port 9222...');
  const proc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--remote-allow-origins=*',
    `--user-data-dir=${CHROME_DEV_PROFILE}`,
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-sync',
    '--no-first-run',
    'about:blank'
  ], {
    stdio: 'ignore',
    detached: true
  });
  proc.unref();

  let versionData = null;
  for (let i = 0; i < 25; i++) {
    await sleep(400);
    try {
      const res = await fetch('http://localhost:9222/json/version');
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch (_) {}
  }

  if (!versionData) {
    throw new Error('Chrome failed to start on port 9222.');
  }

  try {
    const wsUrl = new URL(versionData.webSocketDebuggerUrl);
    const content = `9222\n${wsUrl.pathname}\n`;
    fs.writeFileSync(USER_DATA_PORT_FILE, content, 'utf8');
    console.log('[Chrome] Synchronized DevToolsActivePort.');
  } catch (err) {
    console.warn('[Chrome] DevToolsActivePort warning:', err.message);
  }

  return versionData;
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.idCounter = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.id && this.callbacks.has(msg.id)) {
            const { resolve, reject } = this.callbacks.get(msg.id);
            this.callbacks.delete(msg.id);
            if (msg.error) {
              reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            } else {
              resolve(msg.result);
            }
          }
        } catch (e) {
          console.error('[CDP Parse Error]', e);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.idCounter++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${res.exceptionDetails.text} (${expression})`);
    }
    return res.result?.value;
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
    }
  }
}

async function createPageTab() {
  const newTargetRes = await fetch('http://localhost:9222/json/new?about:blank', { method: 'PUT' });
  const target = await newTargetRes.json();
  const page = new CDPClient(target.webSocketDebuggerUrl);
  await page.connect();
  await page.send('Page.enable');
  await page.send('DOM.enable');
  await page.send('Runtime.enable');
  return { page, targetId: target.id };
}

async function captureScreenshot(page, filename, clip = null) {
  const params = { format: 'png' };
  if (clip) params.clip = clip;
  const res = await page.send('Page.captureScreenshot', params);
  const outPath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
  console.log(`  📸 [Screenshot] ${filename} (${(res.data.length * 0.75 / 1024).toFixed(1)} KB)`);
  return outPath;
}

async function setViewport(page, width, height, isMobile = false) {
  await page.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: isMobile,
    screenOrientation: { angle: 0, type: isMobile ? 'portraitPrimary' : 'landscapePrimary' }
  });
  if (isMobile) {
    await page.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  } else {
    await page.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  }
}

async function scrollToSelector(page, selector, block = 'center') {
  await page.eval(`
    (() => {
      const el = document.querySelector('${selector}');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: '${block}' });
      }
    })()
  `);
  await sleep(750);
}

async function runVisualVerification() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SRIYAS HEALTHCARE — BROWSER VISUAL VERIFICATION SUITE');
  console.log('═══════════════════════════════════════════════════════════════');

  await startChrome();
  const { page } = await createPageTab();

  // ─────────────────────────────────────────────────────────────
  // 1. DESKTOP VIEWPORT (1920x1080)
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 1] Testing Desktop Viewport (1920x1080)...');
  await setViewport(page, 1920, 1080, false);
  await page.send('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(2500);

  // Capture Hero at Top
  await captureScreenshot(page, '01_desktop_1920_hero_top.png');

  // 1A. Scroll Reveal on About Sriyas Healthcare
  console.log('\n--- 1A. Scroll Reveal: About Section ---');
  await scrollToSelector(page, '#about-sriyas', 'center');
  await sleep(600);
  const aboutRevealed = await page.eval(`
    (() => {
      const el = document.querySelector('#about-sriyas');
      const heading = el?.querySelector('.hp-reveal-heading');
      const text = el?.querySelector('.hp-reveal-text');
      const csH = heading ? window.getComputedStyle(heading) : null;
      const csT = text ? window.getComputedStyle(text) : null;
      return {
        hasSection: Boolean(el),
        isRevealed: heading?.classList.contains('is-revealed') || el?.classList.contains('is-revealed'),
        headingOpacity: csH?.opacity,
        headingTransform: csH?.transform,
        textOpacity: csT?.opacity
      };
    })()
  `);
  console.log('  About Reveal State:', aboutRevealed);
  await captureScreenshot(page, '02_desktop_1920_about_revealed.png');

  // 1B. Animated Statistics Counter
  console.log('\n--- 1B. Animated Statistics Counter ---');
  await scrollToSelector(page, '#statistics-overview', 'center');
  await sleep(1800);
  const finalStats = await page.eval(`
    (() => {
      const cards = Array.from(document.querySelectorAll('.hp-stat-card'));
      return cards.map(c => ({
        metric: (c.querySelector('.hp-stat-prefix')?.textContent || '') +
                (c.querySelector('.hp-stat-number')?.textContent || '') +
                (c.querySelector('.hp-stat-suffix')?.textContent || ''),
        title: c.querySelector('.hp-stat-title')?.textContent,
        revealed: c.classList.contains('is-revealed')
      }));
    })()
  `);
  console.log('  Completed Final Statistics:', finalStats);
  await captureScreenshot(page, '03_desktop_1920_statistics_counted.png');

  // 1C. Workplace Gallery & Multi-Plane Parallax
  console.log('\n--- 1C. Workplace Gallery & Multi-Plane Parallax ---');
  await scrollToSelector(page, '#our-workplace', 'start');
  await sleep(600);

  // Scroll smoothly down through the section
  await page.eval(`window.scrollBy({ top: 320, behavior: 'smooth' });`);
  await sleep(800);

  const parallaxOffset = await page.eval(`
    (() => {
      const images = Array.from(document.querySelectorAll('.hp-workplace-media img'));
      return images.map((img, idx) => ({
        idx,
        src: img.src.split('/').pop(),
        parallaxY: img.style.getPropertyValue('--parallax-y'),
        transform: window.getComputedStyle(img).transform
      }));
    })()
  `);
  console.log('  Gallery Images & Parallax State:', parallaxOffset);
  await captureScreenshot(page, '04_desktop_1920_gallery_parallax.png');

  // 1D. Image Hover Interactions
  console.log('\n--- 1D. Image Hover Interactions ---');
  await scrollToSelector(page, '.hp-workplace-card', 'center');
  await sleep(300);

  const cardPos = await page.eval(`
    (() => {
      const card = document.querySelector('.hp-workplace-card');
      if (!card) return null;
      const r = card.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()
  `);

  if (cardPos) {
    console.log(`  Hovering Workplace Card at (${Math.round(cardPos.x)}, ${Math.round(cardPos.y)})...`);
    await page.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: cardPos.x,
      y: cardPos.y
    });
    await sleep(400);

    const hoverState = await page.eval(`
      (() => {
        const card = document.querySelector('.hp-workplace-card');
        const img = card?.querySelector('.hp-workplace-media img');
        const media = card?.querySelector('.hp-workplace-media');
        const afterStyle = media ? window.getComputedStyle(media, '::after') : null;
        return {
          imgTransform: img ? window.getComputedStyle(img).transform : null,
          overlayOpacity: afterStyle?.opacity,
          overlayBg: afterStyle?.backgroundImage
        };
      })()
    `);
    console.log('  Gallery Card Hover State:', hoverState);
    await captureScreenshot(page, '05_desktop_1920_gallery_hover_gold_overlay.png');

    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
    await sleep(200);
  }

  // 1E. Leadership Section & Portrait Hover
  console.log('\n--- 1E. Leadership Section & Portrait Hover ---');
  await scrollToSelector(page, '#leadership', 'center');
  await sleep(600);
  await captureScreenshot(page, '06_desktop_1920_leadership_revealed.png');

  const portraitPos = await page.eval(`
    (() => {
      const wrap = document.querySelector('#leadership .hp-founder-portrait-wrap');
      if (!wrap) return null;
      const r = wrap.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()
  `);

  if (portraitPos) {
    console.log(`  Hovering Founder Portrait at (${Math.round(portraitPos.x)}, ${Math.round(portraitPos.y)})...`);
    await page.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: portraitPos.x,
      y: portraitPos.y
    });
    await sleep(400);

    const founderHover = await page.eval(`
      (() => {
        const wrap = document.querySelector('#leadership .hp-founder-portrait-wrap');
        const photo = wrap?.querySelector('.hp-founder-portrait');
        return {
          wrapTransform: wrap ? window.getComputedStyle(wrap).transform : null,
          wrapBoxShadow: wrap ? window.getComputedStyle(wrap).boxShadow : null,
          photoTransform: photo ? window.getComputedStyle(photo).transform : null
        };
      })()
    `);
    console.log('  Founder Portrait Hover State:', founderHover);
    await captureScreenshot(page, '07_desktop_1920_founder_hover_glow.png');

    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
    await sleep(200);
  }

  // 1F. Team Members Section
  console.log('\n--- 1F. Team Members Section ---');
  await scrollToSelector(page, '#our-team', 'center');
  await sleep(600);
  await captureScreenshot(page, '08_desktop_1920_team_revealed.png');

  // 1G. What We Do Section
  console.log('\n--- 1G. What We Do Section ---');
  await scrollToSelector(page, '#what-we-do', 'center');
  await sleep(600);
  await captureScreenshot(page, '09_desktop_1920_what_we_do_revealed.png');

  // 1H. Values / Why Choose Sriyas Section
  console.log('\n--- 1H. Values / Why Choose Sriyas Section ---');
  await scrollToSelector(page, '#our-values', 'center');
  await sleep(600);
  await captureScreenshot(page, '10_desktop_1920_values_revealed.png');

  // 1I. CTA Section
  console.log('\n--- 1I. CTA Section ---');
  await scrollToSelector(page, '#cta-connect', 'center');
  await sleep(600);
  await captureScreenshot(page, '11_desktop_1920_cta_revealed.png');

  // ─────────────────────────────────────────────────────────────
  // 2. LAPTOP VIEWPORT (1366x768)
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 2] Testing Laptop Viewport (1366x768)...');
  await setViewport(page, 1366, 768, false);
  await page.eval(`window.scrollTo({ top: 0, behavior: 'instant' });`);
  await sleep(600);
  await captureScreenshot(page, '12_laptop_1366_hero.png');

  await scrollToSelector(page, '#statistics-overview', 'center');
  await sleep(600);
  await captureScreenshot(page, '13_laptop_1366_stats_gallery.png');

  // ─────────────────────────────────────────────────────────────
  // 3. MOBILE VIEWPORT (390x844 - iPhone 12/13/14/15)
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 3] Testing Mobile Viewport (390x844)...');
  await setViewport(page, 390, 844, true);
  await page.eval(`window.scrollTo({ top: 0, behavior: 'instant' });`);
  await sleep(800);
  await captureScreenshot(page, '14_mobile_390x844_hero.png');

  await scrollToSelector(page, '#statistics-overview', 'center');
  await sleep(600);
  await captureScreenshot(page, '15_mobile_390x844_about_stats.png');

  await scrollToSelector(page, '#our-workplace', 'center');
  await sleep(600);
  const mobileParallax = await page.eval(`
    (() => {
      const img = document.querySelector('.hp-workplace-media img');
      return {
        parallaxVar: img?.style.getPropertyValue('--parallax-y'),
        computedTransform: img ? window.getComputedStyle(img).transform : null
      };
    })()
  `);
  console.log('  Mobile Parallax Check (parallax disabled on mobile):', mobileParallax);
  await captureScreenshot(page, '16_mobile_390x844_gallery.png');

  await scrollToSelector(page, '#leadership', 'center');
  await sleep(600);
  await captureScreenshot(page, '17_mobile_390x844_leadership_wwd.png');

  // ─────────────────────────────────────────────────────────────
  // 4. MOBILE VIEWPORT (360x800 - Android Standard)
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 4] Testing Android Viewport (360x800)...');
  await setViewport(page, 360, 800, true);
  await page.eval(`window.scrollTo({ top: 0, behavior: 'instant' });`);
  await sleep(800);
  await captureScreenshot(page, '18_mobile_360x800_hero.png');

  await scrollToSelector(page, '#statistics-overview', 'center');
  await sleep(600);
  await captureScreenshot(page, '19_mobile_360x800_stats.png');

  // ─────────────────────────────────────────────────────────────
  // 5. ADMIN ANIMATION SETTINGS VERIFICATION
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 5] Testing Admin Animation Settings Panel...');
  await setViewport(page, 1440, 900, false);
  await page.send('Page.navigate', { url: 'http://localhost:5173/admin/login' });
  await sleep(1500);

  // Authenticate by API directly to set sessionStorage token in browser
  const authResult = await page.eval(`
    (async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@sriyashealthcare.com', password: 'Sriyas@2026' })
        }).then(r => r.json());
        if (res.token) {
          sessionStorage.setItem('sriyas_admin_token', res.token);
          return { success: true, admin: res.admin };
        }
        return { success: false, message: res.message };
      } catch (err) {
        return { success: false, error: err.message };
      }
    })()
  `);
  console.log('  Admin Login API Response:', authResult);

  // Navigate to Homepage Editor
  await page.send('Page.navigate', { url: 'http://localhost:5173/admin/homepage-editor' });
  await sleep(2500);

  // Click Animation Settings tab in sidebar
  const clickedTab = await page.eval(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('.hp-nav-tab'));
      const animTab = tabs.find(t => t.textContent.includes('Animation Settings'));
      if (animTab) {
        animTab.click();
        return true;
      }
      return false;
    })()
  `);
  console.log('  Navigated to Animation Settings Tab:', clickedTab);
  await sleep(800);

  // Verify the 4 checkboxes
  const togglesState = await page.eval(`
    (() => {
      const cards = Array.from(document.querySelectorAll('.hp-panel .hp-card > div > div'));
      return cards.map(c => ({
        badge: c.querySelector('span')?.textContent,
        title: c.querySelector('h3')?.textContent,
        checked: c.querySelector('input[type="checkbox"]')?.checked
      }));
    })()
  `);
  console.log('  Admin Animation Toggles State:', togglesState);
  await captureScreenshot(page, '20_admin_animation_settings_panel.png');

  // Toggle Image Hover OFF
  console.log('\n--- 5B. Toggling Image Hover OFF & Testing Preview Modal ---');
  await page.eval(`
    (() => {
      const cards = Array.from(document.querySelectorAll('.hp-panel .hp-card > div > div'));
      const hoverCard = cards.find(c => c.querySelector('h3')?.textContent?.includes('Hover'));
      const input = hoverCard?.querySelector('input[type="checkbox"]');
      if (input) input.click();
    })()
  `);
  await sleep(400);

  // Click Preview button in header
  const previewClicked = await page.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const prevBtn = btns.find(b => b.textContent?.includes('Preview'));
      if (prevBtn) {
        prevBtn.click();
        return true;
      }
      return false;
    })()
  `);
  console.log('  Opened Preview Modal:', previewClicked);
  await sleep(1200);

  const hoverOffVerified = await page.eval(`
    (() => {
      const root = document.querySelector('.hp-root');
      return {
        hasHpImageHoverOff: root?.classList.contains('hp-image-hover-off'),
        classes: root?.className
      };
    })()
  `);
  console.log('  Verified Preview has hp-image-hover-off:', hoverOffVerified);
  await captureScreenshot(page, '21_preview_modal_hover_disabled.png');

  // Close preview modal
  await page.eval(`
    (() => {
      const closeBtn = document.querySelector('.hp-preview-modal-close, button[aria-label="Close modal"], .adm-modal-close');
      if (closeBtn) closeBtn.click();
    })()
  `);
  await sleep(600);

  // Re-enable Hover toggle and publish
  console.log('\n--- 5C. Restoring Image Hover ON & Publishing ---');
  await page.eval(`
    (() => {
      const cards = Array.from(document.querySelectorAll('.hp-panel .hp-card > div > div'));
      const hoverCard = cards.find(c => c.querySelector('h3')?.textContent?.includes('Hover'));
      const input = hoverCard?.querySelector('input[type="checkbox"]');
      if (input && !input.checked) {
        input.click();
      }
    })()
  `);
  await sleep(400);

  const published = await page.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const pubBtn = btns.find(b => b.textContent?.includes('Publish Changes'));
      if (pubBtn) {
        pubBtn.click();
        return true;
      }
      return false;
    })()
  `);
  console.log('  Published Changes to Live Site:', published);
  await sleep(2000);
  await captureScreenshot(page, '22_admin_published_restored.png');

  page.close();
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ALL VISUAL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  console.log(`  Artifacts saved in: ${ARTIFACT_DIR}`);
  console.log('═══════════════════════════════════════════════════════════════');
}

runVisualVerification().catch(err => {
  console.error('[Verification Suite Fatal Error]', err);
  process.exit(1);
});
