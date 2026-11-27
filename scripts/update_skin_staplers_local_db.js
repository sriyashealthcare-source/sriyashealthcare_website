const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve('server/data/sriyas_db.runtime.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const FUTURA_ID = '6905ccab8b0e8504aa150ecb';
const STAPLERS_CAT_ID = '6b09af48905f6b6d6e0faa1b';
const now = new Date().toISOString();

console.log('=== UPDATING LOCAL DB FOR SKIN STAPLERS & TACKERS ===\n');

// 1. Ensure Main Category: Skin Staplers & Tackers
let mainCat = db.Category.find(c => c._id === STAPLERS_CAT_ID || c.slug === 'futura-medtech-skin-staplers-tackers');
if (!mainCat) {
  mainCat = {
    _id: STAPLERS_CAT_ID,
    createdAt: now,
    slug: 'futura-medtech-skin-staplers-tackers',
    name: 'Skin Staplers & Tackers',
    brand: FUTURA_ID,
    parentCategory: null,
    hasSubcategories: false,
    logoUrl: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795796807/sriyas-healthcare/brands/file_hk4l3u.png',
    logoImage: {
      url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795796807/sriyas-healthcare/brands/file_hk4l3u.png',
      publicId: 'sriyas-healthcare/brands/file_hk4l3u',
      format: 'png'
    },
    heroTitle: 'Skin Staplers & Tackers',
    description: 'Disposable and reusable surgical skin staplers, ergonomic staple removers, and helical mesh tackers engineered for rapid wound closure and secure prosthetic mesh fixation in open and laparoscopic procedures.',
    heroGradient: 'linear-gradient(135deg,#1a3a5c,#2d6b9e)',
    displayOrder: 3,
    isActive: true,
    updatedAt: now
  };
  db.Category.push(mainCat);
  console.log('✓ Created main category: Skin Staplers & Tackers (ID:', STAPLERS_CAT_ID, ')');
} else {
  mainCat._id = STAPLERS_CAT_ID;
  mainCat.parentCategory = null;
  mainCat.hasSubcategories = false;
  mainCat.logoUrl = 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795796807/sriyas-healthcare/brands/file_hk4l3u.png';
  mainCat.displayOrder = 3;
  mainCat.isActive = true;
  mainCat.updatedAt = now;
  console.log('✓ Updated main category: Skin Staplers & Tackers (hasSubcategories = false)');
}

// 2. Remove redundant child subcategory records under Skin Staplers & Tackers
const beforeCount = db.Category.length;
db.Category = db.Category.filter(c => {
  // Remove if child of mainCat
  if (c.parentCategory === STAPLERS_CAT_ID) return false;
  // Also remove old subcategory f106e02a551101162a208c46 if it was named Skin Staplers & Tackers
  if (c._id === 'f106e02a551101162a208c46' || c._id === '6b071debff5454ef1b769239') return false;
  return true;
});
console.log(`✓ Removed ${beforeCount - db.Category.length} redundant subcategory records.`);

// 3. Move existing 3 stapler products directly under main category
const staplerSlugs = ['reusable-skin-stapler', 'skin-staple-remover', 'skin-stapler'];
let displayOrderIdx = 1;

staplerSlugs.forEach(slug => {
  const p = db.Product.find(x => x.slug === slug);
  if (p) {
    p.category = STAPLERS_CAT_ID;
    p.subcategory = null;
    p.cardCategory = 'Skin Staplers & Tackers';
    p.detailCategory = 'Futura Medtech · Skin Staplers & Tackers';
    p.displayOrder = displayOrderIdx++;
    p.isActive = true;
    p.updatedAt = now;
    console.log(`✓ Attached product directly: ${p.name} (order: ${p.displayOrder}, subcategory: null)`);
  } else {
    console.warn(`⚠ Product not found: ${slug}`);
  }
});

// 4. Update / Attach Mesh Tacker directly under main category
let tacker = db.Product.find(p => p.slug === 'mesh-tacker');
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

const tackerImages = [
  {
    url: '/images/products/dolphin-sutures/mesh-tacker.webp',
    publicId: 'dolphin-sutures-mesh-tacker',
    format: 'webp',
    isPrimary: true,
    alt: 'Mesh Tacker - Tacksure'
  },
  {
    url: '/images/products/dolphin-sutures/mesh-tacker.png',
    publicId: 'dolphin-sutures-mesh-tacker-pack',
    format: 'png',
    isPrimary: false,
    alt: 'Tacksure Mesh Tacker Pack'
  }
];

if (!tacker) {
  tacker = {
    _id: '6b071e51ff5454ef1b7693f9',
    createdAt: now,
    slug: 'mesh-tacker',
    name: 'Mesh Tacker',
    brand: FUTURA_ID,
    category: STAPLERS_CAT_ID,
    subcategory: null,
    cardCategory: 'Skin Staplers & Tackers',
    detailCategory: 'Futura Medtech · Skin Staplers & Tackers',
    shortSpecification: '5mm Disposable Hernia Mesh Tacker with Titanium / PGLA Fasteners',
    description: 'TACKSURE Mesh Tacker is a sterile, single-use laparoscopic and open-surgery device for fixing surgical mesh to soft tissue during hernia repair, available with titanium helical or absorbable polyglactin fasteners.',
    images: tackerImages,
    features: tackerFeatures,
    specifications: tackerSpecs,
    applications: tackerApps,
    productCodes: tackerCodes,
    skuMatrix: { codes: tackerCodes },
    displayOrder: 4,
    isActive: true,
    updatedAt: now
  };
  db.Product.push(tacker);
  console.log('✓ Created Mesh Tacker product directly under Skin Staplers & Tackers');
} else {
  tacker.name = 'Mesh Tacker';
  tacker.category = STAPLERS_CAT_ID;
  tacker.subcategory = null;
  tacker.cardCategory = 'Skin Staplers & Tackers';
  tacker.detailCategory = 'Futura Medtech · Skin Staplers & Tackers';
  tacker.shortSpecification = '5mm Disposable Hernia Mesh Tacker with Titanium / PGLA Fasteners';
  tacker.description = 'TACKSURE Mesh Tacker is a sterile, single-use laparoscopic and open-surgery device for fixing surgical mesh to soft tissue during hernia repair, available with titanium helical or absorbable polyglactin fasteners.';
  tacker.images = tackerImages;
  tacker.features = tackerFeatures;
  tacker.specifications = tackerSpecs;
  tacker.applications = tackerApps;
  tacker.productCodes = tackerCodes;
  tacker.skuMatrix = { codes: tackerCodes };
  tacker.displayOrder = 4;
  tacker.isActive = true;
  tacker.updatedAt = now;
  console.log('✓ Updated Mesh Tacker product directly under Skin Staplers & Tackers (order: 4, subcategory: null)');
}

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
console.log('\n✓ Successfully saved local DB!');

// Verification of count under Skin Staplers & Tackers
const finalProds = db.Product.filter(p => p.category === STAPLERS_CAT_ID && p.isActive !== false);
console.log(`\nVerified: ${finalProds.length} products directly under Skin Staplers & Tackers:`);
finalProds.forEach(p => console.log(`  - [${p.displayOrder}] ${p.name} (${p.slug}) | Subcat: ${p.subcategory}`));
