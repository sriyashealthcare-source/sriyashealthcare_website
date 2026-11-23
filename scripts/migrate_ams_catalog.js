/**
 * scripts/migrate_ams_catalog.js
 *
 * Implements the exact AMS catalog reordering and hierarchy:
 * I) MEDICAL ADHESIVES
 *    1. IFABOND
 *    2. LiquiBand-FIX8
 *    3. LiquiBand-Exceed
 *    4. LiquiBand-Optima
 * II) SUTURES
 *    1. Natural Absorbable Sutures
 *    2. Synthetic Absorbable Sutures
 *    3. Non-Absorbable Sutures
 *    4. Barbed Sutures - Knotless
 * III) SURGICAL KITS
 *    1. Surgical Kit - Obstetrics
 *    2. Surgical Kit - Hernia (formerly Sterilene Mesh)
 * IV) HAEMOSTASIS
 *    1. Titanium Clips
 * V) WOUND DRESSINGS
 *    1. Genta-Coll resorb
 * VI) TROCAR
 *    1. YelloPort® Elite — Reposable Laparoscopic Port Access System
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../server/data/sriyas_db.runtime.json');
const SEED_PATH = path.join(__dirname, 'catalogData.json');

// Backup files first
const timestamp = Date.now();
fs.copyFileSync(DB_PATH, DB_PATH.replace('.json', `.backup-${timestamp}.json`));
fs.copyFileSync(SEED_PATH, SEED_PATH.replace('.json', `.backup-${timestamp}.json`));
console.log(`[Backup] Saved backups with timestamp ${timestamp}`);

const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

// 1. Ensure Brand: Advanced Medical Solutions (AMS)
let amsBrand = (db.Brand || []).find(b => b.slug === 'ams');
if (!amsBrand) {
  amsBrand = {
    _id: "65e8a123bcdef0123456789a",
    createdAt: new Date().toISOString(),
    slug: "ams",
    name: "Advanced Medical Solutions",
    description: "Advanced Medical Solutions (AMS) is a world-leading developer and manufacturer of innovative tissue adhesives, surgical sutures, laparoscopic port access systems, and advanced wound care technologies.",
    logoUrl: "https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048218/sriyas-healthcare/brands/advanced-medical-solutions-logo.jpg",
    seoTitle: "Advanced Medical Solutions (AMS) Surgical & Wound Care | Sriyas Healthcare",
    seoDescription: "Explore the complete portfolio of Advanced Medical Solutions (AMS) distributed by Sriyas Healthcare in India: Medical Adhesives, Sutures, Surgical Kits, Haemostasis, Wound Dressings, and Trocar systems.",
    displayOrder: 1,
    isActive: true,
    updatedAt: new Date().toISOString()
  };
  db.Brand.unshift(amsBrand);
} else {
  amsBrand.name = "Advanced Medical Solutions";
  amsBrand.displayOrder = 1;
  amsBrand.isActive = true;
}

const AMS_BRAND_ID = amsBrand._id;

// 2. Define the 6 exact Roman numeral categories
const amsCategoryDefs = [
  {
    _id: "cat_ams_01_med_adhesives",
    name: "I) MEDICAL ADHESIVES",
    slug: "medical-adhesives",
    brand: AMS_BRAND_ID,
    displayOrder: 1,
    heroTitle: "I) MEDICAL ADHESIVES",
    description: "Advanced tissue and skin adhesives including IFABOND surgical cyanoacrylate and LiquiBand topical and hernia fixation systems.",
    seoTitle: "Medical Adhesives · IFABOND & LiquiBand | Sriyas Healthcare",
    seoDescription: "Explore advanced medical adhesives including IFABOND and LiquiBand from Advanced Medical Solutions distributed by Sriyas Healthcare.",
    heroGradient: "linear-gradient(135deg, #1b3a4b, #2c6e80)",
    isActive: true
  },
  {
    _id: "cat_ams_02_sutures",
    name: "II) SUTURES",
    slug: "sutures",
    brand: AMS_BRAND_ID,
    displayOrder: 2,
    heroTitle: "II) SUTURES",
    description: "Comprehensive portfolio of surgical sutures: Natural Absorbable, Synthetic Absorbable, Non-Absorbable, and FILBLOC Knotless Barbed Sutures.",
    seoTitle: "Surgical Sutures · Absorbable & Non-Absorbable | Sriyas Healthcare",
    seoDescription: "High-precision surgical sutures by Peters Surgical and AMS: Catgut Chromic, Polycol, Stericryl, Monocol, Sterilene, and FILBLOC barbed sutures.",
    heroGradient: "linear-gradient(135deg, #14213d, #284b63)",
    isActive: true
  },
  {
    _id: "cat_ams_03_surgical_kits",
    name: "III) SURGICAL KITS",
    slug: "surgical-kits",
    brand: AMS_BRAND_ID,
    displayOrder: 3,
    heroTitle: "III) SURGICAL KITS",
    description: "Pre-assembled specialized surgical kits: Surgical Kit - Obstetrics (C-Section) and Surgical Kit - Hernia repair mesh systems.",
    seoTitle: "Surgical Kits · Obstetrics & Hernia | Sriyas Healthcare",
    seoDescription: "Specialized pre-assembled surgical kits: Surgical Kit - Obstetrics and Surgical Kit - Hernia by Advanced Medical Solutions.",
    heroGradient: "linear-gradient(135deg, #1a2f42, #355070)",
    isActive: true
  },
  {
    _id: "cat_ams_04_haemostasis",
    name: "IV) HAEMOSTASIS",
    slug: "haemostasis",
    brand: AMS_BRAND_ID,
    displayOrder: 4,
    heroTitle: "IV) HAEMOSTASIS",
    description: "High-grade surgical haemostasis solutions including titanium hemostatic ligation clips for open and endoscopic procedures.",
    seoTitle: "Haemostasis · Titanium Hemostatic Clips | Sriyas Healthcare",
    seoDescription: "Precision titanium hemostatic ligation clips by Peters Surgical and AMS for secure vascular occlusion.",
    heroGradient: "linear-gradient(135deg, #1c2541, #3a506b)",
    isActive: true
  },
  {
    _id: "cat_ams_05_wound_dressings",
    name: "V) WOUND DRESSINGS",
    slug: "wound-dressings",
    brand: AMS_BRAND_ID,
    displayOrder: 5,
    heroTitle: "V) WOUND DRESSINGS",
    description: "Advanced collagen sponge and antibiotic wound dressing solutions including Genta-Coll resorb by Resorba / AMS.",
    seoTitle: "Wound Dressings · Genta-Coll resorb | Sriyas Healthcare",
    seoDescription: "Genta-Coll resorb antibiotic collagen sponge for surgical haemostasis and local infection prophylaxis.",
    heroGradient: "linear-gradient(135deg, #22223b, #4a4e69)",
    isActive: true
  },
  {
    _id: "cat_ams_06_trocar",
    name: "VI) TROCAR",
    slug: "trocar",
    brand: AMS_BRAND_ID,
    displayOrder: 6,
    heroTitle: "VI) TROCAR",
    description: "YelloPort® Elite — Reposable Laparoscopic Port Access System by Microline Surgical. Universal Seal (5-12mm) and premium reusable cannula & obturators.",
    seoTitle: "Trocar · YelloPort® Elite Laparoscopic Port Access System | Sriyas Healthcare",
    seoDescription: "YelloPort® Elite reposable laparoscopic trocar port access system with universal 5-12mm seal and reusable cannula and obturators.",
    heroGradient: "linear-gradient(135deg, #0d1b2a, #1b263b)",
    isActive: true
  }
];

// Replace or upsert AMS categories in db.Category
for (const catDef of amsCategoryDefs) {
  const existingIndex = db.Category.findIndex(c => c.slug === catDef.slug || c._id === catDef._id);
  if (existingIndex >= 0) {
    db.Category[existingIndex] = { ...db.Category[existingIndex], ...catDef, updatedAt: new Date().toISOString() };
  } else {
    db.Category.push({ ...catDef, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
}

// 3. Process Products

// A. CATEGORY I: MEDICAL ADHESIVES
// 1. IFABOND (ifabond)
let ifabond = db.Product.find(p => p.slug === 'ifabond');
if (ifabond) {
  ifabond.category = "cat_ams_01_med_adhesives";
  ifabond.brand = AMS_BRAND_ID;
  ifabond.displayOrder = 1;
  ifabond.cardCategory = "I) MEDICAL ADHESIVES";
  ifabond.detailCategory = "I) MEDICAL ADHESIVES · Surgical Adhesive";
}

// 2. LiquiBand-FIX8 (liquiband-fix8)
let fix8 = db.Product.find(p => p.slug === 'liquiband-fix8');
if (fix8) {
  fix8.category = "cat_ams_01_med_adhesives";
  fix8.brand = AMS_BRAND_ID;
  fix8.displayOrder = 2;
  fix8.cardCategory = "I) MEDICAL ADHESIVES";
  fix8.detailCategory = "I) MEDICAL ADHESIVES · Hernia Mesh Fixation";
}

// 3. LiquiBand-Exceed (liquiband-exceed)
let exceed = db.Product.find(p => p.slug === 'liquiband-exceed');
if (exceed) {
  exceed.category = "cat_ams_01_med_adhesives";
  exceed.brand = AMS_BRAND_ID;
  exceed.displayOrder = 3;
  exceed.cardCategory = "I) MEDICAL ADHESIVES";
  exceed.detailCategory = "I) MEDICAL ADHESIVES · Topical Skin Adhesive";
}

// 4. LiquiBand-Optima (liquiband-optima)
let optima = db.Product.find(p => p.slug === 'liquiband-optima');
if (optima) {
  optima.category = "cat_ams_01_med_adhesives";
  optima.brand = AMS_BRAND_ID;
  optima.displayOrder = 4;
  optima.cardCategory = "I) MEDICAL ADHESIVES";
  optima.detailCategory = "I) MEDICAL ADHESIVES · Topical Skin Adhesive";
}

// B. CATEGORY II: SUTURES
// 1. Natural Absorbable Sutures (catgut-chromic)
let catgut = db.Product.find(p => p.slug === 'catgut-chromic');
if (catgut) {
  catgut.category = "cat_ams_02_sutures";
  catgut.brand = AMS_BRAND_ID;
  catgut.displayOrder = 10;
  catgut.cardCategory = "II) SUTURES · Natural Absorbable";
  catgut.detailCategory = "II) SUTURES · Natural Absorbable Sutures";
}

// 2. Synthetic Absorbable Sutures (i-col, i-col-fast, polycol, stericryl, monocol)
const syntheticSlugs = ['i-col', 'i-col-fast', 'polycol', 'stericryl', 'monocol'];
syntheticSlugs.forEach((slug, idx) => {
  const p = db.Product.find(prod => prod.slug === slug);
  if (p) {
    p.category = "cat_ams_02_sutures";
    p.brand = AMS_BRAND_ID;
    p.displayOrder = 20 + idx;
    p.cardCategory = "II) SUTURES · Synthetic Absorbable";
    p.detailCategory = "II) SUTURES · Synthetic Absorbable Sutures";
  }
});

// 3. Non-Absorbable Sutures (sterisil, sterilon, sterilene-suture, steribon)
const nonAbsorbSlugs = ['sterisil', 'sterilon', 'sterilene-suture', 'steribon'];
nonAbsorbSlugs.forEach((slug, idx) => {
  const p = db.Product.find(prod => prod.slug === slug);
  if (p) {
    p.category = "cat_ams_02_sutures";
    p.brand = AMS_BRAND_ID;
    p.displayOrder = 30 + idx;
    p.cardCategory = "II) SUTURES · Non-Absorbable";
    p.detailCategory = "II) SUTURES · Non-Absorbable Sutures";
  }
});

// 4. Barbed Sutures - Knotless (filbloc-90, filbloc, filbloc-permanent)
const barbedSlugs = ['filbloc-90', 'filbloc', 'filbloc-permanent'];
barbedSlugs.forEach((slug, idx) => {
  const p = db.Product.find(prod => prod.slug === slug);
  if (p) {
    p.category = "cat_ams_02_sutures";
    p.brand = AMS_BRAND_ID;
    p.displayOrder = 40 + idx;
    p.cardCategory = "II) SUTURES · Barbed Sutures - Knotless";
    p.detailCategory = "II) SUTURES · Barbed Sutures - Knotless";
  }
});

// C. CATEGORY III: SURGICAL KITS
// 1. Surgical Kit - Obstetrics (peters-c-section-kit -> surgical-kit-obstetrics)
let csec = db.Product.find(p => p.slug === 'peters-c-section-kit' || p.slug === 'surgical-kit-obstetrics');
if (csec) {
  csec.name = "Surgical Kit - Obstetrics";
  csec.slug = "surgical-kit-obstetrics";
  csec.legacyId = "surgical_kit_obstetrics";
  csec.category = "cat_ams_03_surgical_kits";
  csec.brand = AMS_BRAND_ID;
  csec.displayOrder = 1;
  csec.cardCategory = "III) SURGICAL KITS";
  csec.detailCategory = "III) SURGICAL KITS · Obstetrics · Caesarean Section";
  csec.description = "Surgical Kit - Obstetrics is a complete pre-assembled sterile procedure kit specifically designed for Caesarean Section deliveries. Contains Polycol™ and Stericryl™ sutures engineered to provide the optimal suturing solution across all anatomical layers from uterus to subcuticular skin.";
}

// 2. Surgical Kit - Hernia (sterilene-mesh -> surgical-kit-hernia)
// ACTION REQUIRED: Locate existing "Sterilene Mesh", keep existing layout, styling, and descriptive content structure, replace title, references, branding to "Surgical Kit - Hernia". Ensure no old "Sterilene Mesh" entries remain as standalone.
let mesh = db.Product.find(p => p.slug === 'sterilene-mesh' || p.slug === 'surgical-kit-hernia');
if (mesh) {
  mesh.name = "Surgical Kit - Hernia";
  mesh.slug = "surgical-kit-hernia";
  mesh.legacyId = "surgical_kit_hernia";
  mesh.category = "cat_ams_03_surgical_kits";
  mesh.brand = AMS_BRAND_ID;
  mesh.displayOrder = 2;
  mesh.cardCategory = "III) SURGICAL KITS";
  mesh.detailCategory = "III) SURGICAL KITS · Hernia Repair System";
  mesh.shortSpecification = "Light / Regular / Heavy variants\nOpen & Laparoscopic Hernia Kit";
  mesh.description = "Surgical Kit - Hernia provides a complete flat knitted polypropylene mesh and fixation system for open and laparoscopic hernia repairs. Available in Light, Regular and Heavy variants to suit the specific clinical requirements of inguinal, ventral, umbilical, and incisional hernia procedures.";
  mesh.features = [
    "Surgical Kit - Hernia Light: 56% lighter than regular mesh — better compatibility and fast tissue integration",
    "Surgical Kit - Hernia Regular: Good shape memory and perfect fitment against cavity wall",
    "Surgical Kit - Hernia Heavy: Highest tensile and burst strength — ideal for open hernia repair",
    "Monofilament polypropylene — excellent biological inertness",
    "Laser cutting for precise, fray-free edges",
    "Complete Hernia Kit and Hernia Kit Plus procedural configurations available"
  ];
  mesh.applications = [
    "Laparoscopic inguinal hernia repair (TAPP / TEP)",
    "Open inguinal hernia repair (Lichtenstein technique)",
    "Incisional hernia repair",
    "Ventral hernia repair",
    "Umbilical hernia repair",
    "Complete procedural hernia repair kit"
  ];
}

// D. CATEGORY IV: HAEMOSTASIS
// 1. Titanium Clips (titanium-hemostatic-clips)
let clips = db.Product.find(p => p.slug === 'titanium-hemostatic-clips');
if (clips) {
  clips.name = "Titanium Clips";
  clips.category = "cat_ams_04_haemostasis";
  clips.brand = AMS_BRAND_ID;
  clips.displayOrder = 1;
  clips.cardCategory = "IV) HAEMOSTASIS";
  clips.detailCategory = "IV) HAEMOSTASIS · Titanium Hemostatic Ligation Clips";
}

// E. CATEGORY V: WOUND DRESSINGS
// 1. Genta-Coll resorb (genta-coll-resorb)
let gentacoll = db.Product.find(p => p.slug === 'genta-coll-resorb');
if (gentacoll) {
  gentacoll.name = "Genta-Coll resorb";
  gentacoll.category = "cat_ams_05_wound_dressings";
  gentacoll.brand = AMS_BRAND_ID;
  gentacoll.displayOrder = 1;
  gentacoll.cardCategory = "V) WOUND DRESSINGS";
  gentacoll.detailCategory = "V) WOUND DRESSINGS · Antibiotic Collagen Sponge";
}

// F. CATEGORY VI: TROCAR
// 1. YelloPort® Elite — Reposable Laparoscopic Port Access System (yelloport-elite)
let yelloport = db.Product.find(p => p.slug === 'yelloport-elite');
const yelloportData = {
  _id: "prod_ams_yelloport_elite_01",
  createdAt: new Date().toISOString(),
  slug: "yelloport-elite",
  legacyId: "yelloport_elite",
  name: "YelloPort® Elite — Reposable Laparoscopic Port Access System",
  brand: AMS_BRAND_ID,
  category: "cat_ams_06_trocar",
  cardCategory: "VI) TROCAR",
  detailCategory: "VI) TROCAR · Reposable Laparoscopic Port Access System",
  shortSpecification: "Universal Seal (5–12mm) · Reposable Cannula & Obturators",
  description: "YelloPort® Elite is a reposable laparoscopic port access system by Microline Surgical (an Advanced Medical Solutions company). Featuring a universal seal accommodating 5–12mm instruments without separate reducers, YelloPort® Elite combines single-use universal seals with high-grade reusable cannulas and obturators to deliver maximum clinical precision, cost-effectiveness, and low-profile ergonomics.",
  images: [
    {
      url: "/assets/products/yelloport_elite-1.png",
      publicId: "sriyas-healthcare/products/ams/yelloport_elite-1",
      isPrimary: true,
      format: "png"
    }
  ],
  cardBg: "",
  features: [
    "Accommodates 5–12mm instruments with zero reducer caps required",
    "Reposable, cost-effective port access system combining single-use seals with reusable cannulas",
    "Lightweight and low-profile design minimizes abdominal footprint and prevents instrument clash",
    "Micro-ribbed cannula design ensures excellent abdominal wall retention during instrument exchanges",
    "Available in multiple working lengths (75mm, 105mm, 150mm) and diameters (10mm, 12mm)",
    "Four obturator styles available: Pencil Point, Blunt, Dilating Pyramidal, and Locking Shielded",
    "Hasson adaptor and dedicated seals available for open cut-down access"
  ],
  specifications: [
    { name: "Product Line", value: "YelloPort® Elite — Reposable Laparoscopic Port Access System" },
    { name: "Subtitle / Tagline", value: "Universal Seal | Reposable Product" },
    { name: "Instrument Range", value: "5mm to 12mm universal instrument entry" },
    { name: "Cannula Style", value: "Micro-Ribbed Reusable (10mm and 12mm; 75mm, 105mm, 150mm)" },
    { name: "Obturator Styles", value: "Pencil Point (Style 03), Blunt (Style 04), Dilating Pyramidal (Style 07), Locking Shielded (Style 09)" },
    { name: "Universal Seal", value: "Single-Use 5–12mm (Code: EA512US, Qty: 5)" },
    { name: "Hasson Options", value: "10mm (EA10NH + EA10HS05) & 12mm (EA12NH + EA12HS05)" },
    { name: "Manufacturer", value: "Microline Surgical / Advanced Medical Solutions (AMS)" }
  ],
  applications: [
    "Laparoscopic general surgery (cholecystectomy, appendectomy, hernia repair)",
    "Laparoscopic gynaecology (hysterectomy, ovarian cystectomy, diagnostic laparoscopy)",
    "Laparoscopic bariatric surgery (150mm extended cannula options)",
    "Laparoscopic urology (nephrectomy, prostatectomy)",
    "Open cut-down Hasson primary access"
  ],
  // Full SKU Matrix
  skuMatrix: {
    universalSeal: [
      { component: "Single-Use Universal Seal", diameter: "5–12mm", qty: 5, productCode: "EA512US" }
    ],
    cannula: [
      { diameter: "10mm", workingLength: "75mm", productCode: "EC1007520" },
      { diameter: "10mm", workingLength: "105mm", productCode: "EC1010520" },
      { diameter: "10mm", workingLength: "150mm", productCode: "EC1015020" },
      { diameter: "12mm", workingLength: "75mm", productCode: "EC1207520" },
      { diameter: "12mm", workingLength: "105mm", productCode: "EC1210520" },
      { diameter: "12mm", workingLength: "150mm", productCode: "EC1215020" }
    ],
    obturator: [
      { style: "Pencil Point (Style 03)", diameter: "10mm", length75: "ET1007503", length105: "ET1010503", length150: "ET1015003" },
      { style: "Pencil Point (Style 03)", diameter: "12mm", length75: "ET1207503", length105: "ET1210503", length150: "ET1215003" },
      { style: "Blunt (Style 04)", diameter: "10mm", length75: "ET1007504", length105: "ET1010504", length150: "ET1015004" },
      { style: "Blunt (Style 04)", diameter: "12mm", length75: "ET1207504", length105: "ET1210504", length150: "ET1215004" },
      { style: "Dilating Pyramidal (Style 07)", diameter: "10mm", length75: "ET1007507", length105: "ET1010507", length150: "ET1015007" },
      { style: "Dilating Pyramidal (Style 07)", diameter: "12mm", length75: "ET1207507", length105: "ET1210507", length150: "ET1215007" },
      { style: "Locking Shielded (Style 09)", diameter: "10mm", length75: "ET1007509", length105: "ET1010509", length150: "ET1015009" },
      { style: "Locking Shielded (Style 09)", diameter: "12mm", length75: "ET1207509", length105: "ET1210509", length150: "ET1215009" }
    ],
    hasson: [
      { component: "10mm Hasson Adaptor", diameter: "10mm", adaptorCode: "EA10NH", sealsQty5Code: "EA10HS05" },
      { component: "12mm Hasson Adaptor", diameter: "12mm", adaptorCode: "EA12NH", sealsQty5Code: "EA12HS05" }
    ]
  },
  brochure: { url: "", publicId: "", filename: "" },
  isActive: true,
  displayOrder: 1,
  deletedAt: null,
  updatedAt: new Date().toISOString()
};

if (yelloport) {
  Object.assign(yelloport, yelloportData);
} else {
  db.Product.push(yelloportData);
}

// Ensure no old sterilene-mesh exists as standalone
db.Product = db.Product.filter(p => !(p.slug === 'sterilene-mesh' && p.name.includes('Sterilene')));

// Clean test/sample products if any
db.Product = db.Product.filter(p => !p.slug.includes('test-cloudinary') && !p.slug.includes('audit-prod'));

// Write updated database
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
console.log(`[Database] Updated ${DB_PATH} successfully (${db.Category.length} categories, ${db.Product.length} products).`);

// Synchronize scripts/catalogData.json
const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
seed.categories = db.Category;
seed.products = db.Product;
if (!seed.brands.some(b => b.slug === 'ams')) {
  seed.brands.unshift(amsBrand);
}
fs.writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2), 'utf8');
console.log(`[Seed] Updated ${SEED_PATH} successfully.`);
