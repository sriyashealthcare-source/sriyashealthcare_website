const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

function generateMongoId() {
  return crypto.randomBytes(12).toString('hex');
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 20000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, url).toString();
        }
        return resolve(fetchUrl(redirectUrl));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout ' + url));
    });
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 25000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, url).toString();
        }
        return resolve(downloadFile(redirectUrl, destPath));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(destPath);
      });
      fileStream.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout downloading ' + url));
    });
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

function determineSubcategorySlug(p) {
  const b = (p.breadcrumbs[2] || '').toLowerCase();
  const url = p.url.toLowerCase();

  if (b.includes('absorbable') && !b.includes('non-absorbable') && !b.includes('specialty')) {
    return 'absorbable-sutures';
  }
  if (b.includes('non-absorbable')) {
    return 'non-absorbable-sutures';
  }
  if (b.includes('specialty') || b.includes('antibacterial') || url.includes('barb') || url.includes('plus') || url.includes('mono-ab')) {
    return 'specialty-sutures';
  }
  if (b.includes('mesh')) {
    return 'surgical-mesh';
  }
  if (b.includes('stapler') || b.includes('tacker') || url.includes('stapler') || url.includes('remover') || url.includes('tacker')) {
    return 'skin-staplers-tackers';
  }
  if (b.includes('clip') || url.includes('clip')) {
    return 'clips-appliers';
  }
  if (b.includes('hemostat') || url.includes('hemostax') || url.includes('bone-wax')) {
    return 'hemostats';
  }
  if (url.includes('procedure-kits')) {
    return 'specialty-sutures';
  }
  return 'absorbable-sutures';
}

function cleanHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildCleanProductName(name, tradeName) {
  if (!tradeName || tradeName === 'N/A' || tradeName.toLowerCase() === 'no brand') {
    return name;
  }
  if (name.toLowerCase().includes(tradeName.toLowerCase())) {
    return name;
  }
  return `${tradeName}® · ${name}`;
}

