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
  console.log('[Chrome] Checking CDP on port 9222...');
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
    '--window-size=1440,900',
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

async function getCdpSession() {
  const versionRes = await fetch('http://127.0.0.1:9222/json/version');
  const versionData = await versionRes.json();
  const wsUrl = versionData.webSocketDebuggerUrl;

  const WebSocket = globalThis.WebSocket || global.WebSocket;
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const target = await send('Target.createTarget', { url: 'about:blank' });
  const pageWs = new WebSocket(`ws://127.0.0.1:9222/devtools/page/${target.targetId}`);

  await new Promise((resolve, reject) => {
    pageWs.onopen = resolve;
    pageWs.onerror = reject;
  });

  const pagePending = new Map();
  pageWs.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pagePending.has(msg.id)) {
      const { resolve, reject } = pagePending.get(msg.id);
      pagePending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };

  function pageSend(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pagePending.set(id, { resolve, reject });
      pageWs.send(JSON.stringify({ id, method, params }));
    });
  }

  await pageSend('Page.enable');
  await pageSend('DOM.enable');

  return {
    send: pageSend,
    async eval(expr) {
      const res = await pageSend('Runtime.evaluate', { expression: expr, returnByValue: true });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result.value;
    },
    async screenshot(filePath) {
      const res = await pageSend('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    },
    async setViewport(width, height) {
      await pageSend('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false
      });
    },
    async navigate(url) {
      await pageSend('Page.navigate', { url });
      await sleep(2000);
    },
    async close() {
      try {
        await send('Target.closeTarget', { targetId: target.targetId });
        ws.close();
      } catch (_) { }
    }
  };
}

