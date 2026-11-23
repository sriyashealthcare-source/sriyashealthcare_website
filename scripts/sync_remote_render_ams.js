/**
 * scripts/sync_remote_render_ams.js
 *
 * Synchronizes the live production Render database to match the exact AMS catalog hierarchy:
 * Brand: Advanced Medical Solutions (slug: ams, order: 1)
 *
 * Categories:
 * I) MEDICAL ADHESIVES (order: 1)
 * II) SUTURES (order: 2)
 * III) SURGICAL KITS (order: 3)
 * IV) HAEMOSTASIS (order: 4)
 * V) WOUND DRESSINGS (order: 5)
 * VI) TROCAR (order: 6)
 *
 * Products:
 * Reassigned to AMS brand and the respective Roman numeral categories.
 * Sterilene Mesh renamed to "Surgical Kit - Hernia" (slug: surgical-kit-hernia).
 * Peters C-Section Kit renamed to "Surgical Kit - Obstetrics" (slug: surgical-kit-obstetrics).
 * Titanium Hemostatic Clips renamed to "Titanium Clips".
 * YelloPort Elite created with full specs under VI) TROCAR.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sriyashealthcare-website.onrender.com';
const ADMIN_EMAIL = 'admin@sriyashealthcare.com';
const ADMIN_PASSWORD = 'Sriyas@2026';

function request(method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const headers = { 'User-Agent': 'Sriyas-Sync-Script/1.0' };
    let postData = null;

    if (body) {
      postData = typeof body === 'string' ? body : JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (_) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SRIYAS HEALTHCARE — REMOTE RENDER AMS CATALOG MIGRATION');
  console.log('═══════════════════════════════════════════════════════════════');

  // 1. Authenticate
  console.log('[Auth] Logging in as admin...');
  const loginRes = await request('POST', '/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  if (loginRes.status !== 200 || !loginRes.data?.token) {
    throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
  }
  const token = loginRes.data.token;
  console.log('[Auth] Logged in successfully. Token acquired.');

  // 2. Load runtime DB reference
  const runtimeDb = JSON.parse(fs.readFileSync(path.join(__dirname, '../server/data/sriyas_db.runtime.json'), 'utf8'));

  // 3. Find and configure AMS Brand
  console.log('[Brand] Fetching admin brands...');
  const brandsRes = await request('GET', '/api/admin/brands', null, token);
  const brands = brandsRes.data?.brands || [];
  let amsBrandDoc = brands.find(b => b.slug === 'ams' || b.name.includes('Advanced Medical Solutions'));

  if (!amsBrandDoc) {
    throw new Error('AMS Brand doc not found on Render backend.');
  }

  const amsBrandId = amsBrandDoc._id || amsBrandDoc.id;
  console.log(`[Brand] Updating AMS Brand (ID: ${amsBrandId})...`);

  const updateBrandRes = await request('PUT', `/api/admin/brands/${amsBrandId}`, {
    name: 'Advanced Medical Solutions',
    slug: 'ams',
    tabLabel: 'AMS',
    icon: '🔬',
    description: 'Advanced Medical Solutions (AMS) is a world-leading developer and manufacturer of innovative tissue adhesives, surgical sutures, laparoscopic port access systems, and advanced wound care technologies.',
    logoUrl: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048218/sriyas-healthcare/brands/advanced-medical-solutions-logo.jpg',
    logoPublicId: 'sriyas-healthcare/brands/advanced-medical-solutions-logo',
    displayOrder: 1,
    isActive: true
  }, token);

  console.log('[Brand] AMS Brand updated. Status:', updateBrandRes.status);

  // 4. Ensure the 6 Roman numeral categories
  console.log('[Categories] Synchronizing the 6 Roman numeral categories...');
  const existingCatsRes = await request('GET', '/api/admin/categories', null, token);
  const existingCats = existingCatsRes.data?.categories || [];

  const targetCategoryDefs = [
    {
      name: 'I) MEDICAL ADHESIVES',
      slug: 'medical-adhesives',
      displayOrder: 1,
      heroTitle: 'I) MEDICAL ADHESIVES',
      description: 'Advanced tissue and skin adhesives including IFABOND surgical cyanoacrylate and LiquiBand topical and hernia fixation systems.',
      heroGradient: 'linear-gradient(135deg, #1b3a4b, #2c6e80)'
    },
    {
      name: 'II) SUTURES',
      slug: 'sutures',
      displayOrder: 2,
      heroTitle: 'II) SUTURES',
      description: 'Comprehensive portfolio of surgical sutures: Natural Absorbable, Synthetic Absorbable, Non-Absorbable, and FILBLOC Knotless Barbed Sutures.',
      heroGradient: 'linear-gradient(135deg, #14213d, #284b63)'
    },
    {
      name: 'III) SURGICAL KITS',
      slug: 'surgical-kits',
      displayOrder: 3,
      heroTitle: 'III) SURGICAL KITS',
      description: 'Pre-assembled specialized surgical kits: Surgical Kit - Obstetrics (C-Section) and Surgical Kit - Hernia repair mesh systems.',
      heroGradient: 'linear-gradient(135deg, #1d3557, #457b9d)'
    },
    {
      name: 'IV) HAEMOSTASIS',
      slug: 'haemostasis',
      displayOrder: 4,
      heroTitle: 'IV) HAEMOSTASIS',
      description: 'High-purity titanium haemostatic ligating clips designed for cardiovascular and general surgical vessel occlusion.',
      heroGradient: 'linear-gradient(135deg, #2b2d42, #4a4e69)'
    },
    {
      name: 'V) WOUND DRESSINGS',
      slug: 'wound-dressings',
      displayOrder: 5,
      heroTitle: 'V) WOUND DRESSINGS',
      description: 'Haemostatic collagen sponge with local gentamicin antibiotic protection for contaminated wound cavities and surgical sites.',
      heroGradient: 'linear-gradient(135deg, #132a13, #31572c)'
    },
    {
      name: 'VI) TROCAR',
      slug: 'trocar',
      displayOrder: 6,
      heroTitle: 'VI) TROCAR',
      description: 'YelloPort® Elite reposable laparoscopic port access system featuring universal 5–12mm seal, reusable micro-ribbed cannulas, and four obturator styles.',
      heroGradient: 'linear-gradient(135deg, #3d2645, #832161)'
    }
  ];

  const categoryMap = {}; // slug -> ObjectId

  for (const def of targetCategoryDefs) {
    const existing = existingCats.find(c => c.slug === def.slug || c.name === def.name);
    if (existing) {
      const cId = existing._id || existing.id;
      categoryMap[def.slug] = cId;
      console.log(`[Categories] Updating category "${def.name}" (${cId})...`);
      await request('PUT', `/api/admin/categories/${cId}`, {
        name: def.name,
        slug: def.slug,
        brand: amsBrandId,
        heroTitle: def.heroTitle,
        description: def.description,
        heroGradient: def.heroGradient,
        displayOrder: def.displayOrder,
        isActive: true
      }, token);
    } else {
      console.log(`[Categories] Creating category "${def.name}"...`);
      const createRes = await request('POST', '/api/admin/categories', {
        name: def.name,
        slug: def.slug,
        brand: amsBrandId,
        heroTitle: def.heroTitle,
        description: def.description,
        heroGradient: def.heroGradient,
        displayOrder: def.displayOrder,
        isActive: true
      }, token);
      const newId = createRes.data?.category?._id || createRes.data?.category?.id;
      categoryMap[def.slug] = newId;
      console.log(`[Categories] Created category "${def.name}" with ID: ${newId}`);
    }
  }

  // Deactivate legacy categories belonging to Peters / old LiquiBand if empty
  const legacySlugs = [
    'peters-synthetic-absorbable-sutures',
    'peters-natural-absorbable-sutures',
    'peters-non-absorbable-sutures',
    'peters-surgical-mesh',
    'peters-surgical-kits-obstetrics',
    'peters-haemostasis-titanium-clips',
    'peters-surgical-adhesive',
    'peters-barbed-sutures-knotless',
    'liquiband-topical-skin-adhesive',
    'liquiband-hernia-mesh-fixation'
  ];
  for (const lSlug of legacySlugs) {
    const legacyCat = existingCats.find(c => c.slug === lSlug);
    if (legacyCat && legacyCat.isActive) {
      const cId = legacyCat._id || legacyCat.id;
      console.log(`[Categories] Deactivating legacy category ${lSlug} (${cId})...`);
      await request('PATCH', `/api/admin/categories/${cId}/status`, { isActive: false }, token);
    }
  }

  // 5. Fetch all products
  console.log('[Products] Fetching all admin products...');
  const allProdsRes = await request('GET', '/api/admin/products?limit=100', null, token);
  const products = allProdsRes.data?.products || [];

  // Reassignment mapping
  // slug -> { targetCat: 'slug', targetName?: string, newSlug?: string, order: number }
  const productPlans = {
    // I) MEDICAL ADHESIVES
    'ifabond': { cat: 'medical-adhesives', order: 1, name: 'IFABOND®' },
    'liquiband-fix8': { cat: 'medical-adhesives', order: 2, name: 'LiquiBand® FIX8®' },
    'liquiband-exceed': { cat: 'medical-adhesives', order: 3, name: 'LiquiBand® Exceed™' },
    'liquiband-optima': { cat: 'medical-adhesives', order: 4, name: 'LiquiBand® Optima' },

    // II) SUTURES
    'catgut-chromic': { cat: 'sutures', order: 1, name: 'Catgut Chromic™' },
    'i-col': { cat: 'sutures', order: 2, name: 'I-Col™' },
    'i-col-fast': { cat: 'sutures', order: 3, name: 'I-Col™ Fast' },
    'polycol': { cat: 'sutures', order: 4, name: 'Polycol™' },
    'stericryl': { cat: 'sutures', order: 5, name: 'Stericryl™' },
    'monocol': { cat: 'sutures', order: 6, name: 'Monocol™' },
    'sterisil': { cat: 'sutures', order: 7, name: 'Sterisil™' },
    'sterilon': { cat: 'sutures', order: 8, name: 'Sterilon™' },
    'sterilene-suture': { cat: 'sutures', order: 9, name: 'Sterilene™ Suture' },
    'steribon': { cat: 'sutures', order: 10, name: 'Steribon™' },
    'filbloc': { cat: 'sutures', order: 11, name: 'FILBLOC®' },
    'filbloc-90': { cat: 'sutures', order: 12, name: 'FILBLOC® 90' },
    'filbloc-permanent': { cat: 'sutures', order: 13, name: 'FILBLOC® Permanent' },

    // III) SURGICAL KITS
    'peters-c-section-kit': { cat: 'surgical-kits', order: 1, name: 'Surgical Kit - Obstetrics', newSlug: 'surgical-kit-obstetrics' },
    'surgical-kit-obstetrics': { cat: 'surgical-kits', order: 1, name: 'Surgical Kit - Obstetrics' },
    'sterilene-mesh': { cat: 'surgical-kits', order: 2, name: 'Surgical Kit - Hernia', newSlug: 'surgical-kit-hernia' },
    'surgical-kit-hernia': { cat: 'surgical-kits', order: 2, name: 'Surgical Kit - Hernia' },

    // IV) HAEMOSTASIS
    'titanium-hemostatic-clips': { cat: 'haemostasis', order: 1, name: 'Titanium Clips' },

    // V) WOUND DRESSINGS
    'genta-coll-resorb': { cat: 'wound-dressings', order: 1, name: 'Genta-Coll resorb' }
  };

  for (const [prodSlug, plan] of Object.entries(productPlans)) {
    const prodDoc = products.find(p => p.slug === prodSlug);
    if (!prodDoc) continue;

    const pId = prodDoc._id || prodDoc.id;
    const catId = categoryMap[plan.cat];
    const catName = targetCategoryDefs.find(c => c.slug === plan.cat)?.name;

    console.log(`[Products] Updating product "${prodDoc.name}" (${prodSlug} -> ${pId})...`);

    const updatePayload = {
      brand: amsBrandId,
      category: catId,
      cardCategory: catName,
      detailCategory: `${catName} · ${plan.name || prodDoc.name}`,
      displayOrder: plan.order,
      isActive: true
    };
    if (plan.name) updatePayload.name = plan.name;
    if (plan.newSlug) updatePayload.slug = plan.newSlug;

    // Preserve features/specs from runtimeDb if available
    const localMatch = runtimeDb.Product.find(p => p.slug === (plan.newSlug || prodSlug));
    if (localMatch) {
      if (localMatch.features && localMatch.features.length) updatePayload.features = localMatch.features;
      if (localMatch.specifications && localMatch.specifications.length) updatePayload.specifications = localMatch.specifications;
      if (localMatch.applications && localMatch.applications.length) updatePayload.applications = localMatch.applications;
      if (localMatch.shortSpecification) updatePayload.shortSpecification = localMatch.shortSpecification;
      if (localMatch.description) updatePayload.description = localMatch.description;
    }

    const updRes = await request('PUT', `/api/admin/products/${pId}`, updatePayload, token);
    console.log(`  -> Status: ${updRes.status} (${updRes.data?.product?.name || 'Updated'})`);
  }

  // 6. Check / Create YelloPort Elite
  let yelloportDoc = products.find(p => p.slug === 'yelloport-elite');
  const yelloportRuntime = runtimeDb.Product.find(p => p.slug === 'yelloport-elite');
  const trocarCatId = categoryMap['trocar'];

  if (!yelloportDoc && yelloportRuntime) {
    console.log('[Products] Creating YelloPort Elite in VI) TROCAR...');
    const createYelloRes = await request('POST', '/api/admin/products', {
      name: yelloportRuntime.name,
      slug: 'yelloport-elite',
      brand: amsBrandId,
      category: trocarCatId,
      cardCategory: 'VI) TROCAR',
      detailCategory: 'VI) TROCAR · YelloPort® Elite',
      shortSpecification: yelloportRuntime.shortSpecification,
      description: yelloportRuntime.description,
      features: yelloportRuntime.features,
      specifications: yelloportRuntime.specifications,
      applications: yelloportRuntime.applications,
      imageUrls: ['/assets/products/yelloport_elite-1.png'],
      displayOrder: 1,
      isActive: true
    }, token);
    console.log('[Products] YelloPort Elite creation status:', createYelloRes.status);
  } else if (yelloportDoc) {
    console.log('[Products] Updating existing YelloPort Elite...');
    const yId = yelloportDoc._id || yelloportDoc.id;
    await request('PUT', `/api/admin/products/${yId}`, {
      brand: amsBrandId,
      category: trocarCatId,
      cardCategory: 'VI) TROCAR',
      detailCategory: 'VI) TROCAR · YelloPort® Elite',
      displayOrder: 1,
      isActive: true
    }, token);
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  VERIFICATION AUDIT ON REMOTE RENDER API');
  console.log('═══════════════════════════════════════════════════════════════');

  const publicAmsRes = await request('GET', '/api/brands/ams');
  console.log('Public AMS Brand Status:', publicAmsRes.status, 'Product Count:', publicAmsRes.data?.brand?.productCount);

  const publicAmsProds = await request('GET', '/api/products/brand/ams');
  console.log('Public AMS Products Status:', publicAmsProds.status, 'Count:', publicAmsProds.data?.count);
  if (publicAmsProds.data?.products) {
    const categoriesSeen = [...new Set(publicAmsProds.data.products.map(p => p.category?.name))];
    console.log('Categories present on brand page:');
    categoriesSeen.forEach(c => console.log('  -', c));
    console.log('Products sample:');
    publicAmsProds.data.products.slice(0, 10).forEach(p => console.log(`  [${p.category?.name}] ${p.name} (${p.slug})`));
  }

  const herniaRes = await request('GET', '/api/products/slug/surgical-kit-hernia');
  console.log('Surgical Kit - Hernia endpoint status:', herniaRes.status, herniaRes.data?.product?.name);

  const trocarRes = await request('GET', '/api/products/slug/yelloport-elite');
  console.log('YelloPort Elite endpoint status:', trocarRes.status, trocarRes.data?.product?.name);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MIGRATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