async function scrapeProductPageDetails(url) {
  try {
    const res = await fetchUrl(url);
    if (res.statusCode !== 200) return null;
    const html = res.data;

    // JSON-LD
    const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
    let ldMatch;
    let productLd = null;
    let breadcrumbLd = null;
    while ((ldMatch = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(ldMatch[1]);
        if (parsed['@type'] === 'Product' || (Array.isArray(parsed['@type']) && parsed['@type'].includes('Product'))) {
          productLd = parsed;
        }
        if (parsed['@type'] === 'BreadcrumbList') {
          breadcrumbLd = parsed;
        }
      } catch (e) {}
    }

    // Headings (H2s make great feature highlights)
    const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
    const h2s = [];
    let h2Match;
    while ((h2Match = h2Regex.exec(html)) !== null) {
      const txt = cleanHtml(h2Match[1]);
      if (txt.length > 5 && txt.length < 80 && 
          !txt.toLowerCase().includes('faq') && 
          !txt.toLowerCase().includes('frequently') && 
          !txt.toLowerCase().includes('related') && 
          !txt.toLowerCase().includes('find your') && 
          !txt.toLowerCase().includes('quote') && 
          !txt.toLowerCase().includes('get in touch') &&
          !txt.toLowerCase().includes('what is')) {
        h2s.push(txt);
      }
    }

    // Paragraphs
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    const paragraphs = [];
    let pMatch;
    while ((pMatch = pRegex.exec(html)) !== null) {
      const txt = cleanHtml(pMatch[1]);
      if (txt.length > 40 && 
          !txt.includes('copyright') && 
          !txt.includes('All rights') && 
          !txt.includes('cookie') && 
          !txt.includes('Terms')) {
        paragraphs.push(txt);
      }
    }

    return {
      productLd,
      breadcrumbLd,
      h2s,
      paragraphs
    };
  } catch (err) {
    console.warn(`Scrape warning for ${url}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('=== SRIYAS HEALTHCARE — DOLPHIN SUTURES / FUTURA MEDTECH CATALOG IMPORTER ===\n');

  const dbPath = path.resolve('server/data/sriyas_db.runtime.json');
  if (!fs.existsSync(dbPath)) {
    throw new Error('Database runtime file not found: ' + dbPath);
  }
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  if (!db.Brand) db.Brand = [];
  if (!db.Category) db.Category = [];
  if (!db.Product) db.Product = [];

  // 1. BRAND: Futura Medtech
  console.log('--- 1. Setting Up Brand: Futura Medtech ---');
  let brand = db.Brand.find(b => b.slug === 'futura-medtech' || b.name.toLowerCase() === 'futura medtech');
  if (!brand) {
    brand = {
      _id: generateMongoId(),
      createdAt: new Date().toISOString(),
      slug: 'futura-medtech',
      name: 'Futura Medtech',
      description: 'Futura Medtech (Futura Surgicare Pvt. Ltd.) is an Indian medical device pioneer and global exporter of high-precision surgical sutures, surgical mesh, skin staplers, ligation clips, and hemostatic products under the internationally recognized Dolphin Sutures brand.',
      logoUrl: '/images/brands/futura-medtech-logo.webp',
      seoTitle: 'Futura Medtech & Dolphin Sutures | Sriyas Healthcare Authorized Distributor',
      seoDescription: 'Explore Futura Medtech and Dolphin Sutures complete surgical catalog: absorbable and non-absorbable sutures, hernia mesh, skin staplers, polymer clips, and hemostats.',
      displayOrder: 7,
      isActive: true,
      updatedAt: new Date().toISOString(),
      specialty: 'Surgical Sutures & Wound Closure'
    };
    db.Brand.push(brand);
    console.log('Created Brand Futura Medtech:', brand._id);
  } else {
    console.log('Found existing Brand Futura Medtech:', brand._id);
  }

  // Download brand logos
  const brandImgDir = path.resolve('client/public/images/brands');
  if (!fs.existsSync(brandImgDir)) fs.mkdirSync(brandImgDir, { recursive: true });
  try {
    const brandLogoPath = path.join(brandImgDir, 'futura-medtech-logo.webp');
    if (!fs.existsSync(brandLogoPath)) {
      await downloadFile('https://www.dolphinsutures.com/futura-medtech-v2.webp', brandLogoPath);
      console.log('Downloaded Futura Medtech logo to:', brandLogoPath);
    }
    const dolphinLogoPath = path.join(brandImgDir, 'dolphin-sutures-logo.webp');
    if (!fs.existsSync(dolphinLogoPath)) {
      await downloadFile('https://www.dolphinsutures.com/dolphin-logo.webp', dolphinLogoPath);
      console.log('Downloaded Dolphin Sutures logo to:', dolphinLogoPath);
    }
  } catch (err) {
    console.warn('Logo download notice:', err.message);
  }

  // 2. MAIN CATEGORY: Dolphin Sutures
  console.log('\n--- 2. Setting Up Main Category: Dolphin Sutures ---');
  let mainCat = db.Category.find(c => c.slug === 'dolphin-sutures' && (!c.parentCategory || c.parentCategory === null));
  if (!mainCat) {
    mainCat = {
      _id: generateMongoId(),
      createdAt: new Date().toISOString(),
      slug: 'dolphin-sutures',
      name: 'Dolphin Sutures',
      brand: brand._id,
      parentCategory: null,
      heroTitle: 'Dolphin Sutures Surgical Portfolio',
      description: 'Comprehensive range of high-precision surgical sutures, hernia meshes, staplers, ligation clips, and advanced wound closure solutions manufactured to ISO 13485 and CE standards.',
      heroGradient: 'linear-gradient(135deg,#0a365c,#1d69a6)',
      heroImage: {
        url: '/images/brands/dolphin-sutures-logo.webp',
        publicId: 'dolphin-sutures-category-hero',
        format: 'webp'
      },
      displayOrder: 1,
      isActive: true,
      updatedAt: new Date().toISOString()
    };
    db.Category.push(mainCat);
    console.log('Created Main Category Dolphin Sutures:', mainCat._id);
  } else {
    mainCat.brand = brand._id;
    mainCat.parentCategory = null;
    mainCat.updatedAt = new Date().toISOString();
    console.log('Updated Main Category Dolphin Sutures:', mainCat._id);
  }

  // 3. 7 SUBCATEGORIES: Under Dolphin Sutures
  console.log('\n--- 3. Setting Up 7 Subcategories Under Dolphin Sutures ---');
  const subcategoryMap = {}; // slug -> category record

  for (const def of SUBCATEGORY_DEFS) {
    let subCat = db.Category.find(c => c.slug === def.slug && String(c.parentCategory) === String(mainCat._id));
    if (!subCat) {
      subCat = db.Category.find(c => c.slug === def.slug);
    }
    if (!subCat) {
      subCat = {
        _id: generateMongoId(),
        createdAt: new Date().toISOString(),
        slug: def.slug,
        name: def.name,
        brand: brand._id,
        parentCategory: mainCat._id,
        heroTitle: def.heroTitle,
        description: def.description,
        heroGradient: 'linear-gradient(135deg,#102a45,#245785)',
        displayOrder: def.displayOrder,
        isActive: true,
        updatedAt: new Date().toISOString()
      };
      db.Category.push(subCat);
      console.log(`Created Subcategory [${def.name}] (${def.slug}): ${subCat._id}`);
    } else {
      subCat.brand = brand._id;
      subCat.parentCategory = mainCat._id;
      subCat.name = def.name;
      subCat.description = def.description;
      subCat.heroTitle = def.heroTitle;
      subCat.displayOrder = def.displayOrder;
      subCat.isActive = true;
      subCat.updatedAt = new Date().toISOString();
      console.log(`Updated Subcategory [${def.name}] (${def.slug}): ${subCat._id}`);
    }
    subcategoryMap[def.slug] = subCat;
  }

  // 4. LOAD DISCOVERED PRODUCTS & SCRAPE DETAILED DATA
  console.log('\n--- 4. Crawling Detailed Product Data & Downloading Images ---');
  const rawDiscovered = JSON.parse(fs.readFileSync('scripts/discovered_products.json', 'utf8'));
  console.log(`Discovered ${rawDiscovered.length} products to process.`);

  const imagesDir = path.resolve('client/public/images/products/dolphin-sutures');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  const distImagesDir = path.resolve('client/dist/images/products/dolphin-sutures');
  if (fs.existsSync('client/dist')) {
    if (!fs.existsSync(distImagesDir)) fs.mkdirSync(distImagesDir, { recursive: true });
  }

  const importedSummary = {};
  SUBCATEGORY_DEFS.forEach(s => importedSummary[s.slug] = []);

  let processedCount = 0;
  for (const raw of rawDiscovered) {
    processedCount++;
    console.log(`\n[${processedCount}/${rawDiscovered.length}] Processing: ${raw.name} (${raw.tradeName || 'No Brand'})...`);

    const subSlug = determineSubcategorySlug(raw);
    const subcategoryRecord = subcategoryMap[subSlug];
    if (!subcategoryRecord) {
      console.warn(`Could not find subcategory record for ${subSlug}`);
      continue;
    }

    // Generate clean product slug from URL or name
    let productSlug = new URL(raw.url).pathname.replace(/^\/|\/$/g, '').replace(/^products\//, '');
    if (!productSlug || productSlug.length < 3) {
      productSlug = (raw.tradeName || raw.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    // Download Image
    let localImageUrl = '';
    if (raw.image && raw.image.startsWith('http')) {
      const ext = path.extname(new URL(raw.image).pathname) || '.webp';
      const filename = `${productSlug}${ext}`;
      const localFilePath = path.join(imagesDir, filename);
      
      try {
        if (!fs.existsSync(localFilePath) || fs.statSync(localFilePath).size === 0) {
          await downloadFile(raw.image, localFilePath);
          console.log(`  Downloaded image: ${filename} (${fs.statSync(localFilePath).size} bytes)`);
        } else {
          console.log(`  Image exists: ${filename}`);
        }
        localImageUrl = `/images/products/dolphin-sutures/${filename}`;

        // Also copy to dist if dist exists
        if (fs.existsSync('client/dist')) {
          const distFilePath = path.join(distImagesDir, filename);
          fs.copyFileSync(localFilePath, distFilePath);
        }
      } catch (err) {
        console.warn(`  Failed image download (${raw.image}):`, err.message);
        localImageUrl = raw.image; // fallback
      }
    }

    // Scrape live page for rich details
    const pageDetails = await scrapeProductPageDetails(raw.url);
    const pLd = pageDetails?.productLd || raw;

    // Specifications from Schema.org additionalProperty
    const specs = [];
    const rawProps = pLd.additionalProperty || raw.additionalProperty || [];
    let materialVal = '';
    let coatingVal = '';
    let absorptionVal = '';
    let sizesVal = '';
    let tissueReactionVal = '';
    let appsVal = '';

    rawProps.forEach(prop => {
      const name = prop.name;
      const value = prop.value;
      if (name && value) {
        specs.push({ name, value: String(value) });
        const nLow = name.toLowerCase();
        if (nLow.includes('material')) materialVal = String(value);
        if (nLow.includes('coating')) coatingVal = String(value);
        if (nLow.includes('absorption')) absorptionVal = String(value);
        if (nLow.includes('size')) sizesVal = String(value);
        if (nLow.includes('reaction')) tissueReactionVal = String(value);
        if (nLow.includes('application')) appsVal = String(value);
      }
    });

    // Add needle/model details if available
    if (Array.isArray(pLd.model) && pLd.model.length > 0) {
      specs.push({
        name: 'Configurations',
        value: `${pLd.model.length} specialized needle/suture combinations available`
      });
      // Extract unique needle profiles
      const needleProfiles = new Set();
      pLd.model.forEach(m => {
        (m.additionalProperty || []).forEach(ap => {
          if (ap.name && ap.name.toLowerCase().includes('needle profile') && ap.value) {
            needleProfiles.add(ap.value);
          }
        });
      });
      if (needleProfiles.size > 0) {
        specs.push({
          name: 'Needle Profiles',
          value: Array.from(needleProfiles).slice(0, 4).join(', ')
        });
      }
    }

    // Features
    const features = [];
    if (pageDetails?.h2s && pageDetails.h2s.length > 0) {
      pageDetails.h2s.slice(0, 6).forEach(h => {
        if (!features.includes(h)) features.push(h);
      });
    }
    if (materialVal && !features.some(f => f.toLowerCase().includes('material'))) {
      features.push(`Constructed from high-grade ${materialVal}`);
    }
    if (coatingVal && !features.some(f => f.toLowerCase().includes('coating'))) {
      features.push(`Enhanced with ${coatingVal} for superior smoothness and handling`);
    }
    if (absorptionVal && !features.some(f => f.toLowerCase().includes('absorption'))) {
      features.push(`Predictable absorption profile: ${absorptionVal}`);
    }
    if (features.length < 3) {
      features.push('Manufactured in ISO 13485 and CE-certified medical facilities');
      features.push('Sterile barrier EO packaging ensuring complete aseptic delivery');
      features.push('Trusted in hospital operating theatres across 85+ countries');
    }

    // Applications
    const applications = [];
    if (appsVal) {
      appsVal.split(/,|;|\band\b/i).map(s => s.trim()).filter(Boolean).forEach(a => {
        if (a.length > 3 && !applications.includes(a)) applications.push(a);
      });
    }
    // Default surgical applications based on category
    if (subSlug === 'absorbable-sutures' || subSlug === 'non-absorbable-sutures' || subSlug === 'specialty-sutures') {
      [
        'General Surgery & Soft Tissue Approximation',
        'Gastrointestinal & Bowel Surgery',
        'Gynecology & Obstetrics',
        'Orthopaedic & Trauma Surgery',
        'Plastic & Reconstructive Surgery',
        'Cardiovascular & Thoracic Surgery'
      ].forEach(app => {
        if (!applications.includes(app)) applications.push(app);
      });
    } else if (subSlug === 'surgical-mesh') {
      [
        'Open & Laparoscopic Inguinal Hernia Repair',
        'Ventral & Incisional Hernia Repair',
        'Abdominal Wall Reconstruction',
        'Soft Tissue Deficiency Reinforcement'
      ].forEach(app => {
        if (!applications.includes(app)) applications.push(app);
      });
    } else if (subSlug === 'skin-staplers-tackers') {
      [
        'Rapid Cutaneous Skin Closure in Major Surgery',
        'Orthopaedic & Abdominal Surgical Incisions',
        'Obstetric & Caesarean Section Skin Closure',
        'Tension-Free Hernia Mesh Fixation (Tackers)'
      ].forEach(app => {
        if (!applications.includes(app)) applications.push(app);
      });
    } else if (subSlug === 'clips-appliers') {
      [
        'Vessel & Duct Ligation in Laparoscopic Cholecystectomy',
        'Open & Minimally Invasive General Surgery',
        'Urological & Gynecological Vascular Ligation',
        'Secure Hemostatic Occlusion of Tubular Structures'
      ].forEach(app => {
        if (!applications.includes(app)) applications.push(app);
      });
    } else if (subSlug === 'hemostats') {
      [
        'Local Hemostasis in Capillary, Venous & Small Artery Bleeding',
        'Cardiovascular & Thoracic Operative Sites',
        'Orthopaedic & Spine Bone Edge Bleeding Control',
        'General & Laparoscopic Visceral Surgery'
      ].forEach(app => {
        if (!applications.includes(app)) applications.push(app);
      });
    }

    // Short Specification
    let shortSpec = '';
    if (materialVal && sizesVal) {
      shortSpec = `${materialVal} · Sizes ${sizesVal}`;
    } else if (materialVal && absorptionVal) {
      shortSpec = `${materialVal} · ${absorptionVal}`;
    } else if (materialVal) {
      shortSpec = materialVal;
    } else if (specs.length > 0) {
      shortSpec = `${specs[0].name}: ${specs[0].value}`;
    } else {
      shortSpec = subcategoryRecord.name;
    }
    if (shortSpec.length > 75) shortSpec = shortSpec.substring(0, 72) + '...';

    // Clinical Description
    let description = pLd.description || raw.description || '';
    if (pageDetails?.paragraphs && pageDetails.paragraphs.length > 0) {
      const richDesc = pageDetails.paragraphs.find(p => p.length > 80 && p.length < 400);
      if (richDesc && (!description || description.length < 100)) {
        description = richDesc;
      }
    }
    if (!description || description.length < 30) {
      description = `${raw.name} manufactured by Dolphin Sutures / Futura Medtech. Engineered for dependable clinical performance, superior tissue handling, and reliable surgical outcomes across operating theatres worldwide.`;
    }

    // Product Title
    const displayName = buildCleanProductName(raw.name, raw.tradeName);

    // Build Product Object
    let existingProd = db.Product.find(p => p.slug === productSlug);
    const prodDoc = {
      _id: existingProd?._id || generateMongoId(),
      createdAt: existingProd?.createdAt || new Date().toISOString(),
      slug: productSlug,
      legacyId: productSlug.replace(/-/g, '_'),
      name: displayName,
      brand: brand._id,
      category: mainCat._id,
      subcategory: subcategoryRecord._id,
      cardCategory: `Dolphin Sutures · ${subcategoryRecord.name}`,
      detailCategory: `Futura Medtech · Dolphin Sutures · ${subcategoryRecord.name}`,
      shortSpecification: shortSpec,
      description: description,
      images: localImageUrl ? [
        {
          url: localImageUrl,
          publicId: `dolphin-sutures-${productSlug}`,
          isPrimary: true,
          alt: displayName
        }
      ] : [],
      cardBg: '',
      features: features.slice(0, 7),
      specifications: specs,
      applications: applications.slice(0, 7),
      brochure: {
        url: '',
        publicId: '',
        filename: ''
      },
      isActive: true,
      displayOrder: processedCount,
      deletedAt: null,
      updatedAt: new Date().toISOString()
    };

    if (existingProd) {
      const idx = db.Product.indexOf(existingProd);
      db.Product[idx] = prodDoc;
    } else {
      db.Product.push(prodDoc);
    }

    importedSummary[subSlug].push({
      name: displayName,
      slug: productSlug,
      subName: subcategoryRecord.name,
      imageUrl: localImageUrl
    });
  }

  // 5. SAVE RUNTIME DATABASE
  console.log('\n--- 5. Saving Database Runtime File ---');
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`Database saved successfully to ${dbPath}`);

  // 6. OUTPUT DETAILED SUMMARY
  console.log('\n======================================================');
  console.log('         DOLPHIN SUTURES IMPORT SUMMARY REPORT        ');
  console.log('======================================================');
  console.log(`Brand: Futura Medtech (${brand._id})`);
  console.log(`Main Category: Dolphin Sutures (${mainCat._id})`);
  console.log('------------------------------------------------------');

  let totalImported = 0;
  for (const def of SUBCATEGORY_DEFS) {
    const list = importedSummary[def.slug] || [];
    totalImported += list.length;
    console.log(`\n### Subcategory: ${def.name} (${list.length} products)`);
    console.log(`    Slug: ${def.slug} | ID: ${subcategoryMap[def.slug]._id}`);
    list.forEach((item, i) => {
      console.log(`    ${i + 1}. ${item.name} [slug: ${item.slug}] (Image: ${item.imageUrl})`);
    });
  }

  console.log('\n======================================================');
  console.log(`TOTAL PRODUCTS IMPORTED: ${totalImported}`);
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('Fatal error during scrape and import:', err);
  process.exit(1);
});
