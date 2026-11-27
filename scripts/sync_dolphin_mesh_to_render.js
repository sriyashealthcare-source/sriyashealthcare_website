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

    const req = https.request(url, { method, headers, timeout: 35000 }, (res) => {
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

const SUBCATEGORIES_CONFIG = [
  {
    name: 'Polypropylene Mesh',
    slug: 'polypropylene-mesh',
    description: 'High-tenacity knitted, 3D anatomical, and titanised polypropylene meshes for open and laparoscopic inguinal and ventral hernia repair.',
    heroTitle: 'Polypropylene Surgical Meshes',
    displayOrder: 1,
    products: ['Knit', 'Knit 3D', 'Tiolene']
  },
  {
    name: 'Composite Barrier Mesh',
    slug: 'composite-barrier-mesh',
    description: 'Advanced dual-sided composite meshes with visceral anti-adhesive barrier layers for intraperitoneal onlay mesh (IPOM) and ventral hernia repairs.',
    heroTitle: 'Composite Visceral Barrier Meshes',
    displayOrder: 2,
    products: ['Silene', 'Teflene', 'Ultralene', 'Duolene']
  },
  {
    name: 'Semi Absorbable Mesh',
    slug: 'semi-absorbable-mesh',
    description: 'Composite meshes combining fast-absorbing synthetic polymers with permanent lightweight filaments to minimize foreign body presence while maintaining physiological burst strength.',
    heroTitle: 'Semi-Absorbable Composite Meshes',
    displayOrder: 3,
    products: ['Monosolve V2', 'Monosolve V2 3D']
  },
  {
    name: 'Mesh Fixation',
    slug: 'mesh-fixation',
    description: 'Ergonomic disposable helical mesh fixation tackers and titanium/absorbable anchors for secure laparoscopic and open hernia repair.',
    heroTitle: 'Ergonomic Mesh Fixation Tackers',
    displayOrder: 4,
    products: ['Tacksure']
  }
];

async function main() {
  console.log('=== SYNCING DOLPHIN MESH TO LIVE RENDER BACKEND / MONGODB ATLAS ===\n');

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
  console.log('   ✓ Logged in successfully as:', loginRes.data.admin.name);

  // 2. Locate Futura Medtech Brand
  console.log('\n2. Verifying Brand: Futura Medtech on Render...');
  const brandsRes = await requestApi('/brands', 'GET');
  const futuraBrand = (brandsRes.data?.brands || []).find(b => b.slug === 'futura-medtech');
  if (!futuraBrand) {
    throw new Error('Futura Medtech brand not found on live database!');
  }
  const brandId = futuraBrand._id;
  console.log(`   ✓ Found Brand: "${futuraBrand.name}" (ID: ${brandId})`);

  // 3. Locate & Update Dolphin Mesh Category
  console.log('\n3. Verifying & Updating Dolphin Mesh Category on Render...');
  const adminCatsRes = await requestApi('/admin/categories', 'GET', null, token);
  const allCategories = adminCatsRes.data?.categories || [];

  let dolphinMeshCat = allCategories.find(
    c => c.slug === 'futura-medtech-dolphin-mesh' || c.slug === 'dolphin-mesh' || (c.name === 'Dolphin Mesh' && !c.parentCategory)
  );

  if (!dolphinMeshCat) {
    console.log('   Creating Dolphin Mesh category on Render...');
    const createCatRes = await requestApi('/admin/categories', 'POST', {
      name: 'Dolphin Mesh',
      slug: 'futura-medtech-dolphin-mesh',
      brand: brandId,
      parentCategory: null,
      hasSubcategories: true,
      logoUrl: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795791798/sriyas-healthcare/brands/file_l8jbit.png',
      heroTitle: 'Dolphin Mesh Surgical Portfolio',
      description: 'Comprehensive range of polypropylene, composite barrier, and semi-absorbable surgical meshes—available in flat and 3D anatomical configurations—alongside Tacksure mesh fixation systems for hernia repair and soft tissue reinforcement.',
      displayOrder: 2,
      isActive: true
    }, token);
    dolphinMeshCat = createCatRes.data?.category;
    console.log('   ✓ Created Dolphin Mesh category:', dolphinMeshCat?._id);
  } else {
    console.log(`   Updating Dolphin Mesh category (ID: ${dolphinMeshCat._id}) to hasSubcategories: true...`);
    const updateCatRes = await requestApi(`/admin/categories/${dolphinMeshCat._id}`, 'PUT', {
      name: 'Dolphin Mesh',
      hasSubcategories: true,
      logoUrl: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795791798/sriyas-healthcare/brands/file_l8jbit.png',
      heroTitle: 'Dolphin Mesh Surgical Portfolio',
      description: 'Comprehensive range of polypropylene, composite barrier, and semi-absorbable surgical meshes—available in flat and 3D anatomical configurations—alongside Tacksure mesh fixation systems for hernia repair and soft tissue reinforcement.',
      displayOrder: 2,
      isActive: true
    }, token);
    console.log(`   ✓ Updated Dolphin Mesh category response status: ${updateCatRes.status}`);
  }

  const dolphinMeshCatId = dolphinMeshCat._id;

  // 4. Create or Update the 4 Subcategories under Dolphin Mesh
  console.log('\n4. Setting Up 4 Subcategories under Dolphin Mesh on Render...');
  const subcategoryLiveMap = {}; // name -> subcategory record

  // Re-fetch all categories to get current state
  const refreshedCatsRes = await requestApi('/admin/categories', 'GET', null, token);
  const currentCats = refreshedCatsRes.data?.categories || [];

  for (const cfg of SUBCATEGORIES_CONFIG) {
    let sub = currentCats.find(c =>
      (c.slug === cfg.slug || c.slug === `dolphin-mesh-${cfg.slug}` || c.name.toLowerCase() === cfg.name.toLowerCase()) &&
      c.parentCategory && String(c.parentCategory._id || c.parentCategory) === String(dolphinMeshCatId)
    );

    if (!sub) {
      console.log(`   Creating Subcategory: [${cfg.name}]...`);
      const createSubRes = await requestApi('/admin/categories', 'POST', {
        name: cfg.name,
        slug: cfg.slug,
        brand: brandId,
        parentCategory: dolphinMeshCatId,
        heroTitle: cfg.heroTitle,
        description: cfg.description,
        displayOrder: cfg.displayOrder,
        isActive: true
      }, token);

      if (createSubRes.status === 201 && createSubRes.data?.category) {
        sub = createSubRes.data.category;
        console.log(`   ✓ Created Subcategory [${cfg.name}]: ${sub._id}`);
      } else {
        // Retry with dolphin-mesh- prefix if slug conflict
        console.warn(`   Slug retry for [${cfg.name}]...`);
        const retryRes = await requestApi('/admin/categories', 'POST', {
          name: cfg.name,
          slug: `dolphin-mesh-${cfg.slug}`,
          brand: brandId,
          parentCategory: dolphinMeshCatId,
          heroTitle: cfg.heroTitle,
          description: cfg.description,
          displayOrder: cfg.displayOrder,
          isActive: true
        }, token);
        sub = retryRes.data?.category;
        console.log(`   ✓ Created Subcategory with prefix [${cfg.name}]: ${sub?._id}`);
      }
    } else {
      console.log(`   ✓ Found existing Subcategory [${cfg.name}]: ${sub._id}`);
    }

    subcategoryLiveMap[cfg.name] = sub;
    for (const pName of cfg.products) {
      subcategoryLiveMap[pName] = sub;
    }
  }

  // 5. Load products from local DB (which now contains all 10 products + 121 codes + full specs)
  console.log('\n5. Uploading 10 Dolphin Mesh Products to Live Render Database...');
  const localDb = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'sriyas_db.runtime.json'), 'utf8'));
  const localMeshProds = localDb.Product.filter(p => p.category === '6b099bb7977630f30b5cb445');
  console.log(`   Found ${localMeshProds.length} Dolphin Mesh products in local DB to sync.`);

  // Fetch existing live products under Futura Medtech
  const liveProdsRes = await requestApi('/products?brand=futura-medtech&limit=200', 'GET');
  const liveProds = liveProdsRes.data?.products || [];
  console.log(`   Existing live products under Futura Medtech: ${liveProds.length}`);

  let createdCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < localMeshProds.length; i++) {
    const prod = localMeshProds[i];
    const subDoc = subcategoryLiveMap[prod.name];
    const subId = subDoc ? subDoc._id : null;

    // Build absolute image URLs
    const imageUrls = (prod.images || []).map(img => {
      const u = typeof img === 'string' ? img : img.url;
      return u.startsWith('http') ? u : `${CF_BASE}${u}`;
    });

    const payload = {
      name: prod.name,
      slug: prod.slug,
      brand: brandId,
      category: dolphinMeshCatId,
      subcategory: subId,
      cardCategory: prod.cardCategory || (subDoc ? subDoc.name : 'Dolphin Mesh'),
      detailCategory: prod.detailCategory || `Dolphin Mesh · ${subDoc ? subDoc.name : ''}`,
      shortSpecification: prod.shortSpecification,
      description: prod.description,
      imageUrls: imageUrls,
      features: prod.features,
      specifications: prod.specifications,
      applications: prod.applications,
      productCodes: prod.productCodes,
      skuMatrix: { codes: prod.productCodes },
      seoTitle: prod.seoTitle,
      seoDescription: prod.seoDescription,
      isActive: true,
      displayOrder: prod.displayOrder || (i + 1)
    };

    const existingLive = liveProds.find(lp => lp.slug === prod.slug || lp.name === prod.name);
    if (existingLive) {
      console.log(`   [${i + 1}/${localMeshProds.length}] Updating: ${prod.name} (ID: ${existingLive._id})...`);
      const updateRes = await requestApi(`/admin/products/${existingLive._id}`, 'PUT', payload, token);
      if (updateRes.status === 200) {
        updatedCount++;
        console.log(`   ✓ Updated ${prod.name}`);
      } else {
        console.warn(`   ⚠ Failed update ${prod.slug}:`, updateRes);
      }
    } else {
      console.log(`   [${i + 1}/${localMeshProds.length}] Creating: ${prod.name}...`);
      const createRes = await requestApi('/admin/products', 'POST', payload, token);
      if (createRes.status === 201) {
        createdCount++;
        console.log(`   ✓ Created ${prod.name} (ID: ${createRes.data?.product?._id})`);
      } else {
        console.warn(`   ⚠ Failed create ${prod.slug}:`, createRes);
      }
    }
  }

  console.log(`\n=== SYNC TO RENDER COMPLETE ===`);
  console.log(`Created: ${createdCount} products`);
  console.log(`Updated: ${updatedCount} products`);

  // 6. Verify live API
  console.log('\n6. Verifying Live API State for Dolphin Mesh...');
  const verifyRes = await requestApi('/products?brand=futura-medtech&limit=250', 'GET');
  const finalLiveProds = verifyRes.data?.products || [];
  const meshLiveProds = finalLiveProds.filter(p =>
    (p.category && String(p.category._id || p.category) === String(dolphinMeshCatId)) ||
    (p.cardCategory && p.cardCategory.toLowerCase().includes('mesh'))
  );
  console.log(`   Total Futura Medtech products on Render: ${finalLiveProds.length}`);
  console.log(`   Dolphin Mesh products on Render: ${meshLiveProds.length}`);
  meshLiveProds.forEach(p => {
    console.log(`   - ${p.name} (${p.slug}) | Sub: ${p.subcategory?.name || p.subcategory} | Codes: ${p.productCodes ? p.productCodes.length : (p.skuMatrix?.codes ? p.skuMatrix.codes.length : 'N/A')}`);
  });
}

main().catch(err => {
  console.error('Fatal error in sync script:', err);
  process.exit(1);
});
