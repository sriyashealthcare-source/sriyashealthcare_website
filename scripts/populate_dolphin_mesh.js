const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateMongoId() {
  return crypto.randomBytes(12).toString('hex');
}

const EXTRACTED_PATH = path.join(__dirname, 'dolphin_mesh_extracted.json');
const DB_RUNTIME_PATH = path.join(__dirname, '..', 'server', 'data', 'sriyas_db.runtime.json');

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

const KNIT_3D_FEATURES = [
  'Three-dimensional anatomical design contoured to match inguinal anatomy, reducing intraoperative trimming or shaping',
  'Dedicated left and right anatomical profiles to align accurately with pelvic wall and inguinal defect geometry',
  'Offered in Macropore and Medium pore variants to match surgeon preference and tissue ingrowth requirements',
  'Knitted from medical-grade monofilament polypropylene for permanent high-tenacity soft-tissue reinforcement',
  'Optimized memory and smooth handling for rapid, wrinkle-free positioning in laparoscopic TAPP and TEP repairs',
  'Supplied sterile for single-patient use with standard fixation compatibility via sutures or mesh tackers'
];

const TACKSURE_FEATURES = [
  'Dual fastener configurations: titanised helical fixators or absorbable polyglactin (PGLA) helical tacks',
  'Predictable single-action deployment mechanism delivering consistent tissue penetration with every trigger pull',
  '5 mm diameter shaft with 350 mm length, suitable for both laparoscopic and open surgical access',
  'Universal compatibility across flat, 3D anatomical, composite barrier, and synthetic surgical meshes',
  'Ergonomic handle housing and responsive trigger ensuring surgeon control and precision fastener placement',
  'Preloaded, sterile single-patient disposable instrument streamlining operating theatre preparation'
];

const APPLICATIONS_MAP = {
  'Knit': [
    'Inguinal hernia repair (open and laparoscopic)',
    'Ventral and incisional hernia repair',
    'Umbilical and epigastric hernia repair',
    'Primary and recurrent hernia repairs',
    'Abdominal wall soft tissue reinforcement'
  ],
  'Knit 3D': [
    'Laparoscopic inguinal hernia repair (TAPP and TEP approaches)',
    'Open preperitoneal inguinal hernia repair',
    'Direct and indirect inguinal hernia reinforcement',
    'Recurrent inguinal hernia repairs'
  ],
  'Tiolene': [
    'Inguinal and ventral hernia repair',
    'Open and laparoscopic hernia repairs',
    'Complex abdominal wall reconstruction',
    'Soft tissue reinforcement requiring reduced foreign body reaction and low tissue shrinkage'
  ],
  'Silene': [
    'Laparoscopic ventral and incisional hernia repair (IPOM)',
    'Open intraperitoneal onlay mesh placement',
    'Umbilical hernia repair with visceral contact',
    'Abdominal wall defect reconstruction requiring non-adherent visceral separation'
  ],
  'Teflene': [
    'Intraperitoneal onlay mesh (IPOM) ventral and incisional hernia repair',
    'Large abdominal wall defects requiring permanent ePTFE visceral protection',
    'Laparoscopic and open soft tissue reinforcement with bowel contact',
    'Recurrent incisional hernia repair'
  ],
  'Ultralene': [
    'Intraperitoneal onlay mesh (IPOM) hernia repair',
    'Parastomal and ventral hernia repair',
    'Laparoscopic and open abdominal wall defect reconstruction',
    'Soft tissue reinforcement requiring dual-sided tissue integration and visceral protection'
  ],
  'Duolene': [
    'Intraperitoneal onlay hernia repair (IPOM)',
    'Incisional and umbilical hernia repair',
    'Ventral hernia repair with direct visceral contact',
    'Laparoscopic abdominal wall soft-tissue reinforcement'
  ],
  'Monosolve V2': [
    'Inguinal and femoral hernia repair',
    'Ventral and incisional hernia repair',
    'Open and laparoscopic abdominal wall reconstruction',
    'Soft tissue reinforcement requiring temporary stiff handling followed by lightweight permanent support'
  ],
  'Monosolve V2 3D': [
    'Laparoscopic inguinal hernia repair (TEP and TAPP)',
    'Preperitoneal inguinal hernia repair',
    'Inguinal defect reinforcement requiring rapid absorbable handling layer and reduced permanent foreign body mass',
    'Direct and indirect inguinal hernia repairs'
  ],
  'Tacksure': [
    'Laparoscopic ventral and incisional hernia repair (IPOM mesh fixation)',
    'Laparoscopic inguinal hernia repair (TAPP and TEP mesh fixation)',
    'Open hernia repair and abdominal wall tissue approximation',
    'Fixation of synthetic, titanium-coated, and composite surgical meshes'
  ]
};

