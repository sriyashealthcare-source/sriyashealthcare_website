/**
 * Sriyas Healthcare — Image Inventory & Audit Script
 * Audits all images on disk, in database stores, and in source code.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const clientDir = path.join(rootDir, 'client');
const serverDir = path.join(rootDir, 'server');
const publicDir = path.join(clientDir, 'public');

function getFilesRecursively(dir, filterExts) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist', '.wrangler'].includes(entry.name)) {
        results = results.concat(getFilesRecursively(fullPath, filterExts));
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!filterExts || filterExts.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// 1. Audit files on disk in client/public/assets
const imageExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
const diskAssetFiles = getFilesRecursively(publicDir, imageExts);

const diskInventory = diskAssetFiles.map(filePath => {
  const relFromPublic = path.relative(publicDir, filePath).replace(/\\/g, '/');
  const stat = fs.statSync(filePath);
  return {
    relativePath: '/' + relFromPublic,
    fullPath: filePath,
    sizeBytes: stat.size,
    ext: path.extname(filePath).toLowerCase(),
    category: relFromPublic.split('/')[1] || 'root'
  };
});

// 2. Audit Database Records (server/data/sriyas_db.runtime.json and server/data/sriyas_seed_products.json)
const dbRuntimePath = path.join(serverDir, 'data', 'sriyas_db.runtime.json');
const dbSeedPath = path.join(serverDir, 'data', 'sriyas_seed_products.json');

let dbRuntime = null;
if (fs.existsSync(dbRuntimePath)) {
  try {
    dbRuntime = JSON.parse(fs.readFileSync(dbRuntimePath, 'utf8'));
  } catch (e) {
    console.error('Error reading sriyas_db.runtime.json:', e.message);
  }
}

let dbSeed = null;
if (fs.existsSync(dbSeedPath)) {
  try {
    dbSeed = JSON.parse(fs.readFileSync(dbSeedPath, 'utf8'));
  } catch (e) {
    console.error('Error reading sriyas_seed_products.json:', e.message);
  }
}

const dbImageReferences = [];

if (dbRuntime) {
  const productsList = dbRuntime.Product || dbRuntime.products || [];
  const brandsList = dbRuntime.Brand || dbRuntime.brands || [];
  const categoriesList = dbRuntime.Category || dbRuntime.categories || [];
  const homepageList = dbRuntime.HomepageContent || dbRuntime.homepageContent || [];

  // Products
  productsList.forEach(p => {
    (p.images || []).forEach(img => {
      dbImageReferences.push({
        source: 'runtime_db:products',
        owner: p.name,
        slug: p.slug,
        field: 'images',
        url: img.url,
        publicId: img.publicId,
        alt: img.alt
      });
    });
    if (p.brochure && p.brochure.url) {
      dbImageReferences.push({
        source: 'runtime_db:products',
        owner: p.name,
        slug: p.slug,
        field: 'brochure',
        url: p.brochure.url,
        publicId: p.brochure.publicId,
        alt: 'Brochure PDF'
      });
    }
  });

  // Brands
  brandsList.forEach(b => {
    if (b.logoUrl) {
      dbImageReferences.push({
        source: 'runtime_db:brands',
        owner: b.name,
        slug: b.slug,
        field: 'logoUrl',
        url: b.logoUrl,
        publicId: b.logoPublicId,
        alt: b.logoAlt
      });
    }
  });

  // Categories
  categoriesList.forEach(c => {
    if (c.heroImage && c.heroImage.url) {
      dbImageReferences.push({
        source: 'runtime_db:categories',
        owner: c.name,
        slug: c.slug,
        field: 'heroImage',
        url: c.heroImage.url,
        publicId: c.heroImage.publicId,
        alt: c.heroImage.alt
      });
    }
  });

  // Homepage Content
  homepageList.forEach(hp => {
    ['draft', 'published'].forEach(state => {
      const content = hp[state];
      if (!content) return;

      // Hero
      if (content.hero?.logo?.url) {
        dbImageReferences.push({
          source: `runtime_db:homepage:${state}`,
          owner: 'Hero Section',
          field: 'hero.logo',
          url: content.hero.logo.url,
          publicId: content.hero.logo.publicId
        });
      }
      if (content.hero?.backgroundImage?.url) {
        dbImageReferences.push({
          source: `runtime_db:homepage:${state}`,
          owner: 'Hero Section',
          field: 'hero.backgroundImage',
          url: content.hero.backgroundImage.url,
          publicId: content.hero.backgroundImage.publicId
        });
      }

      // About
      (content.about?.images || []).forEach(img => {
        if (img.url) {
          dbImageReferences.push({
            source: `runtime_db:homepage:${state}`,
            owner: 'About Section',
            field: 'about.images',
            url: img.url,
            publicId: img.publicId,
            caption: img.caption
          });
        }
      });

      // Workplace Gallery
      (content.workplace?.images || []).forEach(img => {
        if (img.url) {
          dbImageReferences.push({
            source: `runtime_db:homepage:${state}`,
            owner: 'Workplace Gallery',
            field: 'workplace.images',
            url: img.url,
            publicId: img.publicId,
            caption: img.caption
          });
        }
      });

      // Leadership
      (content.leadership?.items || []).forEach(item => {
        if (item.image?.url) {
          dbImageReferences.push({
            source: `runtime_db:homepage:${state}`,
            owner: `Leadership: ${item.name}`,
            field: 'leadership.image',
            url: item.image.url,
            publicId: item.image.publicId
          });
        }
      });

      // Team
      (content.team?.items || []).forEach(item => {
        if (item.image?.url) {
          dbImageReferences.push({
            source: `runtime_db:homepage:${state}`,
            owner: `Team: ${item.name}`,
            field: 'team.image',
            url: item.image.url,
            publicId: item.image.publicId
          });
        }
      });

      // What We Do
      (content.whatWeDo?.items || []).forEach(item => {
        if (item.image?.url) {
          dbImageReferences.push({
            source: `runtime_db:homepage:${state}`,
            owner: `WhatWeDo: ${item.title}`,
            field: 'whatWeDo.image',
            url: item.image.url,
            publicId: item.image.publicId
          });
        }
      });

      // Values
      if (content.values?.featureImage?.url) {
        dbImageReferences.push({
          source: `runtime_db:homepage:${state}`,
          owner: 'Values Section',
          field: 'values.featureImage',
          url: content.values.featureImage.url,
          publicId: content.values.featureImage.publicId
        });
      }

      // CTA
      if (content.callToAction?.backgroundImage?.url) {
        dbImageReferences.push({
          source: `runtime_db:homepage:${state}`,
          owner: 'CTA Section',
          field: 'callToAction.backgroundImage',
          url: content.callToAction.backgroundImage.url,
          publicId: content.callToAction.backgroundImage.publicId
        });
      }
    });
  });
}

// 3. Audit Code References (JSX, JS, CSS, JSON)
const codeFiles = getFilesRecursively(clientDir, ['.jsx', '.js', '.css'])
  .concat(getFilesRecursively(serverDir, ['.js', '.json']));

const codeImageReferences = [];
const imagePathRegex = /(?:['"`])(\/assets\/[^'"`\s\)\>]+|\/favicon\.[a-z0-9]+|https?:\/\/[^'"`\s\)\>]+?\.(?:png|jpe?g|webp|gif|svg))(?:['"`])/gi;

for (const file of codeFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    let m;
    while ((m = imagePathRegex.exec(line)) !== null) {
      const matchUrl = m[1];
      // Skip npm package or external library urls if not images
      codeImageReferences.push({
        file: path.relative(rootDir, file).replace(/\\/g, '/'),
        line: idx + 1,
        url: matchUrl
      });
    }
  });
}

// Summary Report
console.log('===============================================================');
console.log('  SRIYAS HEALTHCARE — COMPLETE IMAGE AUDIT & INVENTORY');
console.log('===============================================================');
console.log(`1. Image Files Found on Disk: ${diskInventory.length}`);
const diskByCat = {};
diskInventory.forEach(d => {
  diskByCat[d.category] = (diskByCat[d.category] || 0) + 1;
});
console.log('   Breakdown by category:', diskByCat);

console.log(`\n2. Database Image References Found: ${dbImageReferences.length}`);
const dbBySource = {};
dbImageReferences.forEach(d => {
  dbBySource[d.source] = (dbBySource[d.source] || 0) + 1;
});
console.log('   Breakdown by DB collection:', dbBySource);

console.log(`\n3. Code Image References Found: ${codeImageReferences.length}`);
const uniqueCodeUrls = [...new Set(codeImageReferences.map(c => c.url))];
console.log(`   Unique URLs referenced in code: ${uniqueCodeUrls.length}`);
uniqueCodeUrls.forEach(u => console.log('   -', u));

// Save inventory to JSON for migration processing
const inventoryResult = {
  timestamp: new Date().toISOString(),
  diskFilesCount: diskInventory.length,
  diskInventory,
  dbReferencesCount: dbImageReferences.length,
  dbImageReferences,
  codeReferencesCount: codeImageReferences.length,
  uniqueCodeUrls,
  codeImageReferences
};

const inventoryPath = path.join(rootDir, 'server', 'data', 'image_audit_inventory.json');
fs.writeFileSync(inventoryPath, JSON.stringify(inventoryResult, null, 2), 'utf8');
console.log(`\nInventory successfully written to: ${inventoryPath}`);
