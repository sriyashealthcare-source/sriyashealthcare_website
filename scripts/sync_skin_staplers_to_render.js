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

const tackerCodes = [
  {
    code: 'DST20',
    fixators: '20',
    description: 'Disposable 5mm TACKSURE with 20 titanised helical shaped fixators with 350mm shaft length'
  },
  {
    code: 'DST30',
    fixators: '30',
    description: 'Disposable 5mm TACKSURE with 30 titanised helical shaped fixators with 350mm shaft length'
  },
  {
    code: 'DST30A',
    fixators: '30',
    description: 'Disposable 5mm TACKSURE with 30 Absorbable PGLA fixators with 350mm shaft length'
  }
];

const tackerFeatures = [
  'Two fastener configurations: available with non-absorbable titanium helical tacks or absorbable screw-shaped polyglactin (PGLA) tacks to match clinical need',
  'Consistent fastener deployment: delivers one fastener per activation, supporting predictable, controlled mechanical tissue fixation',
  'Laparoscopic and open surgical access: 5 mm diameter instrument with 350 mm shaft length suits standard trocar ports and open hernia techniques',
  'Broad surgical mesh compatibility: anchors single-layer, composite barrier, synthetic, and biologic meshes securely',
  'Ergonomic handle and trigger: provides responsive tactile feedback and precision fastener placement at critical fixation points',
  'Sterile and preloaded: single-use disposable device that reduces operative trauma and streamlines theatre preparation'
];

const tackerSpecs = [
  { name: 'Material', value: 'Titanium helical or absorbable PGLA fasteners; medical-grade polymer & stainless steel housing' },
  { name: 'Absorbability', value: 'Available in Non-absorbable (Titanium) and Absorbable (PGLA) variants' },
  { name: 'Instrument Diameter', value: '5 mm shaft' },
  { name: 'Shaft Length', value: '350 mm' },
  { name: 'Fixator Count', value: '20 or 30 fixators per preloaded device' },
  { name: 'Supply', value: 'Sterile, single-patient use' },
  { name: 'Fixation Compatibility', value: 'Synthetic, titanised, and composite hernia meshes' }
];

const tackerApps = [
  'Laparoscopic ventral and incisional hernia repair (IPOM mesh fixation)',
  'Laparoscopic inguinal hernia repair (TAPP and TEP approaches)',
  'Open ventral and umbilical hernia mesh fixation',
  'Abdominal wall defect reconstruction and soft tissue approximation'
];