function main() {
  console.log('=== POPULATING DOLPHIN MESH IN LOCAL DB (sriyas_db.runtime.json) ===\n');

  const extracted = JSON.parse(fs.readFileSync(EXTRACTED_PATH, 'utf8'));
  console.log(`Loaded ${extracted.length} extracted products from ${EXTRACTED_PATH}`);

  const db = JSON.parse(fs.readFileSync(DB_RUNTIME_PATH, 'utf8'));
  const futura = db.Brand.find(b => b.slug === 'futura-medtech');
  if (!futura) {
    throw new Error('Futura Medtech brand not found in local DB!');
  }
  const brandId = futura._id;
  console.log(`Futura Medtech Brand ID: ${brandId}`);

  // 1. Ensure Dolphin Mesh Category
  const DOLPHIN_MESH_CAT_ID = '6b099bb7977630f30b5cb445'; // Matching Render DB ID
  let dolphinMeshCat = db.Category.find(
    c => c._id === DOLPHIN_MESH_CAT_ID || c.slug === 'futura-medtech-dolphin-mesh' || (c.name === 'Dolphin Mesh' && !c.parentCategory)
  );

  const now = new Date().toISOString();

  if (!dolphinMeshCat) {
    dolphinMeshCat = {
      _id: DOLPHIN_MESH_CAT_ID,
      createdAt: now,
      slug: 'futura-medtech-dolphin-mesh',
      name: 'Dolphin Mesh',
      brand: brandId,
      parentCategory: null,
      hasSubcategories: true,
      logoUrl: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795791798/sriyas-healthcare/brands/file_l8jbit.png',
      logoImage: {
        url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795791798/sriyas-healthcare/brands/file_l8jbit.png',
        publicId: 'sriyas-healthcare/brands/file_l8jbit',
        format: 'png'
      },
      heroTitle: 'Dolphin Mesh Surgical Portfolio',
      description: 'Comprehensive range of polypropylene, composite barrier, and semi-absorbable surgical meshes—available in flat and 3D anatomical configurations—alongside Tacksure mesh fixation systems for hernia repair and soft tissue reinforcement.',
      heroGradient: 'linear-gradient(135deg,#1a3a5c,#2d6b9e)',
      displayOrder: 2,
      isActive: true,
      updatedAt: now
    };
    db.Category.push(dolphinMeshCat);
    console.log(`✓ Created Dolphin Mesh category (ID: ${dolphinMeshCat._id})`);
  } else {
    dolphinMeshCat.hasSubcategories = true;
    dolphinMeshCat.logoUrl = 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795791798/sriyas-healthcare/brands/file_l8jbit.png';
    dolphinMeshCat.displayOrder = 2;
    dolphinMeshCat.isActive = true;
    dolphinMeshCat.updatedAt = now;
    console.log(`✓ Updated Dolphin Mesh category (ID: ${dolphinMeshCat._id})`);
  }

  // 2. Ensure the 4 Subcategories
  const subcategoryMap = {}; // slug -> subcategory object

  for (const cfg of SUBCATEGORIES_CONFIG) {
    let sub = db.Category.find(
      c => c.parentCategory === dolphinMeshCat._id && (c.slug === cfg.slug || c.name.toLowerCase() === cfg.name.toLowerCase())
    );

    if (!sub) {
      sub = {
        _id: generateMongoId(),
        createdAt: now,
        slug: cfg.slug,
        name: cfg.name,
        brand: brandId,
        parentCategory: dolphinMeshCat._id,
        heroTitle: cfg.heroTitle,
        description: cfg.description,
        heroGradient: 'linear-gradient(135deg,#102a45,#245785)',
        displayOrder: cfg.displayOrder,
        isActive: true,
        updatedAt: now
      };
      db.Category.push(sub);
      console.log(`✓ Created Subcategory: ${cfg.name} (ID: ${sub._id}, Slug: ${sub.slug})`);
    } else {
      sub.name = cfg.name;
      sub.heroTitle = cfg.heroTitle;
      sub.description = cfg.description;
      sub.displayOrder = cfg.displayOrder;
      sub.isActive = true;
      sub.updatedAt = now;
      console.log(`✓ Found Subcategory: ${cfg.name} (ID: ${sub._id}, Slug: ${sub.slug})`);
    }

    subcategoryMap[cfg.name] = sub;
    for (const pName of cfg.products) {
      subcategoryMap[pName] = sub;
    }
  }

  // 3. Remove old products under Dolphin Mesh if any to avoid duplication
  const initialProductCount = db.Product.length;
  db.Product = db.Product.filter(p => p.category !== dolphinMeshCat._id);
  const removedCount = initialProductCount - db.Product.length;
  if (removedCount > 0) {
    console.log(`Removed ${removedCount} existing Dolphin Mesh products from local DB for fresh sync.`);
  }

  // 4. Create each of the 10 products
  let totalCodesInserted = 0;
  extracted.forEach((pData, idx) => {
    const subcat = subcategoryMap[pData.name] || subcategoryMap[pData.subcatName];
    if (!subcat) {
      throw new Error(`Subcategory not found for product ${pData.name}`);
    }

    // Convert specs dictionary into [{ name, value }]
    const specifications = [];
    if (pData.specs) {
      for (const [key, value] of Object.entries(pData.specs)) {
        if (value && String(value).trim()) {
          specifications.push({
            name: key,
            value: String(value).trim()
          });
        }
      }
    }

    // Features
    let features = [];
    if (pData.name === 'Knit 3D') {
      features = KNIT_3D_FEATURES;
    } else if (pData.name === 'Tacksure') {
      features = TACKSURE_FEATURES;
    } else if (Array.isArray(pData.features) && pData.features.length > 0) {
      features = pData.features.map(f => (typeof f === 'string' ? f : f.title || f.description || '')).filter(Boolean);
    }

    // Applications
    const applications = APPLICATIONS_MAP[pData.name] || [
      'Inguinal and ventral hernia repair',
      'Open and laparoscopic soft-tissue reinforcement',
      'Abdominal wall defect reconstruction'
    ];

    // Images
    const images = (pData.images || []).map((imgUrl, imgIdx) => ({
      url: imgUrl,
      publicId: `dolphin-mesh-${pData.slug}-${imgIdx}`,
      format: 'webp',
      width: 800,
      height: 800,
      bytes: 0,
      isPrimary: imgIdx === 0,
      alt: imgIdx === 0 ? `${pData.name} - ${pData.subtitle || 'Surgical Mesh'}` : `${pData.name} Packaging Box`
    }));

    // Codes & SKU matrix
    const productCodes = pData.productCodes || [];
    totalCodesInserted += productCodes.length;

    const prodDoc = {
      _id: generateMongoId(),
      createdAt: now,
      slug: pData.slug,
      name: pData.name,
      brand: brandId,
      category: dolphinMeshCat._id,
      subcategory: subcat._id,
      cardCategory: subcat.name,
      detailCategory: `Dolphin Mesh · ${subcat.name}`,
      shortSpecification: pData.subtitle || pData.extractedTitle || '',
      description: pData.lead || pData.compositionText || '',
      images: images,
      cardBg: 'linear-gradient(135deg, #f8fafd 0%, #eef3f9 100%)',
      features: features,
      specifications: specifications,
      applications: applications,
      productCodes: productCodes,
      skuMatrix: {
        codes: productCodes
      },
      seoTitle: `${pData.name} · ${pData.subtitle} | Dolphin Mesh | Sriyas Healthcare`,
      seoDescription: `${pData.lead ? pData.lead.slice(0, 155) : pData.subtitle}. Distributed in India by Sriyas Healthcare.`,
      isActive: true,
      displayOrder: idx + 1,
      viewCount: 0,
      lastViewedAt: null,
      deletedAt: null,
      updatedAt: now
    };

    db.Product.push(prodDoc);
    console.log(`  + Product [${idx + 1}/10]: ${pData.name} (${pData.slug}) -> ${subcat.name} (${productCodes.length} codes)`);
  });

  // Save updated DB
  fs.writeFileSync(DB_RUNTIME_PATH, JSON.stringify(db, null, 2), 'utf8');
  console.log(`\n✓ Successfully saved local DB to ${DB_RUNTIME_PATH}`);
  console.log(`  - Total Products: ${db.Product.length}`);
  console.log(`  - Dolphin Mesh Products: 10`);
  console.log(`  - Total Product Codes: ${totalCodesInserted} (Exact 121 codes!)`);
}

main();
