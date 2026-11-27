const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runVerification() {
  console.log('=== VERIFYING DOLPHIN MESH CATALOG IMPORT ===\n');

  // 1. Verify Local Runtime Database
  const dbPath = path.resolve('server/data/sriyas_db.runtime.json');
  assert(fs.existsSync(dbPath), 'sriyas_db.runtime.json must exist');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  const futura = db.Brand.find(b => b.slug === 'futura-medtech');
  assert(futura, 'Futura Medtech brand must exist');
  console.log('1. [Brand] Futura Medtech:', futura.name, `(${futura._id})`);

  const dolphinMeshCat = db.Category.find(
    c => c.slug === 'futura-medtech-dolphin-mesh' || c.slug === 'dolphin-mesh' || c.name === 'Dolphin Mesh'
  );
  assert(dolphinMeshCat, 'Dolphin Mesh category must exist');
  assert.strictEqual(dolphinMeshCat.hasSubcategories, true, 'Dolphin Mesh must have hasSubcategories: true');
  assert(dolphinMeshCat.logoUrl, 'Dolphin Mesh must have logoUrl');
  console.log('2. [Category] Dolphin Mesh:', dolphinMeshCat.name, `(ID: ${dolphinMeshCat._id}, hasSubcategories: ${dolphinMeshCat.hasSubcategories})`);
  console.log('   Logo URL:', dolphinMeshCat.logoUrl);

  // 2. Verify 4 Subcategories
  const expectedSubcategories = [
    { name: 'Polypropylene Mesh', slug: 'polypropylene-mesh', count: 3 },
    { name: 'Composite Barrier Mesh', slug: 'composite-barrier-mesh', count: 4 },
    { name: 'Semi Absorbable Mesh', slug: 'semi-absorbable-mesh', count: 2 },
    { name: 'Mesh Fixation', slug: 'mesh-fixation', count: 1 }
  ];

  console.log('\n3. [Subcategories] Checking 4 Subcategories:');
  const subDocs = {};
  for (const exp of expectedSubcategories) {
    const sub = db.Category.find(
      c => (c.slug === exp.slug || c.name.toLowerCase() === exp.name.toLowerCase()) &&
           String(c.parentCategory) === String(dolphinMeshCat._id)
    );
    assert(sub, `Subcategory "${exp.name}" must exist under Dolphin Mesh`);
    subDocs[exp.name] = sub;
    console.log(`   ✓ ${sub.name} (slug: ${sub.slug}, ID: ${sub._id})`);
  }

  // 3. Verify 10 Products & 121 Product Codes
  const expectedProducts = [
    { name: 'Knit', slug: 'knit', subcat: 'Polypropylene Mesh', codes: 41 },
    { name: 'Knit 3D', slug: 'knit-3d', subcat: 'Polypropylene Mesh', codes: 12 },
    { name: 'Tiolene', slug: 'tiolene', subcat: 'Polypropylene Mesh', codes: 13 },
    { name: 'Silene', slug: 'silene', subcat: 'Composite Barrier Mesh', codes: 9 },
    { name: 'Teflene', slug: 'teflene', subcat: 'Composite Barrier Mesh', codes: 10 },
    { name: 'Ultralene', slug: 'ultralene', subcat: 'Composite Barrier Mesh', codes: 13 },
    { name: 'Duolene', slug: 'duolene', subcat: 'Composite Barrier Mesh', codes: 8 },
    { name: 'Monosolve V2', slug: 'monosolve-v2', subcat: 'Semi Absorbable Mesh', codes: 6 },
    { name: 'Monosolve V2 3D', slug: 'monosolve-v2-3d', subcat: 'Semi Absorbable Mesh', codes: 6 },
    { name: 'Tacksure', slug: 'tacksure', subcat: 'Mesh Fixation', codes: 3 }
  ];

  console.log('\n4. [Products] Checking 10 Products & SKU Codes:');
  let totalCodes = 0;
  for (const exp of expectedProducts) {
    const prod = db.Product.find(p => p.slug === exp.slug && String(p.category) === String(dolphinMeshCat._id));
    assert(prod, `Product "${exp.name}" (${exp.slug}) must exist in local DB`);
    assert(prod.images && prod.images.length > 0, `Product "${exp.name}" must have images`);
    assert(prod.features && prod.features.length > 0, `Product "${exp.name}" must have features`);
    assert(prod.specifications && prod.specifications.length > 0, `Product "${exp.name}" must have specifications`);
    assert(prod.applications && prod.applications.length > 0, `Product "${exp.name}" must have applications`);
    assert.strictEqual(prod.productCodes?.length, exp.codes, `Product "${exp.name}" must have ${exp.codes} codes`);
    totalCodes += prod.productCodes.length;

    const subDoc = subDocs[exp.subcat];
    assert.strictEqual(String(prod.subcategory), String(subDoc._id), `Product "${exp.name}" subcategory ID must match "${exp.subcat}"`);

    console.log(`   ✓ ${prod.name} (${prod.slug}) | Sub: ${exp.subcat} | Codes: ${prod.productCodes.length}/${exp.codes} | Imgs: ${prod.images.length}`);
  }

  assert.strictEqual(totalCodes, 121, `Total codes must be exactly 121 (got ${totalCodes})`);
  console.log(`\n✓ All 10 products verified! Total product codes across catalog: ${totalCodes} (Exact match: 121!)`);

  // 4. Verify Local Images
  console.log('\n5. [Images] Checking downloaded WebP files in client/public:');
  const imgDir = path.resolve('client/public/images/products/dolphin-mesh');
  assert(fs.existsSync(imgDir), 'client/public/images/products/dolphin-mesh must exist');
  const imgFiles = fs.readdirSync(imgDir);
  console.log(`   Found ${imgFiles.length} image files in ${imgDir}`);
  assert(imgFiles.length >= 19, 'Must have at least 19 downloaded product & packaging images');

  console.log('\n=== ALL LOCAL CHECKS PASSED PERFECTLY ===\n');
}

runVerification();
