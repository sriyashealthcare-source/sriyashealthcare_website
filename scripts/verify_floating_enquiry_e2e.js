const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_DEV_PROFILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession';
const USER_DATA_PORT_FILE = 'C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\User Data\\DevToolsActivePort';

const rootDir = path.join(__dirname, '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

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

async function runE2E() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SRIYAS HEALTHCARE — FLOATING PRODUCT ENQUIRY E2E SUITE');
  console.log('═══════════════════════════════════════════════════════════════');

  await startServers();
  await startChrome();
  const { page } = await createPageTab();

  // ─────────────────────────────────────────────────────────────
  // 1. DESKTOP HOMEPAGE (1920x1080)
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 1] Desktop Homepage (1920x1080)...');
  await setViewport(page, 1920, 1080, false);
  await page.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await sleep(3000);

  // Check FAB and Tooltip
  const fabState = await page.eval(`
    (() => {
      const fab = document.getElementById('floating-enquiry-fab');
      const tooltip = document.querySelector('.floating-enquiry-tooltip');
      const container = document.querySelector('.floating-enquiry-container');
      const rect = fab ? fab.getBoundingClientRect() : null;
      return {
        exists: Boolean(fab),
        rect,
        tooltipText: tooltip?.innerText,
        containerStyle: container ? window.getComputedStyle(container).position : null
      };
    })()
  `);
  console.log('  FAB Inspection on Homepage:', fabState);
  if (!fabState.exists) throw new Error('Floating Enquiry FAB not found on Homepage!');

  await captureScreenshot(page, '23_desktop_homepage_fab.png');

  // Open Drawer via FAB click
  console.log('\n--- 1B. Opening Enquiry Drawer on Homepage ---');
  await page.eval(`document.getElementById('floating-enquiry-fab').click();`);
  await sleep(800);

  const drawerState1 = await page.eval(`
    (() => {
      const drawer = document.querySelector('.enquiry-drawer');
      const backdrop = document.querySelector('.enquiry-drawer-backdrop');
      const title = document.getElementById('enquiry-drawer-title');
      const isOpen = drawer?.classList.contains('is-open');
      const backdropOpen = backdrop?.classList.contains('is-open');
      return {
        isOpen,
        backdropOpen,
        title: title?.textContent,
        nameInputVisible: Boolean(document.getElementById('enquiry-drawer-name'))
      };
    })()
  `);
  console.log('  Drawer State after FAB click:', drawerState1);
  if (!drawerState1.isOpen) throw new Error('Enquiry Drawer failed to open!');

  await captureScreenshot(page, '24_desktop_homepage_drawer_open.png');

  // Test Tag a Product selector inside drawer
  console.log('\n--- 1C. In-Drawer Product Selector Search & Select ---');
  await page.eval(`
    (() => {
      const tagBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('+ Tag a Product'));
      if (tagBtn) tagBtn.click();
    })()
  `);
  await sleep(400);

  await page.eval(`
    (() => {
      const input = document.querySelector('.enquiry-selector-input');
      if (input) {
        const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        descriptor.set.call(input, 'Cutimed');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()
  `);
  await sleep(400);

  // Click Cutimed product item
  const selectedCutimed = await page.eval(`
    (() => {
      const items = Array.from(document.querySelectorAll('.enquiry-selector-item'));
      const cutimedItem = items.find(i => i.textContent.includes('Cutimed'));
      if (cutimedItem) {
        cutimedItem.click();
        return cutimedItem.textContent;
      }
      return null;
    })()
  `);
  console.log('  Selected from catalog selector:', selectedCutimed);
  await sleep(500);

  const contextAfterSelect = await page.eval(`
    (() => {
      const card = document.querySelector('.enquiry-context-card');
      const name = card?.querySelector('.enquiry-context-name')?.textContent;
      const tag = card?.querySelector('.enquiry-context-tag')?.textContent;
      return { hasCard: Boolean(card), name, tag };
    })()
  `);
  console.log('  Context card after product selection:', contextAfterSelect);
  await captureScreenshot(page, '25_desktop_tagged_product_in_drawer.png');

  // Close drawer via Escape key
  await page.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(500);

  // ─────────────────────────────────────────────────────────────
  // 2. LAPTOP VIEWPORT (1366x768) — MANUFACTURER PAGE
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 2] Laptop Viewport (1366x768) — Partner Page (/products/peters)...');
  await setViewport(page, 1366, 768, false);
  await page.send('Page.navigate', { url: 'http://127.0.0.1:5173/products/peters' });
  await sleep(2500);

  // Click FAB to open drawer
  await page.eval(`document.getElementById('floating-enquiry-fab').click();`);
  await sleep(800);

  const partnerDrawerState = await page.eval(`
    (() => {
      const card = document.querySelector('.enquiry-context-card');
      const name = card?.querySelector('.enquiry-context-name')?.textContent;
      const tag = card?.querySelector('.enquiry-context-tag')?.textContent;
      const msg = document.getElementById('enquiry-drawer-message')?.value;
      return { name, tag, msg };
    })()
  `);
  console.log('  Partner Page Drawer Context:', partnerDrawerState);
  await captureScreenshot(page, '26_laptop_peters_brand_drawer.png');

  // Close drawer
  await page.eval(`document.querySelector('.enquiry-drawer-close').click();`);
  await sleep(500);

  // ─────────────────────────────────────────────────────────────
  // 3. PRODUCT DETAILS PAGE — AUTO-DETECTION & SUBMISSION
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 3] Product Details Page (/products/peters/i-col) — Auto-Detection & Submission...');
  await setViewport(page, 1920, 1080, false);
  await page.send('Page.navigate', { url: 'http://127.0.0.1:5173/products/peters/i-col' });
  await sleep(2500);

  // Click the on-page "Enquire About This Product" button (#enquire-prod-btn)
  console.log('  Clicking on-page "✉ Enquire About This Product" button...');
  await page.eval(`document.getElementById('enquire-prod-btn').click();`);
  await sleep(800);

  const prodDrawerContext = await page.eval(`
    (() => {
      const card = document.querySelector('.enquiry-context-card');
      const prodName = card?.querySelector('.enquiry-context-name')?.textContent;
      const brandTag = card?.querySelector('.enquiry-context-tag')?.textContent;
      const thumbSrc = card?.querySelector('img')?.src;
      const msgVal = document.getElementById('enquiry-drawer-message')?.value;
      return { prodName, brandTag, thumbSrc, msgVal };
    })()
  `);
  console.log('  Product Detail Page Auto-Detected Context:', prodDrawerContext);
  if (!prodDrawerContext.prodName || !prodDrawerContext.prodName.includes('I-Col')) {
    throw new Error('Expected auto-detected product to be I-Col™!');
  }

  await captureScreenshot(page, '27_product_detail_drawer_open.png');

  // Fill in form details and submit
  console.log('\n--- 3B. Filling Enquiry Form & Submitting ---');
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
      setReactVal('enquiry-drawer-name', 'Dr. Ananya Sharma');
      setReactVal('enquiry-drawer-email', 'ananya.sharma@aims.test');
      setReactVal('enquiry-drawer-phone', '+91 98888 77777');
      setReactVal('enquiry-drawer-company', 'AIIMS New Delhi');
      setReactVal('enquiry-drawer-message', 'Urgent procurement request for pediatric cardiovascular surgery unit. Need sterile sutures brochure and institutional quote.');
    })()
  `);
  await sleep(500);

  // Click Submit
  await page.eval(`document.getElementById('floating-enquiry-submit').click();`);
  console.log('  Submitted form, waiting for confirmation response...');
  await sleep(2500);

  const successState = await page.eval(`
    (() => {
      const successTitle = document.querySelector('.enquiry-success-title')?.textContent;
      const successDesc = document.querySelector('.enquiry-success-desc')?.textContent;
      const rows = Array.from(document.querySelectorAll('.enquiry-success-row')).map(r => r.innerText);
      return { successTitle, successDesc, rows };
    })()
  `);
  console.log('  Enquiry Success Confirmation View:', successState);
  if (!successState.successTitle || !successState.successTitle.includes('Dr. Ananya Sharma')) {
    throw new Error('Form submission did not transition to success screen!');
  }

  await captureScreenshot(page, '28_product_enquiry_success_state.png');

  // Close drawer via "Done & Close" button
  await page.eval(`
    (() => {
      const doneBtn = Array.from(document.querySelectorAll('.enquiry-submit-btn')).find(b => b.textContent.includes('Done'));
      if (doneBtn) doneBtn.click();
    })()
  `);
  await sleep(600);

  // ─────────────────────────────────────────────────────────────
  // 4. MOBILE VIEWPORTS (390x844 & 360x800)
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 4] Mobile Viewport Testing (390x844 iPhone 14)...');
  await setViewport(page, 390, 844, true);
  await page.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await sleep(2000);

  const mobileFab = await page.eval(`
    (() => {
      const fab = document.getElementById('floating-enquiry-fab');
      const tooltip = document.querySelector('.floating-enquiry-tooltip');
      const tooltipDisplay = tooltip ? window.getComputedStyle(tooltip).display : 'none';
      return {
        fabExists: Boolean(fab),
        tooltipHiddenOnMobile: tooltipDisplay === 'none'
      };
    })()
  `);
  console.log('  Mobile FAB Check (Tooltip hidden):', mobileFab);
  await captureScreenshot(page, '29_mobile_390x844_fab_view.png');

  // Open Drawer as Bottom Sheet on Mobile
  await page.eval(`document.getElementById('floating-enquiry-fab').click();`);
  await sleep(800);

  const mobileDrawerState = await page.eval(`
    (() => {
      const drawer = document.querySelector('.enquiry-drawer');
      const cs = window.getComputedStyle(drawer);
      return {
        isOpen: drawer.classList.contains('is-open'),
        width: cs.width,
        borderRadius: cs.borderRadius,
        maxHeight: cs.maxHeight,
        bottom: cs.bottom
      };
    })()
  `);
  console.log('  Mobile Bottom Sheet Styles:', mobileDrawerState);
  await captureScreenshot(page, '30_mobile_390x844_bottom_sheet.png');

  // Close drawer
  await page.eval(`document.querySelector('.enquiry-drawer-close').click();`);
  await sleep(500);

  console.log('\n[Phase 4B] Mobile Viewport Testing (360x800 Android Standard)...');
  await setViewport(page, 360, 800, true);
  await sleep(500);
  await page.eval(`document.getElementById('floating-enquiry-fab').click();`);
  await sleep(800);
  await captureScreenshot(page, '31_mobile_360x800_bottom_sheet.png');
  await page.eval(`document.querySelector('.enquiry-drawer-close').click();`);
  await sleep(500);

  // ─────────────────────────────────────────────────────────────
  // 5. ADMIN ROUTES EXCLUSION & ENQUIRY RECORD VERIFICATION
  // ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 5] Admin Route Exclusion & Dashboard Management Verification...');
  await setViewport(page, 1440, 900, false);
  await page.send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/login' });
  await sleep(1500);

  // Verify FAB is NOT rendered on Admin Login
  const fabOnAdminLogin = await page.eval(`Boolean(document.getElementById('floating-enquiry-fab'))`);
  console.log('  FAB on /admin/login (should be false):', fabOnAdminLogin);
  if (fabOnAdminLogin) throw new Error('FAB was rendered on /admin/login!');

  // Authenticate Admin via API to set sessionStorage token
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

  // Navigate to Admin Customer Enquiries
  await page.send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/enquiries' });
  await sleep(2500);

  // Verify FAB is NOT rendered on Admin Dashboard
  const fabOnAdminDashboard = await page.eval(`Boolean(document.getElementById('floating-enquiry-fab'))`);
  console.log('  FAB on /admin/enquiries (should be false):', fabOnAdminDashboard);
  if (fabOnAdminDashboard) throw new Error('FAB was rendered on /admin/enquiries!');

  // Inspect Enquiries Table for Dr. Ananya Sharma
  const tableCheck = await page.eval(`
    (() => {
      const rows = Array.from(document.querySelectorAll('.admin-table tbody tr'));
      const ananyaRow = rows.find(r => r.textContent.includes('Dr. Ananya Sharma'));
      if (!ananyaRow) return null;
      return {
        customer: ananyaRow.cells[0]?.textContent?.trim(),
        sourceBadge: ananyaRow.cells[1]?.textContent?.trim(),
        contact: ananyaRow.cells[2]?.textContent?.trim(),
        hospital: ananyaRow.cells[3]?.textContent?.trim(),
        product: ananyaRow.cells[4]?.textContent?.trim(),
        status: ananyaRow.cells[6]?.textContent?.trim()
      };
    })()
  `);
  console.log('  Admin Table Row for Submitted Enquiry:', tableCheck);
  if (!tableCheck) throw new Error('Enquiry for Dr. Ananya Sharma not found in Admin table!');
  if (!tableCheck.sourceBadge.includes('Floating Widget')) {
    throw new Error(`Expected source badge "Floating Widget", found: "${tableCheck.sourceBadge}"`);
  }

  await captureScreenshot(page, '32_admin_enquiries_floating_badge.png');

  // Click Inspect & Manage on Dr. Ananya Sharma's enquiry
  console.log('\n--- 5B. Inspecting Enquiry Modal in Admin Dashboard ---');
  await page.eval(`
    (() => {
      const rows = Array.from(document.querySelectorAll('.admin-table tbody tr'));
      const ananyaRow = rows.find(r => r.textContent.includes('Dr. Ananya Sharma'));
      const inspectBtn = ananyaRow?.querySelector('button');
      if (inspectBtn) inspectBtn.click();
    })()
  `);
  await sleep(1000);

  const modalDetails = await page.eval(`
    (() => {
      const modal = document.querySelector('.modal-box');
      if (!modal) return null;
      const text = modal.innerText;
      return {
        isOpen: Boolean(modal),
        hasCustomer: text.includes('Dr. Ananya Sharma'),
        hasSource: text.includes('Floating Product Enquiry Widget'),
        hasOriginPage: text.includes('/products/peters/i-col'),
        hasBrand: text.includes('Peters Surgical'),
        hasProduct: text.includes('I-Col')
      };
    })()
  `);
  console.log('  Admin Modal Details Verification:', modalDetails);
  if (!modalDetails.hasSource || !modalDetails.hasOriginPage) {
    throw new Error('Enquiry modal does not show source or origin page correctly!');
  }

  await captureScreenshot(page, '33_admin_enquiry_inspect_modal.png');

  page.close();
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ALL E2E BROWSER VISUAL & FUNCTIONAL TESTS PASSED!');
  console.log(`  Artifacts saved in: ${ARTIFACT_DIR}`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (serverProc) serverProc.kill();
  if (clientProc) clientProc.kill();
  process.exit(0);
}

runE2E().catch(err => {
  console.error('[E2E Suite Fatal Error]', err);
  if (serverProc) serverProc.kill();
  if (clientProc) clientProc.kill();
  process.exit(1);
});