async function run() {
  await startServers();
  await startChrome();

  const cdp = await getCdpSession();
  await cdp.setViewport(1440, 900);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('TESTING CASE A — 3-TIER SUB-BRANDED PROGRESSIVE DRILL-DOWN');
  console.log('Brand: Futura Medtech -> Category: Dolphin Sutures -> 7 Subcategories');
  console.log('═══════════════════════════════════════════════════════════════');

  // STEP 1: Brand View (/products/futura-medtech)
  console.log('\n--- Step 1: Brand View (/products/futura-medtech) ---');
  await cdp.navigate(`${TARGET_URL}/products/futura-medtech`);
  await sleep(1500);

  const step1State = await cdp.eval(`(() => {
    const bannerTitle = document.querySelector('.partner-hero-title')?.innerText || '';
    const categoryCards = Array.from(document.querySelectorAll('.drilldown-category-card')).map(el => ({
      title: el.querySelector('.drilldown-category-title')?.innerText || '',
      desc: el.querySelector('.drilldown-category-desc')?.innerText || '',
      badge: el.querySelector('.drilldown-count-badge')?.innerText || '',
      hasLogo: Boolean(el.querySelector('.drilldown-cat-logo')),
      link: el.getAttribute('href')
    }));
    const productCardsCount = document.querySelectorAll('.prod-card').length;
    const subcatCardsCount = document.querySelectorAll('.drilldown-subcat-card').length;
    const breadcrumbs = Array.from(document.querySelectorAll('.partner-breadcrumbs a, .partner-breadcrumbs span')).map(el => el.innerText.trim()).filter(Boolean);

    return { bannerTitle, categoryCards, productCardsCount, subcatCardsCount, breadcrumbs };
  })()`);

  console.log('  Banner Title:', step1State.bannerTitle);
  console.log('  Breadcrumbs:', step1State.breadcrumbs.join(' '));
  console.log(`  Top-Level Category Cards found: ${step1State.categoryCards.length}`);
  step1State.categoryCards.forEach((c, idx) => {
    console.log(`    [${idx + 1}] ${c.title} — Badge: "${c.badge}" | Has Logo: ${c.hasLogo} | Link: ${c.link}`);
  });
  console.log(`  Product Cards shown on Step 1: ${step1State.productCardsCount} (EXPECTED: 0 - STRICT ISOLATION)`);
  console.log(`  Subcategory Cards shown on Step 1: ${step1State.subcatCardsCount} (EXPECTED: 0)`);

  if (step1State.productCardsCount !== 0) {
    throw new Error('FAIL: Products were displayed on Brand View! Level isolation failed.');
  }
  if (step1State.categoryCards.length === 0) {
    throw new Error('FAIL: No category cards displayed on Brand View!');
  }
  await cdp.screenshot(path.join(ARTIFACT_DIR, 'drilldown_caseA_step1_brand.png'));
  console.log('  ✓ Step 1 verified and screenshot saved.');

  // STEP 2: Category / Sub-Brand View (/products/futura-medtech/dolphin-sutures)
  console.log('\n--- Step 2: Category / Sub-Brand View (/products/futura-medtech/dolphin-sutures) ---');
  await cdp.navigate(`${TARGET_URL}/products/futura-medtech/dolphin-sutures`);
  await sleep(1500);

  const step2State = await cdp.eval(`(() => {
    const bannerTitle = document.querySelector('.partner-hero-title')?.innerText || '';
    const breadcrumbs = Array.from(document.querySelectorAll('.partner-breadcrumbs a, .partner-breadcrumbs span')).map(el => el.innerText.trim()).filter(Boolean);
    const backBtn = document.querySelector('.drilldown-back-btn')?.innerText || '';
    const subcatCards = Array.from(document.querySelectorAll('.drilldown-subcat-card')).map(el => ({
      numeral: el.querySelector('.drilldown-subcat-numeral')?.innerText || '',
      title: el.querySelector('.drilldown-subcat-title')?.innerText || '',
      count: el.querySelector('.drilldown-subcat-count')?.innerText || '',
      link: el.getAttribute('href')
    }));
    const productCardsCount = document.querySelectorAll('.prod-card').length;
    const categoryCardsCount = document.querySelectorAll('.drilldown-category-card').length;
    const hasDolphinLogo = Boolean(document.querySelector('.subbrand-logo-frame'));

    return { bannerTitle, breadcrumbs, backBtn, subcatCards, productCardsCount, categoryCardsCount, hasDolphinLogo };
  })()`);

  console.log('  Banner Title:', step2State.bannerTitle);
  console.log('  Sub-brand Logo present:', step2State.hasDolphinLogo);
  console.log('  Breadcrumbs:', step2State.breadcrumbs.join(' '));
  console.log('  Back Button:', step2State.backBtn);
  console.log(`  Subcategory Cards displayed: ${step2State.subcatCards.length} (EXPECTED: 7)`);
  step2State.subcatCards.forEach(s => {
    console.log(`    ${s.numeral} ${s.title} — ${s.count} | Link: ${s.link}`);
  });
  console.log(`  Product Cards shown on Step 2: ${step2State.productCardsCount} (EXPECTED: 0 - STRICT ISOLATION)`);

  if (step2State.productCardsCount !== 0) {
    throw new Error('FAIL: Products were displayed on Category Sub-Brand View! Expected only subcategory cards.');
  }
  if (step2State.subcatCards.length !== 7) {
    throw new Error(`FAIL: Expected 7 subcategories under Dolphin Sutures, found: ${step2State.subcatCards.length}`);
  }
  await cdp.screenshot(path.join(ARTIFACT_DIR, 'drilldown_caseA_step2_category.png'));
  console.log('  ✓ Step 2 verified and screenshot saved.');

  // STEP 3: Subcategory Product Grid (/products/futura-medtech/dolphin-sutures/absorbable-sutures)
  console.log('\n--- Step 3: Subcategory Product Grid (/products/futura-medtech/dolphin-sutures/absorbable-sutures) ---');
  await cdp.navigate(`${TARGET_URL}/products/futura-medtech/dolphin-sutures/absorbable-sutures`);
  await sleep(1500);

  const step3State = await cdp.eval(`(() => {
    const bannerTitle = document.querySelector('.partner-hero-title')?.innerText || '';
    const breadcrumbs = Array.from(document.querySelectorAll('.partner-breadcrumbs a, .partner-breadcrumbs span')).map(el => el.innerText.trim()).filter(Boolean);
    const backBtn = document.querySelector('.drilldown-back-btn')?.innerText || '';
    const siblingPills = Array.from(document.querySelectorAll('.sibling-subcat-pill')).map(el => ({
      text: el.innerText.replace(/\\s+/g, ' ').trim(),
      active: el.classList.contains('active'),
      link: el.getAttribute('href')
    }));
    const productCards = Array.from(document.querySelectorAll('.prod-card')).map(el => ({
      name: el.querySelector('.prod-card-name')?.innerText || '',
      cat: el.querySelector('.prod-card-cat')?.innerText || '',
      subcat: el.querySelector('.prod-card-subcat-pill')?.innerText || ''
    }));

    return { bannerTitle, breadcrumbs, backBtn, siblingPills, productCards };
  })()`);

  console.log('  Banner Title:', step3State.bannerTitle);
  console.log('  Breadcrumbs:', step3State.breadcrumbs.join(' '));
  console.log('  Back Button:', step3State.backBtn);
  console.log(`  Sibling Subcategory Switcher Pills: ${step3State.siblingPills.length} pills`);
  step3State.siblingPills.forEach(p => {
    console.log(`    Pill: "${p.text}" | Active: ${p.active} | Link: ${p.link}`);
  });
  console.log(`  Product Cards shown: ${step3State.productCards.length}`);
  step3State.productCards.forEach((p, idx) => {
    console.log(`    [${idx + 1}] ${p.name} (${p.subcat || p.cat})`);
  });

  if (step3State.productCards.length === 0) {
    throw new Error('FAIL: No products displayed on Subcategory Product Grid!');
  }
  await cdp.screenshot(path.join(ARTIFACT_DIR, 'drilldown_caseA_step3_products.png'));
  console.log('  ✓ Step 3 verified and screenshot saved.');

  // TEST SEARCH ACROSS BRAND
  console.log('\n--- Live Search Across Brand ---');
  await cdp.eval(`(() => {
    const input = document.getElementById('partner-products-search-input');
    if (input) {
      input.value = 'polyglactin';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await sleep(1000);

  const searchState = await cdp.eval(`(() => {
    const countBadge = document.querySelector('.partner-search-count-badge')?.innerText || '';
    const productCards = Array.from(document.querySelectorAll('.prod-card')).map(el => el.querySelector('.prod-card-name')?.innerText || '');
    return { countBadge, productCards };
  })()`);

  console.log('  Search Badge:', searchState.countBadge);
  console.log(`  Found ${searchState.productCards.length} matching products:`, searchState.productCards.join(', '));
  if (searchState.productCards.length === 0) {
    throw new Error('FAIL: Search for "polyglactin" returned 0 products!');
  }
  await cdp.screenshot(path.join(ARTIFACT_DIR, 'drilldown_brand_search.png'));
  console.log('  ✓ Live search verified.');

  // Clear search
  await cdp.eval(`(() => {
    const btn = document.querySelector('.subcat-reset-btn');
    if (btn) btn.click();
  })()`);
  await sleep(800);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('TESTING CASE B — STANDARD 2-TIER BRAND (AMS)');
  console.log('Brand: AMS -> Category -> Products');
  console.log('═══════════════════════════════════════════════════════════════');

  // STEP 1: Brand View (/products/ams)
  console.log('\n--- Step 1: AMS Brand View (/products/ams) ---');
  await cdp.navigate(`${TARGET_URL}/products/ams`);
  await sleep(1500);

  const amsStep1 = await cdp.eval(`(() => {
    const categoryCards = Array.from(document.querySelectorAll('.drilldown-category-card')).map(el => ({
      title: el.querySelector('.drilldown-category-title')?.innerText || '',
      badge: el.querySelector('.drilldown-count-badge')?.innerText || '',
      link: el.getAttribute('href')
    }));
    const productCardsCount = document.querySelectorAll('.prod-card').length;
    return { categoryCards, productCardsCount };
  })()`);

  console.log(`  AMS Category Cards found: ${amsStep1.categoryCards.length}`);
  amsStep1.categoryCards.forEach(c => {
    console.log(`    Category: "${c.title}" — Badge: "${c.badge}" | Link: ${c.link}`);
  });
  console.log(`  Product Cards shown on Brand View: ${amsStep1.productCardsCount} (EXPECTED: 0)`);

  if (amsStep1.productCardsCount !== 0) {
    throw new Error('FAIL: Products were displayed on AMS Brand View!');
  }
  await cdp.screenshot(path.join(ARTIFACT_DIR, 'drilldown_caseB_step1_brand.png'));
  console.log('  ✓ Case B Step 1 verified and screenshot saved.');

  // STEP 2: Category Product Grid (click first category)
  if (amsStep1.categoryCards.length > 0) {
    const firstCatLink = amsStep1.categoryCards[0].link;
    console.log(`\n--- Step 2: AMS Category Product Grid (${firstCatLink}) ---`);
    await cdp.navigate(`${TARGET_URL}${firstCatLink}`);
    await sleep(1500);

    const amsStep2 = await cdp.eval(`(() => {
      const bannerTitle = document.querySelector('.partner-hero-title')?.innerText || '';
      const breadcrumbs = Array.from(document.querySelectorAll('.partner-breadcrumbs a, .partner-breadcrumbs span')).map(el => el.innerText.trim()).filter(Boolean);
      const backBtn = document.querySelector('.drilldown-back-btn')?.innerText || '';
      const productCards = Array.from(document.querySelectorAll('.prod-card')).map(el => el.querySelector('.prod-card-name')?.innerText || '');
      return { bannerTitle, breadcrumbs, backBtn, productCards };
    })()`);

    console.log('  Banner Title:', amsStep2.bannerTitle);
    console.log('  Breadcrumbs:', amsStep2.breadcrumbs.join(' '));
    console.log('  Back Button:', amsStep2.backBtn);
    console.log(`  Category Products shown: ${amsStep2.productCards.length}`);
    amsStep2.productCards.forEach((p, idx) => console.log(`    [${idx + 1}] ${p}`));

    if (amsStep2.productCards.length === 0) {
      throw new Error(`FAIL: No products displayed for AMS category ${firstCatLink}`);
    }
    await cdp.screenshot(path.join(ARTIFACT_DIR, 'drilldown_caseB_step2_products.png'));
    console.log('  ✓ Case B Step 2 verified and screenshot saved.');
  }

  await cdp.close();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('ALL PROGRESSIVE DRILL-DOWN TESTS PASSED WITH 100% SUCCESS!');
  console.log('═══════════════════════════════════════════════════════════════');
}

run().catch(err => {
  console.error('\n[Error] Verification failed:', err);
  process.exit(1);
});
