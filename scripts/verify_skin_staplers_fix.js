const fs = require('fs');
const path = require('path');
const assert = require('assert');
const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== VERIFYING SKIN STAPLERS & TACKERS FIX ===\n');

  // 1. Verify Local Runtime Database
  const dbPath = path.resolve('server/data/sriyas_db.runtime.json');
  assert(fs.existsSync(dbPath), 'sriyas_db.runtime.json must exist');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  const staplersCat = db.Category.find(c => c._id === '6b09af48905f6b6d6e0faa1b' || c.slug === 'futura-medtech-skin-staplers-tackers');
  assert(staplersCat, 'Skin Staplers & Tackers main category must exist in local DB');
  assert.strictEqual(staplersCat.parentCategory, null, 'Skin Staplers & Tackers must be a top-level category (parentCategory: null)');
  assert.strictEqual(staplersCat.hasSubcategories, false, 'hasSubcategories must be explicitly false');
  console.log('1. [Category] Skin Staplers & Tackers in local DB:');
  console.log(`   ID: ${staplersCat._id} | Slug: ${staplersCat.slug} | hasSubcategories: ${staplersCat.hasSubcategories}`);

  // Check child subcategories
  const childSubs = db.Category.filter(c => String(c.parentCategory) === String(staplersCat._id));
  assert.strictEqual(childSubs.length, 0, `Skin Staplers & Tackers must have 0 child subcategories (found ${childSubs.length})`);
  console.log('2. [Subcategories] Confirmed 0 child subcategories under Skin Staplers & Tackers.');

  // Check 4 products
  const staplerProds = db.Product.filter(p => String(p.category) === String(staplersCat._id) && p.isActive !== false);
  assert.strictEqual(staplerProds.length, 4, `Must have exactly 4 products under Skin Staplers & Tackers (found ${staplerProds.length})`);
  console.log(`3. [Products] Confirmed ${staplerProds.length} products directly under Skin Staplers & Tackers:`);

  const expectedSlugs = ['reusable-skin-stapler', 'skin-staple-remover', 'skin-stapler', 'mesh-tacker'];
  for (const s of expectedSlugs) {
    const prod = staplerProds.find(p => p.slug === s);
    assert(prod, `Product "${s}" must exist under Skin Staplers & Tackers`);
    assert.strictEqual(prod.subcategory, null, `Product "${s}" must have subcategory: null`);
    console.log(`   ✓ [Order ${prod.displayOrder}] ${prod.name} (${prod.slug}) | Subcat: ${prod.subcategory}`);
  }

  // Check Mesh Tacker details
  const tacker = staplerProds.find(p => p.slug === 'mesh-tacker');
  assert(tacker.productCodes && tacker.productCodes.length === 3, 'Mesh Tacker must have 3 product codes');
  assert(tacker.features && tacker.features.length >= 6, 'Mesh Tacker must have at least 6 features');
  assert(tacker.specifications && tacker.specifications.length >= 5, 'Mesh Tacker must have specifications');
  assert(tacker.images && tacker.images.length >= 1, 'Mesh Tacker must have images');
  console.log(`4. [Mesh Tacker Details] Codes: ${tacker.productCodes.length} (DST20, DST30, DST30A) | Specs: ${tacker.specifications.length} | Features: ${tacker.features.length}`);

  // Check image files on disk
  const imgWebp = path.resolve('client/public/images/products/dolphin-sutures/mesh-tacker.webp');
  const imgPng = path.resolve('client/public/images/products/dolphin-sutures/mesh-tacker.png');
  assert(fs.existsSync(imgWebp), 'mesh-tacker.webp must exist in client/public');
  assert(fs.existsSync(imgPng), 'mesh-tacker.png must exist in client/public');
  console.log('5. [Images] Confirmed mesh-tacker.webp & mesh-tacker.png exist on disk.');

  // 2. Verify Live Render API State
  console.log('\n6. [Live API Verification] Querying Render API...');
  const catRes = await get('https://sriyashealthcare-website.onrender.com/api/categories?brand=futura-medtech');
  const liveCats = catRes.categories || catRes;
  const liveStaplerCat = liveCats.find(c => c._id === '6b09af48905f6b6d6e0faa1b' || c.slug === 'futura-medtech-skin-staplers-tackers');
  assert(liveStaplerCat, 'Skin Staplers & Tackers must exist on Render');
  assert.strictEqual(liveStaplerCat.hasSubcategories, false, 'hasSubcategories on Render must be false');
  assert.strictEqual(liveStaplerCat.subcategories?.length || 0, 0, 'subcategories on Render must be empty array');
  console.log('   ✓ Live Render Category: hasSubcategories = false, subcategories = []');

  const prodRes = await get('https://sriyashealthcare-website.onrender.com/api/products?brand=futura-medtech&limit=250');
  const liveProds = prodRes.products || prodRes;
  const liveStaplerProds = liveProds.filter(p => String(p.category?._id || p.category) === '6b09af48905f6b6d6e0faa1b');
  assert.strictEqual(liveStaplerProds.length, 4, `Live Render must have 4 products directly under Skin Staplers & Tackers (found ${liveStaplerProds.length})`);
  console.log(`   ✓ Live Render Products: exactly 4 products attached directly:`);
  liveStaplerProds.forEach(p => console.log(`     - [Order ${p.displayOrder}] ${p.name} (${p.slug}) | Subcat: ${p.subcategory?.name || p.subcategory || 'null'}`));

  console.log('\n=== ALL VERIFICATION CHECKS PASSED PERFECTLY ===\n');
}

run().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
