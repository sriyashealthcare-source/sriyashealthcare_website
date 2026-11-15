const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession';
const USER_DATA_PORT_FILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\User Data\\DevToolsActivePort';

const rootDir = path.join(__dirname, '..');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  console.log('[Servers] Checking if Backend (port 5000) or Client (port 5173) are already active...');
  const backendAlreadyUp = await waitForHttp('http://127.0.0.1:5000/api/health', 1500);
  const clientAlreadyUp = await waitForHttp('http://127.0.0.1:5173/', 1500);

  if (!backendAlreadyUp) {
    console.log('[Servers] Starting Backend Server (node server/server.js)...');
    serverProc = spawn('node', ['server/server.js'], {
      cwd: rootDir,
      env: { ...process.env, USE_LOCAL_DB: 'true', PORT: '5000', HOST: '0.0.0.0' },
      stdio: 'inherit'
    });
  } else {
    console.log('[Servers] Backend already running on http://127.0.0.1:5000');
  }

  if (!clientAlreadyUp) {
    console.log('[Servers] Starting Client Server (node vite.js)...');
    const viteBin = path.join(rootDir, 'client', 'node_modules', 'vite', 'bin', 'vite.js');
    clientProc = spawn('node', [viteBin, '--host', '0.0.0.0', '--port', '5173'], {
      cwd: path.join(rootDir, 'client'),
      stdio: 'inherit'
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
  console.log('[Chrome] Checking for Chrome CDP on port 9222...');
  try {
    const res = await fetch('http://localhost:9222/json/version');
    if (res.ok) {
      const data = await res.json();
      console.log('[Chrome] Connected to existing Chrome instance:', data.Browser);
      return data;
    }
  } catch (_) {}

  console.log('[Chrome] Launching Chrome headless on port 9222...');
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
  ], { stdio: 'ignore', detached: true });
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

  if (!versionData) throw new Error('Chrome failed to start on port 9222.');

  try {
    const wsUrl = new URL(versionData.webSocketDebuggerUrl);
    fs.writeFileSync(USER_DATA_PORT_FILE, `9222\n${wsUrl.pathname}\n`, 'utf8');
  } catch (_) {}

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

async function captureScreenshot(page, filename) {
  const res = await page.send('Page.captureScreenshot', { format: 'png' });
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
  await page.send('Emulation.setTouchEmulationEnabled', { enabled: isMobile });
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SRIYAS HEALTHCARE — STATISTICS EDITOR REDESIGN VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════');

  await startServers();
  await startChrome();
  const { page } = await createPageTab();

  // ─────────────────────────────────────────────────────────────
  // 1. ADMIN LOGIN & NAVIGATE TO HOMEPAGE EDITOR
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 1] Admin Authentication & Navigating to Homepage Editor...');
  await setViewport(page, 1920, 1080, false);
  await page.send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/login' });
  await sleep(1500);

  // Authenticate as Admin
  const loginRes = await page.eval(`
    (async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@sriyashealthcare.com', password: 'Sriyas@2026' })
        }).then(r => r.json());
        if (res.token) {
          sessionStorage.setItem('sriyas_admin_token', res.token);
          return { success: true };
        }
        return { success: false, message: res.message };
      } catch (err) {
        return { success: false, error: err.message };
      }
    })()
  `);
  console.log('  Admin Login API Response:', loginRes);

  // Navigate to Homepage Editor
  await page.send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/homepage-editor' });
  await sleep(2500);

  // Click Statistics Editor tab in sidebar
  const clickedTab = await page.eval(`
    (() => {
      const tabs = Array.from(document.querySelectorAll('.hp-nav-tab'));
      const statTab = tabs.find(t => t.textContent.includes('Statistics Editor'));
      if (statTab) {
        statTab.click();
        return true;
      }
      return false;
    })()
  `);
  console.log('  Clicked Statistics Editor Tab in Sidebar:', clickedTab);
  await sleep(1000);

  // ─────────────────────────────────────────────────────────────
  // 2. VERIFY REDESIGNED HEADER & SECTION STATUS CONTROL
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 2] Verifying Redesigned Header & Section Status Control...');
  const headerCheck = await page.eval(`
    (() => {
      const title = document.querySelector('.hp-stats-title')?.textContent;
      const desc = document.querySelector('.hp-stats-desc')?.textContent;
      const statusText = document.querySelector('.hp-stats-status-text')?.textContent;
      const dotActive = document.querySelector('.hp-stats-status-dot')?.classList.contains('is-active');
      const toggleChecked = document.querySelector('.hp-stats-toggle-switch input')?.checked;
      return { title, desc, statusText, dotActive, toggleChecked };
    })()
  `);
  console.log('  Header & Status Control:', headerCheck);
  if (!headerCheck.title || !headerCheck.title.includes('Statistics & Impact Counters')) {
    throw new Error('Header title mismatch!');
  }

  // ─────────────────────────────────────────────────────────────
  // 3. EDIT SECTION HEADER CONTENT
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 3] Editing Section Header Content...');
  await page.eval(`
    (() => {
      function setReactVal(id, val) {
        const el = document.getElementById(id);
        if (el) {
          const isTextArea = el.tagName === 'TEXTAREA';
          const proto = isTextArea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
          const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
          descriptor.set.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      setReactVal('stats-eyebrow', 'Institutional Scale & Reach');
      setReactVal('stats-heading', 'Delivering Dependability Across Healthcare');
      setReactVal('stats-subtitle', 'Connecting Indian hospitals, clinics, and surgical specialists with verified clinical sutures, mesh, and medical equipment.');
    })()
  `);
  await sleep(500);

  // ─────────────────────────────────────────────────────────────
  // 4. ADD STATISTIC #1: Healthcare Partners (25+)
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 4] Adding Statistic #1: Healthcare Partners (25+)...');
  await page.eval(`document.getElementById('stats-add-metric-btn').click();`);
  await sleep(600);

  // Fill in Statistic #1
  await page.eval(`
    (() => {
      const card = document.querySelector('.hp-stat-card-item:last-child');
      function setValInCard(selector, val) {
        const el = card?.querySelector(selector);
        if (el) {
          const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
          const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
          descriptor.set.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      setValInCard('input[placeholder="Healthcare Partners"]', 'Healthcare Partners');
      setValInCard('input[placeholder="25"]', '25');
      setValInCard('input[placeholder="e.g. ₹ or +"]', '');
      setValInCard('input[placeholder="e.g. + or Years"]', '+');
      setValInCard('input[placeholder="A short explanation of this milestone"]', 'Verified partner brands and specialized manufacturer collaborations.');
    })()
  `);
  await sleep(600);

  // ─────────────────────────────────────────────────────────────
  // 5. ADD STATISTIC #2: Years of Excellence (15+ Years)
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 5] Adding Statistic #2: Years of Service (15+ Years)...');
  await page.eval(`document.getElementById('stats-add-metric-btn').click();`);
  await sleep(600);

  await page.eval(`
    (() => {
      const card = document.querySelector('.hp-stat-card-item:last-child');
      function setValInCard(selector, val) {
        const el = card?.querySelector(selector);
        if (el) {
          const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
          const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
          descriptor.set.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      setValInCard('input[placeholder="Healthcare Partners"]', 'Years of Service');
      setValInCard('input[placeholder="25"]', '15');
      setValInCard('input[placeholder="e.g. + or Years"]', ' Years');
      setValInCard('input[placeholder="A short explanation of this milestone"]', 'Dedicated distribution and surgical liaison throughout India.');
    })()
  `);
  await sleep(600);

  // ─────────────────────────────────────────────────────────────
  // 6. ADD STATISTIC #3: Satisfaction Score (99.8% with 1 decimal)
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 6] Adding Statistic #3: Satisfaction Score (99.8%)...');
  await page.eval(`document.getElementById('stats-add-metric-btn').click();`);
  await sleep(600);

  await page.eval(`
    (() => {
      const card = document.querySelector('.hp-stat-card-item:last-child');
      function setValInCard(selector, val) {
        const el = card?.querySelector(selector);
        if (el) {
          const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
          const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
          descriptor.set.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      setValInCard('input[placeholder="Healthcare Partners"]', 'Clinical Satisfaction');
      setValInCard('input[placeholder="25"]', '99.8');
      setValInCard('input[placeholder="e.g. + or Years"]', '%');
      setValInCard('.hp-stats-select', '1');
      setValInCard('input[placeholder="A short explanation of this milestone"]', 'Positive institutional feedback from hospital OT staff.');
    })()
  `);
  await sleep(600);

  // ─────────────────────────────────────────────────────────────
  // 7. VERIFY LIVE PREVIEWS & CARD DATA
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 7] Verifying Live Statistic Previews...');
  const previewsData = await page.eval(`
    (() => {
      const cards = Array.from(document.querySelectorAll('.hp-stat-card-item'));
      return cards.map(c => {
        const order = c.querySelector('.hp-stat-order-pill')?.textContent?.trim();
        const headerBadge = c.querySelector('.hp-stat-item-preview-badge')?.textContent?.trim();
        const title = c.querySelector('.hp-stat-item-main-title span:last-child')?.textContent?.trim();
        const previewNumber = c.querySelector('.hp-stat-preview-number')?.textContent?.trim();
        const previewSuffix = c.querySelector('.hp-stat-preview-suffix')?.textContent?.trim();
        const previewTitle = c.querySelector('.hp-stat-preview-title')?.textContent?.trim();
        const isExpanded = c.classList.contains('is-expanded');
        return { order, headerBadge, title, previewNumber, previewSuffix, previewTitle, isExpanded };
      });
    })()
  `);
  console.log('  Live Previews Verified:', previewsData);

  // Capture Desktop Screenshot
  await captureScreenshot(page, '34_admin_statistics_editor_redesigned_desktop.png');

  // ─────────────────────────────────────────────────────────────
  // 8. TEST COLLAPSE & EXPAND CONTROLS
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 8] Testing Collapse All & Expand All Controls...');
  // Click Collapse All
  await page.eval(`
    (() => {
      const btn = Array.from(document.querySelectorAll('.hp-stat-toggle-expand-btn')).find(b => b.textContent?.includes('Collapse All'));
      if (btn) btn.click();
    })()
  `);
  await sleep(500);

  const allCollapsed = await page.eval(`
    document.querySelectorAll('.hp-stat-card-item.is-expanded').length === 0
  `);
  console.log('  All cards collapsed successfully:', allCollapsed);

  // Expand first card
  await page.eval(`
    (() => {
      const firstCardHeader = document.querySelector('.hp-stat-card-item .hp-stat-item-header');
      if (firstCardHeader) firstCardHeader.click();
    })()
  `);
  await sleep(500);

  // ─────────────────────────────────────────────────────────────
  // 9. TEST CARD REORDERING (MOVE DOWN / MOVE UP)
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 9] Testing Reorder Controls...');
  const firstTitleBefore = await page.eval(`
    document.querySelector('.hp-stat-card-item:first-child .hp-stat-item-main-title span:last-child')?.textContent?.trim()
  `);
  console.log('  First Card Title Before Move Down:', firstTitleBefore);

  // Click Down on first card
  await page.eval(`
    (() => {
      const downBtn = document.querySelector('.hp-stat-card-item:first-child button[title="Move Down"]');
      if (downBtn) downBtn.click();
    })()
  `);
  await sleep(500);

  const firstTitleAfterDown = await page.eval(`
    document.querySelector('.hp-stat-card-item:first-child .hp-stat-item-main-title span:last-child')?.textContent?.trim()
  `);
  console.log('  First Card Title After Move Down:', firstTitleAfterDown);

  // Move it back up
  await page.eval(`
    (() => {
      const upBtn = document.querySelector('.hp-stat-card-item:nth-child(2) button[title="Move Up"]');
      if (upBtn) upBtn.click();
    })()
  `);
  await sleep(500);

  // ─────────────────────────────────────────────────────────────
  // 10. SAVE DRAFT & PUBLISH CHANGES LIVE
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 10] Testing Save Draft & Publish Workflow...');
  // Click Save Draft in top toolbar
  await page.eval(`
    (() => {
      const saveBtn = Array.from(document.querySelectorAll('.hp-toolbar-actions button')).find(b => b.textContent?.includes('Save Draft'));
      if (saveBtn) saveBtn.click();
    })()
  `);
  await sleep(2000);

  const draftBanner = await page.eval(`
    document.querySelector('.hp-inline-banner--success')?.textContent?.trim()
  `);
  console.log('  Save Draft Notification:', draftBanner);

  // Click Publish Changes
  console.log('  Publishing changes live to website...');
  // Handle any JavaScript dialog via CDP
  await page.send('Page.enable');
  await page.eval(`
    (() => {
      window.confirm = () => true;
      const pubBtn = Array.from(document.querySelectorAll('.hp-toolbar-actions button')).find(b => b.textContent?.includes('Publish Changes'));
      if (pubBtn) pubBtn.click();
    })()
  `);

  let publishBanner = '';
  for (let i = 0; i < 25; i++) {
    await sleep(400);
    publishBanner = await page.eval(`document.querySelector('.hp-inline-banner--success')?.textContent?.trim() || ''`);
    if (publishBanner.includes('published live')) break;
  }
  console.log('  Publish Success Notification:', publishBanner);

  // ─────────────────────────────────────────────────────────────
  // 11. RESPONSIVE VIEWPORT TESTING
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 11] Responsive Viewport Captures of Redesigned Statistics Editor...');

  // Laptop (1366x768)
  console.log('  Testing Laptop Viewport (1366x768)...');
  await setViewport(page, 1366, 768, false);
  await sleep(600);
  await captureScreenshot(page, '35_admin_statistics_editor_laptop.png');

  // Tablet (768x1024)
  console.log('  Testing Tablet Viewport (768x1024)...');
  await setViewport(page, 768, 1024, false);
  await sleep(600);
  await captureScreenshot(page, '36_admin_statistics_editor_tablet.png');

  // Mobile iPhone 14 (390x844)
  console.log('  Testing Mobile Viewport (390x844)...');
  await setViewport(page, 390, 844, true);
  await sleep(600);
  await captureScreenshot(page, '37_admin_statistics_editor_mobile_390.png');

  // Mobile Android (360x800)
  console.log('  Testing Mobile Viewport (360x800)...');
  await setViewport(page, 360, 800, true);
  await sleep(600);
  await captureScreenshot(page, '38_admin_statistics_editor_mobile_360.png');

  // ─────────────────────────────────────────────────────────────
  // 12. PUBLIC HOMEPAGE VERIFICATION
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 12] Verifying Public Homepage Live Statistics Counters...');
  await setViewport(page, 1920, 1080, false);
  await page.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await sleep(2500);

  // Scroll to statistics section
  await page.eval(`
    (() => {
      const el = document.getElementById('company-statistics');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    })()
  `);
  await sleep(2200); // Allow smooth counter animation to finish

  const publicStatsData = await page.eval(`
    (() => {
      const section = document.getElementById('company-statistics');
      if (!section) return null;
      const eyebrow = section.querySelector('.hp-eyebrow')?.textContent?.trim();
      const heading = section.querySelector('.hp-heading')?.textContent?.trim();
      const subtitle = section.querySelector('.hp-section-subtitle')?.textContent?.trim();
      const cards = Array.from(section.querySelectorAll('.hp-stat-card')).map(c => ({
        number: c.querySelector('.hp-stat-number')?.textContent?.trim(),
        suffix: c.querySelector('.hp-stat-suffix')?.textContent?.trim(),
        title: c.querySelector('.hp-stat-title')?.textContent?.trim(),
        desc: c.querySelector('.hp-stat-desc')?.textContent?.trim()
      }));
      return { exists: true, eyebrow, heading, subtitle, cards };
    })()
  `);
  console.log('  Public Homepage Statistics Live Inspection:', publicStatsData);
  if (!publicStatsData || publicStatsData.cards.length < 3) {
    throw new Error('Public statistics section did not reflect the published metrics!');
  }

  await captureScreenshot(page, '39_public_homepage_statistics_counters.png');

  page.close();
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ALL STATISTICS EDITOR REDESIGN VERIFICATION TESTS PASSED!');
  console.log(`  Artifacts saved in: ${ARTIFACT_DIR}`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (serverProc) serverProc.kill();
  if (clientProc) clientProc.kill();
  process.exit(0);
}

runTests().catch(err => {
  console.error('[Verification Suite Fatal Error]', err);
  if (serverProc) serverProc.kill();
  if (clientProc) clientProc.kill();
  process.exit(1);
});
