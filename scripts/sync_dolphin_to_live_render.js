const https = require('https');
const fs = require('fs');
const path = require('path');

const RENDER_BASE = 'https://sriyashealthcare-website.onrender.com/api';
const CF_BASE = 'https://sriyashealthcare-website.sriyashealthcare.workers.dev';

function requestApi(endpoint, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(RENDER_BASE + endpoint);
    const bodyStr = data ? JSON.stringify(data) : null;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (bodyStr) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(url, { method, headers, timeout: 30000 }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(resData);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout ' + endpoint));
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// 7 Required Subcategories
const SUBCATEGORY_DEFS = [
  {
    name: 'Absorbable Sutures',
    slug: 'absorbable-sutures',
    description: 'Synthetic and natural absorbable sutures — polyglactin, PGA, poliglecaprone, polydioxanone, catgut.',
    heroTitle: 'Synthetic & Natural Absorbable Sutures',
    displayOrder: 1
  },
  {
    name: 'Non-Absorbable Sutures',
    slug: 'non-absorbable-sutures',
    description: 'Permanent monofilament and braided sutures — polypropylene, nylon, polyester, silk, stainless steel.',
    heroTitle: 'Permanent Monofilament & Braided Sutures',
    displayOrder: 2
  },
  {
    name: 'Specialty Sutures',
    slug: 'specialty-sutures',
    description: 'Feature sutures beyond standard materials — triclosan-coated antibacterial, knotless barbed sutures, and specialized configurations.',
    heroTitle: 'Antibacterial & Knotless Barbed Specialty Sutures',
    displayOrder: 3
  },
  {
    name: 'Surgical Mesh',
    slug: 'surgical-mesh',
    description: 'Polypropylene, composite and semi-absorbable surgical mesh for hernia repair and soft tissue reinforcement.',
    heroTitle: 'High-Performance Hernia & Tissue Reinforcement Meshes',
    displayOrder: 4
  },
  {
    name: 'Skin Staplers & Tackers',
    slug: 'skin-staplers-tackers',
    description: 'Disposable and reusable skin staplers, staple removers, and mesh tackers for wound closure and fixation.',
    heroTitle: 'Surgical Skin Staplers & Hernia Fixation Tackers',
    displayOrder: 5
  },
  {
    name: 'Clips & Appliers',
    slug: 'clips-appliers',
    description: 'Polymer ligation clips and appliers for secure vessel and duct occlusion in open and laparoscopic surgery.',
    heroTitle: 'Polymer & Titanium Vessel Ligation Clips',
    displayOrder: 6
  },
  {
    name: 'Hemostats',
    slug: 'hemostats',
    description: 'Hemostatic products such as Hemostax and sterile bone wax for controlling surgical bleeding.',
    heroTitle: 'Absorbable Hemostats & Sterile Bone Wax',
    displayOrder: 7
  }
];

function determineSubSlug(p) {
  const cardCat = (p.cardCategory || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  const slug = (p.slug || '').toLowerCase();

  if (cardCat.includes('absorbable') && !cardCat.includes('non-absorbable') && !cardCat.includes('specialty')) {
    return 'absorbable-sutures';
  }
  if (cardCat.includes('non-absorbable')) {
    return 'non-absorbable-sutures';
  }
  if (cardCat.includes('specialty') || cardCat.includes('antibacterial') || slug.includes('barb') || slug.includes('plus') || slug.includes('mono-ab')) {
    return 'specialty-sutures';
  }
  if (cardCat.includes('mesh') || slug.includes('mesh')) {
    return 'surgical-mesh';
  }
  if (cardCat.includes('stapler') || cardCat.includes('tacker') || slug.includes('stapler') || slug.includes('remover') || slug.includes('tacker')) {
    return 'skin-staplers-tackers';
  }
  if (cardCat.includes('clip') || slug.includes('clip')) {
    return 'clips-appliers';
  }
  if (cardCat.includes('hemostat') || slug.includes('hemostax') || slug.includes('bone-wax')) {
    return 'hemostats';
  }
  return 'absorbable-sutures';
}

async function main() {
  console.log('=== SYNCING DOLPHIN SUTURES TO LIVE RENDER / MONGODB ATLAS ===\n');

  // 1. Authenticate
  console.log('1. Logging in to live Render API...');
  const loginRes = await requestApi('/auth/login', 'POST', {
    email: 'admin@sriyashealthcare.com',
    password: 'Sriyas@2026'
  });
  if (loginRes.status !== 200 || !loginRes.data?.token) {
    throw new Error('Login failed: ' + JSON.stringify(loginRes));
  }
  const token = loginRes.data.token;
  console.log('   Logged in successfully as:', loginRes.data.admin.name);

  // 2. Verify Brand: Futura Medtech
  console.log('\n2. Verifying Brand: Futura Medtech...');
  const brandsRes = await requestApi('/brands', 'GET');
  const futuraBrand = (brandsRes.data?.brands || []).find(b => b.slug === 'futura-medtech');
  if (!futuraBrand) {
    throw new Error('Futura Medtech brand not found on live database!');
  }
  const brandId = futuraBrand._id;
  console.log(`   Found Brand: "${futuraBrand.name}" (ID: ${brandId})`);

  // 3. Main Category: Dolphin Sutures
  console.log('\n3. Verifying Main Category: Dolphin Sutures...');
  const catsRes = await requestApi('/categories?brand=futura-medtech', 'GET');
  let mainCat = (catsRes.data?.categories || []).find(c => c.slug === 'dolphin-sutures' || c.name.toLowerCase() === 'dolphin sutures');
  
  if (!mainCat) {
    console.log('   Creating main category Dolphin Sutures...');
    const createCatRes = await requestApi('/admin/categories', 'POST', {
      name: 'Dolphin Sutures',
      slug: 'dolphin-sutures',
      brand: brandId,
      parentCategory: null,
      heroTitle: 'Dolphin Sutures Surgical Portfolio',
      description: 'Comprehensive range of high-precision surgical sutures, hernia meshes, staplers, ligation clips, and advanced wound closure solutions manufactured to ISO 13485 and CE standards.',
      displayOrder: 1,
      isActive: true
    }, token);
    mainCat = createCatRes.data?.category;
    console.log('   Created main category:', mainCat?._id);
  } else {
    console.log(`   Found existing main category: "${mainCat.name}" (ID: ${mainCat._id})`);
  }
  const mainCatId = mainCat._id;

  // 4. Create / Verify 7 Subcategories under Dolphin Sutures
  console.log('\n4. Setting Up 7 Subcategories under Dolphin Sutures on Render...');
  const subcategoryLiveMap = {}; // slug -> subcategory record

  // Fetch all existing categories to avoid duplicate slug conflicts
  const allCatsRes = await requestApi('/categories', 'GET');
  const existingCats = allCatsRes.data?.categories || [];

  for (const def of SUBCATEGORY_DEFS) {
    let sub = existingCats.find(c => 
      (c.slug === def.slug || c.slug === `dolphin-sutures-${def.slug}` || c.name.toLowerCase() === def.name.toLowerCase()) &&
      c.parentCategory && String(c.parentCategory._id || c.parentCategory) === String(mainCatId)
    );

    if (!sub) {
      console.log(`   Creating Subcategory: [${def.name}]...`);
      const createSubRes = await requestApi('/admin/categories', 'POST', {
        name: def.name,
        slug: `dolphin-sutures-${def.slug}`,
        brand: brandId,
        parentCategory: mainCatId,
        heroTitle: def.heroTitle,
        description: def.description,
        displayOrder: def.displayOrder,
        isActive: true
      }, token);

      if (createSubRes.status === 201 && createSubRes.data?.category) {
        sub = createSubRes.data.category;
        console.log(`   Created Subcategory [${def.name}]: ${sub._id}`);
      } else {
        console.error(`   Failed to create subcategory ${def.name}:`, createSubRes);
      }
    } else {
      console.log(`   Found Subcategory [${def.name}]: ${sub._id}`);
    }

    subcategoryLiveMap[def.slug] = sub;
  }

  // 5. Load Products from local db runtime and push to live Render
  console.log('\n5. Uploading Products to Live Render Database...');
  const dbPath = path.resolve('server/data/sriyas_db.runtime.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // Get existing live products to avoid duplicates
  const liveProdsRes = await requestApi('/products?brand=futura-medtech&limit=100', 'GET');
  const liveProds = liveProdsRes.data?.products || [];
  console.log(`   Existing live products under Futura Medtech: ${liveProds.length}`);

  const localDolphinProds = db.Product.filter(p => p.cardCategory && p.cardCategory.includes('Dolphin Sutures'));
  console.log(`   Local Dolphin products to sync: ${localDolphinProds.length}`);

  let createdCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < localDolphinProds.length; i++) {
    const prod = localDolphinProds[i];
    const subSlug = determineSubSlug(prod);
    const subDoc = subcategoryLiveMap[subSlug];
    const subId = subDoc ? subDoc._id : null;

    // Build image URL pointing to Cloudflare CDN
    let imgUrl = '';
    if (prod.images && prod.images[0] && prod.images[0].url) {
      if (prod.images[0].url.startsWith('http')) {
        imgUrl = prod.images[0].url;
      } else {
        imgUrl = `${CF_BASE}${prod.images[0].url}`;
      }
    }

    const payload = {
      name: prod.name,
      slug: prod.slug,
      brand: brandId,
      category: mainCatId,
      subcategory: subId,
      cardCategory: subDoc ? `Dolphin Sutures · ${subDoc.name}` : prod.cardCategory,
      detailCategory: subDoc ? `Futura Medtech · Dolphin Sutures · ${subDoc.name}` : prod.detailCategory,
      shortSpecification: prod.shortSpecification,
      description: prod.description,
      imageUrls: imgUrl ? [imgUrl] : [],
      features: prod.features,
      specifications: prod.specifications,
      applications: prod.applications,
      isActive: true,
      displayOrder: prod.displayOrder || (i + 1)
    };

    const existingLive = liveProds.find(lp => lp.slug === prod.slug);
    if (existingLive) {
      console.log(`   [${i + 1}/${localDolphinProds.length}] Updating: ${prod.name}...`);
      const updateRes = await requestApi(`/admin/products/${existingLive._id}`, 'PUT', payload, token);
      if (updateRes.status === 200) {
        updatedCount++;
      } else {
        console.warn(`   Failed update ${prod.slug}:`, updateRes);
      }
    } else {
      console.log(`   [${i + 1}/${localDolphinProds.length}] Creating: ${prod.name}...`);
      const createRes = await requestApi('/admin/products', 'POST', payload, token);
      if (createRes.status === 201) {
        createdCount++;
      } else {
        console.warn(`   Failed create ${prod.slug}:`, createRes);
      }
    }
  }

  console.log(`\n=== SYNC COMPLETE ===`);
  console.log(`Created: ${createdCount} products`);
  console.log(`Updated: ${updatedCount} products`);

  // 6. Verify by querying live /api/products?brand=futura-medtech
  console.log('\n6. Verifying Live API State...');
  const verifyRes = await requestApi('/products?brand=futura-medtech&limit=100', 'GET');
  const finalLiveProds = verifyRes.data?.products || [];
  console.log(`   Total products on live Render backend under Futura Medtech: ${finalLiveProds.length}`);
}

main().catch(err => {
  console.error('Fatal error in sync script:', err);
  process.exit(1);
});
