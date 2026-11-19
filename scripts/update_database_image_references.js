/**
 * Sriyas Healthcare — Update Database & Configuration Image References
 * Replaces all local /assets/ image URLs with Cloudinary delivery URLs and public IDs
 * in server/data/sriyas_db.runtime.json and configuration files.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const manifestPath = path.join(serverDir, 'data', 'cloudinary_migration_manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error('Error: cloudinary_migration_manifest.json not found!');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Helper to lookup Cloudinary info by local URL
function lookup(url) {
  if (!url) return null;
  if (url.includes('res.cloudinary.com')) return null; // already Cloudinary
  const cleanUrl = url.startsWith('/') ? url : '/' + url;
  if (manifest[cleanUrl]) return manifest[cleanUrl];
  if (manifest[url]) return manifest[url];
  // Check without query or hash
  const stripped = cleanUrl.split('?')[0].split('#')[0];
  if (manifest[stripped]) return manifest[stripped];
  return null;
}

// 1. Update server/data/sriyas_db.runtime.json
const dbRuntimePath = path.join(serverDir, 'data', 'sriyas_db.runtime.json');
if (fs.existsSync(dbRuntimePath)) {
  console.log('[1/3] Updating server/data/sriyas_db.runtime.json...');
  const db = JSON.parse(fs.readFileSync(dbRuntimePath, 'utf8'));

  // Backup original
  const backupPath = path.join(serverDir, 'data', `sriyas_db.runtime.backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`  ✓ Backup created at: ${backupPath}`);

  let updatedProducts = 0;
  let updatedBrands = 0;
  let updatedCategories = 0;
  let updatedHomepage = 0;

  // Products
  (db.Product || []).forEach(p => {
    let changed = false;
    (p.images || []).forEach(img => {
      const match = lookup(img.url);
      if (match) {
        img.url = match.url;
        img.publicId = match.publicId;
        img.format = match.format;
        changed = true;
      }
    });
    if (p.brochure && p.brochure.url) {
      const match = lookup(p.brochure.url);
      if (match) {
        p.brochure.url = match.url;
        p.brochure.publicId = match.publicId;
        p.brochure.format = 'pdf';
        changed = true;
      }
    }
    if (changed) updatedProducts++;
  });

  // Brands
  (db.Brand || []).forEach(b => {
    const match = lookup(b.logoUrl);
    if (match) {
      b.logoUrl = match.url;
      b.logoPublicId = match.publicId;
      updatedBrands++;
    }
  });

  // Categories
  (db.Category || []).forEach(c => {
    if (c.heroImage && c.heroImage.url) {
      const match = lookup(c.heroImage.url);
      if (match) {
        c.heroImage.url = match.url;
        c.heroImage.publicId = match.publicId;
        c.heroImage.format = match.format;
        updatedCategories++;
      }
    }
  });

  // Homepage Content (draft and published)
  (db.HomepageContent || []).forEach(hp => {
    ['draft', 'published'].forEach(state => {
      const content = hp[state];
      if (!content) return;

      // Hero
      if (content.hero?.logo?.url) {
        const m = lookup(content.hero.logo.url);
        if (m) {
          content.hero.logo.url = m.url;
          content.hero.logo.publicId = m.publicId;
          updatedHomepage++;
        }
      }

      // About
      (content.about?.images || []).forEach(img => {
        const m = lookup(img.url);
        if (m) {
          img.url = m.url;
          img.publicId = m.publicId;
          updatedHomepage++;
        }
      });

      // Workplace Gallery
      (content.workplace?.images || []).forEach(img => {
        const m = lookup(img.url);
        if (m) {
          img.url = m.url;
          img.publicId = m.publicId;
          updatedHomepage++;
        }
      });

      // Leadership
      (content.leadership?.items || []).forEach(item => {
        if (item.photo?.url) {
          const m = lookup(item.photo.url);
          if (m) {
            item.photo.url = m.url;
            item.photo.publicId = m.publicId;
            updatedHomepage++;
          }
        }
      });

      // Team
      (content.team?.items || []).forEach(item => {
        if (item.photo?.url) {
          const m = lookup(item.photo.url);
          if (m) {
            item.photo.url = m.url;
            item.photo.publicId = m.publicId;
            updatedHomepage++;
          }
        }
      });

      // What We Do
      (content.whatWeDo?.items || []).forEach(item => {
        if (item.image?.url) {
          const m = lookup(item.image.url);
          if (m) {
            item.image.url = m.url;
            item.image.publicId = m.publicId;
            updatedHomepage++;
          }
        }
      });

      // Values
      if (content.values?.featureImage?.url) {
        const m = lookup(content.values.featureImage.url);
        if (m) {
          content.values.featureImage.url = m.url;
          content.values.featureImage.publicId = m.publicId;
          updatedHomepage++;
        }
      }

      // CTA
      if (content.callToAction?.backgroundImage?.url) {
        const m = lookup(content.callToAction.backgroundImage.url);
        if (m) {
          content.callToAction.backgroundImage.url = m.url;
          content.callToAction.backgroundImage.publicId = m.publicId;
          updatedHomepage++;
        }
      }
    });
  });

  fs.writeFileSync(dbRuntimePath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`  ✓ Updated Products: ${updatedProducts}`);
  console.log(`  ✓ Updated Brands: ${updatedBrands}`);
  console.log(`  ✓ Updated Categories: ${updatedCategories}`);
  console.log(`  ✓ Updated Homepage elements: ${updatedHomepage}`);
}

// 2. Update scripts/catalogData.json
const catalogPath = path.join(rootDir, 'scripts', 'catalogData.json');
if (fs.existsSync(catalogPath)) {
  console.log('\n[2/3] Updating scripts/catalogData.json...');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  // Backup original
  const backupCatPath = path.join(rootDir, 'scripts', `catalogData.backup-${Date.now()}.json`);
  fs.writeFileSync(backupCatPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`  ✓ Backup created at: ${backupCatPath}`);

  let catCount = 0;
  (catalog.brands || []).forEach(b => {
    const m = lookup(b.logoUrl);
    if (m) {
      b.logoUrl = m.url;
      b.logoPublicId = m.publicId;
      catCount++;
    }
  });

  (catalog.categories || []).forEach(c => {
    if (c.heroImage?.url) {
      const m = lookup(c.heroImage.url);
      if (m) {
        c.heroImage.url = m.url;
        c.heroImage.publicId = m.publicId;
        catCount++;
      }
    }
  });

  (catalog.products || []).forEach(p => {
    (p.images || []).forEach(img => {
      const m = lookup(img.url);
      if (m) {
        img.url = m.url;
        img.publicId = m.publicId;
        catCount++;
      }
    });
    if (p.brochure?.url) {
      const m = lookup(p.brochure.url);
      if (m) {
        p.brochure.url = m.url;
        p.brochure.publicId = m.publicId;
        catCount++;
      }
    }
  });

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`  ✓ Catalog items updated: ${catCount}`);
}

// 3. Update server/config/defaultHomepageContent.js
const defaultHpPath = path.join(serverDir, 'config', 'defaultHomepageContent.js');
if (fs.existsSync(defaultHpPath)) {
  console.log('\n[3/3] Updating server/config/defaultHomepageContent.js...');
  let content = fs.readFileSync(defaultHpPath, 'utf8');

  let replacements = 0;
  for (const [localUrl, cld] of Object.entries(manifest)) {
    if (content.includes(`'${localUrl}'`) || content.includes(`"${localUrl}"`)) {
      content = content.split(`'${localUrl}'`).join(`'${cld.url}'`);
      content = content.split(`"${localUrl}"`).join(`"${cld.url}"`);
      replacements++;
    }
  }

  // Also replace publicId empty strings where applicable
  content = content.replace(
    /url:\s*'https:\/\/res\.cloudinary\.com\/pgjzw0zu\/image\/upload\/[^']+\/sriyas-healthcare\/general\/sriyas-emblem\.png',\s*publicId:\s*'',/g,
    "url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048213/sriyas-healthcare/general/sriyas-emblem.png', publicId: 'sriyas-healthcare/general/sriyas-emblem',"
  );

  fs.writeFileSync(defaultHpPath, content, 'utf8');
  console.log(`  ✓ defaultHomepageContent.js replacements made: ${replacements}`);
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  DATABASE & CONFIGURATION UPDATE COMPLETE');
console.log('═══════════════════════════════════════════════════════════════');