async function main() {
  console.log('=== SYNCING SKIN STAPLERS & TACKERS TO LIVE RENDER BACKEND ===\n');

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
  console.log('   ✓ Logged in as:', loginRes.data.admin.name);

  // 2. Locate Futura Medtech Brand
  const brandsRes = await requestApi('/brands', 'GET');
  const futura = (brandsRes.data?.brands || []).find(b => b.slug === 'futura-medtech');
  if (!futura) throw new Error('Futura Medtech brand not found on Render!');
  const brandId = futura._id;
  console.log(`2. Found Futura Medtech (ID: ${brandId})`);

  // 3. Update Main Category: Skin Staplers & Tackers
  const STAPLERS_CAT_ID = '6b09af48905f6b6d6e0faa1b';
  console.log(`\n3. Updating main category [Skin Staplers & Tackers] (${STAPLERS_CAT_ID})...`);
  const updateCatRes = await requestApi(`/admin/categories/${STAPLERS_CAT_ID}`, 'PUT', {
    name: 'Skin Staplers & Tackers',
    hasSubcategories: false,
    has_subcategories: false,
    parentCategory: null,
    parent_category_id: null,
    logoUrl: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795796807/sriyas-healthcare/brands/file_hk4l3u.png',
    heroTitle: 'Skin Staplers & Tackers',
    description: 'Disposable and reusable surgical skin staplers, ergonomic staple removers, and helical mesh tackers engineered for rapid wound closure and secure prosthetic mesh fixation in open and laparoscopic procedures.',
    displayOrder: 3,
    isActive: true
  }, token);
  console.log('   ✓ Category update status:', updateCatRes.status);

  // 4. Delete redundant duplicate subcategory 6b071debff5454ef1b769239
  console.log('\n4. Removing redundant subcategory (6b071debff5454ef1b769239)...');
  const delSubRes = await requestApi('/admin/categories/6b071debff5454ef1b769239', 'DELETE', null, token);
  console.log('   ✓ Delete subcategory status:', delSubRes.status);

  // 5. Update the 4 products directly under main category
  console.log('\n5. Attaching 4 products directly under Skin Staplers & Tackers...');
  const liveProdsRes = await requestApi('/products?brand=futura-medtech&limit=250', 'GET');
  const prods = liveProdsRes.data?.products || [];

  const existingStaplers = {
    'reusable-skin-stapler': prods.find(p => p.slug === 'reusable-skin-stapler'),
    'skin-staple-remover': prods.find(p => p.slug === 'skin-staple-remover'),
    'skin-stapler': prods.find(p => p.slug === 'skin-stapler'),
    'mesh-tacker': prods.find(p => p.slug === 'mesh-tacker')
  };

  // 5a. Duramate Reusable Skin Stapler
  if (existingStaplers['reusable-skin-stapler']) {
    const p = existingStaplers['reusable-skin-stapler'];
    console.log(`   Updating ${p.name}...`);
    const res = await requestApi(`/admin/products/${p._id}`, 'PUT', {
      category: STAPLERS_CAT_ID,
      subcategory: null,
      subcategoryId: null,
      cardCategory: 'Skin Staplers & Tackers',
      detailCategory: 'Futura Medtech · Skin Staplers & Tackers',
      displayOrder: 1,
      isActive: true
    }, token);
    console.log(`   ✓ ${p.name} updated:`, res.status);
  }

  // 5b. Skin Staple Remover
  if (existingStaplers['skin-staple-remover']) {
    const p = existingStaplers['skin-staple-remover'];
    console.log(`   Updating ${p.name}...`);
    const res = await requestApi(`/admin/products/${p._id}`, 'PUT', {
      category: STAPLERS_CAT_ID,
      subcategory: null,
      subcategoryId: null,
      cardCategory: 'Skin Staplers & Tackers',
      detailCategory: 'Futura Medtech · Skin Staplers & Tackers',
      displayOrder: 2,
      isActive: true
    }, token);
    console.log(`   ✓ ${p.name} updated:`, res.status);
  }

  // 5c. Dermamate Skin Stapler
  if (existingStaplers['skin-stapler']) {
    const p = existingStaplers['skin-stapler'];
    console.log(`   Updating ${p.name}...`);
    const res = await requestApi(`/admin/products/${p._id}`, 'PUT', {
      category: STAPLERS_CAT_ID,
      subcategory: null,
      subcategoryId: null,
      cardCategory: 'Skin Staplers & Tackers',
      detailCategory: 'Futura Medtech · Skin Staplers & Tackers',
      displayOrder: 3,
      isActive: true
    }, token);
    console.log(`   ✓ ${p.name} updated:`, res.status);
  }

  // 5d. Mesh Tacker (with complete scraped specs, features, codes, images)
  const tackerPayload = {
    name: 'Mesh Tacker',
    slug: 'mesh-tacker',
    brand: brandId,
    category: STAPLERS_CAT_ID,
    subcategory: null,
    subcategoryId: null,
    cardCategory: 'Skin Staplers & Tackers',
    detailCategory: 'Futura Medtech · Skin Staplers & Tackers',
    shortSpecification: '5mm Disposable Hernia Mesh Tacker with Titanium / PGLA Fasteners',
    description: 'TACKSURE Mesh Tacker is a sterile, single-use laparoscopic and open-surgery device for fixing surgical mesh to soft tissue during hernia repair, available with titanium helical or absorbable polyglactin fasteners.',
    features: tackerFeatures,
    specifications: tackerSpecs,
    applications: tackerApps,
    productCodes: tackerCodes,
    skuMatrix: { codes: tackerCodes },
    imageUrls: [
      `${CF_BASE}/images/products/dolphin-sutures/mesh-tacker.webp`,
      `${CF_BASE}/images/products/dolphin-sutures/mesh-tacker.png`
    ],
    seoTitle: 'Mesh Tacker (Tacksure®) | Futura Medtech | Sriyas Healthcare',
    seoDescription: '5mm disposable hernia mesh tacker with titanium or absorbable PGLA helical fasteners for laparoscopic and open hernia repair. Distributed by Sriyas Healthcare.',
    displayOrder: 4,
    isActive: true
  };

  if (existingStaplers['mesh-tacker']) {
    const p = existingStaplers['mesh-tacker'];
    console.log(`   Updating existing ${p.name} (ID: ${p._id})...`);
    const res = await requestApi(`/admin/products/${p._id}`, 'PUT', tackerPayload, token);
    console.log(`   ✓ ${p.name} updated:`, res.status);
  } else {
    console.log('   Creating Mesh Tacker...');
    const res = await requestApi('/admin/products', 'POST', tackerPayload, token);
    console.log('   ✓ Mesh Tacker created:', res.status, res.data?.product?._id);
  }

  // 6. Verification
  console.log('\n6. Verifying Live State on Render...');
  const catVerify = await requestApi(`/categories?brand=futura-medtech`, 'GET');
  const cats = catVerify.data?.categories || [];
  const staplerCat = cats.find(c => c._id === STAPLERS_CAT_ID || c.slug === 'futura-medtech-skin-staplers-tackers');
  console.log('   Category hasSubcategories:', staplerCat?.hasSubcategories);
  console.log('   Category subcategories array length:', staplerCat?.subcategories?.length);

  const prodVerify = await requestApi(`/products?brand=futura-medtech&limit=250`, 'GET');
  const allProds = prodVerify.data?.products || [];
  const prodsInStaplers = allProds.filter(p => String(p.category?._id || p.category) === STAPLERS_CAT_ID);
  console.log(`   Products directly under Skin Staplers & Tackers: ${prodsInStaplers.length}`);
  prodsInStaplers.forEach(p => console.log(`   - [Order ${p.displayOrder}] ${p.name} (${p.slug}) | Subcat: ${p.subcategory?.name || p.subcategory || 'null'}`));

  console.log('\n=== LIVE RENDER SYNC COMPLETE ===');
}

main().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
