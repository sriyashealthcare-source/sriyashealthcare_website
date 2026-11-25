const fs = require('fs');
const path = require('path');

const dbPath = path.resolve('server/data/sriyas_db.runtime.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('=== VERIFYING DOLPHIN SUTURES / FUTURA MEDTECH CATALOG ===\n');

// 1. Check Brand
const brand = db.Brand.find(b => b.slug === 'futura-medtech');
console.log('1. Brand Futura Medtech:');
if (!brand) {
  console.error('FAIL: Brand Futura Medtech not found!');
  process.exit(1);
}
console.log(`   OK: ID=${brand._id}, Name="${brand.name}", Slug="${brand.slug}", Active=${brand.isActive}`);

// 2. Check Main Category
const mainCat = db.Category.find(c => c.slug === 'dolphin-sutures');
console.log('\n2. Main Category Dolphin Sutures:');
if (!mainCat) {
  console.error('FAIL: Category Dolphin Sutures not found!');
  process.exit(1);
}
console.log(`   OK: ID=${mainCat._id}, Name="${mainCat.name}", ParentCategory=${mainCat.parentCategory}, Brand=${mainCat.brand}`);

// 3. Check 7 Subcategories
const expectedSubcategories = [
  'absorbable-sutures',
  'non-absorbable-sutures',
  'specialty-sutures',
  'surgical-mesh',
  'skin-staplers-tackers',
  'clips-appliers',
  'hemostats'
];

console.log('\n3. 7 Subcategories:');
const subcategories = db.Category.filter(c => String(c.parentCategory) === String(mainCat._id));
console.log(`   Found ${subcategories.length} subcategories under Dolphin Sutures:`);

for (const expSlug of expectedSubcategories) {
  const found = subcategories.find(c => c.slug === expSlug);
  if (!found) {
    console.error(`   FAIL: Subcategory ${expSlug} missing!`);
    process.exit(1);
  }
  console.log(`   OK: [${found.displayOrder}] ${found.name} (slug: ${found.slug}, id: ${found._id})`);
}

// 4. Check Products
console.log('\n4. Products Check:');
const dolphinProducts = db.Product.filter(p => String(p.brand) === String(brand._id));
console.log(`   Found ${dolphinProducts.length} total products under Futura Medtech:`);

const bySub = {};
subcategories.forEach(sub => bySub[String(sub._id)] = { sub, prods: [] });

dolphinProducts.forEach(p => {
  if (bySub[String(p.subcategory)]) {
    bySub[String(p.subcategory)].prods.push(p);
  } else {
    console.warn(`   WARNING: Product ${p.name} has unknown subcategory ${p.subcategory}`);
  }
});

let missingImages = 0;
for (const subId of Object.keys(bySub)) {
  const { sub, prods } = bySub[subId];
  console.log(`\n   --- Subcategory: ${sub.name} (${prods.length} products) ---`);
  prods.forEach((p, idx) => {
    const imgUrl = p.images && p.images[0] ? p.images[0].url : 'NO_IMAGE';
    let imgExists = false;
    if (imgUrl.startsWith('/images/')) {
      const diskPath = path.resolve('client/public' + imgUrl);
      imgExists = fs.existsSync(diskPath) && fs.statSync(diskPath).size > 0;
      if (!imgExists) missingImages++;
    }
    console.log(`   ${idx + 1}. ${p.name}`);
    console.log(`      Slug: ${p.slug} | Active: ${p.isActive} | Image: ${imgUrl} [Disk: ${imgExists ? 'EXISTS' : 'MISSING'}]`);
    console.log(`      Specs: ${p.specifications.length} items | Features: ${p.features.length} items | Apps: ${p.applications.length} items`);
  });
}

console.log('\n5. Image Assets Validation:');
if (missingImages > 0) {
  console.error(`   FAIL: ${missingImages} product images missing from disk!`);
  process.exit(1);
} else {
  console.log('   OK: All product images verified on disk in client/public/images/products/dolphin-sutures/!');
}

console.log('\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY ===');
