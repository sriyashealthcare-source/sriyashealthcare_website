const path = require('path');
const fs = require('fs');

// Load server node_modules when run from root or scripts/
const serverNodeModules = path.join(__dirname, '..', 'server', 'node_modules');
if (fs.existsSync(serverNodeModules) && !module.paths.includes(serverNodeModules)) {
  module.paths.unshift(serverNodeModules);
}

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { connectDatabase } = require('../server/config/database');
const { configureCloudinary, isCloudinaryConfigured, uploadLocalFile } = require('../server/config/cloudinary');
const Brand = require('../server/models/Brand');
const Category = require('../server/models/Category');
const Product = require('../server/models/Product');
const Admin = require('../server/models/Admin');

const catalogPath = path.join(__dirname, 'catalogData.json');
const publicDir = path.join(__dirname, '..', 'client', 'public');

async function resolveAssetUpload(relUrl, folder, resourceType = 'image') {
  // Retain relative static paths during initial seed to prevent automatic bulk-uploading.
  // Bulk Cloudinary migration is handled separately and safely via scripts/migrateAssetsToCloudinary.js.
  return { url: relUrl, publicId: '' };
}

async function runSeed({ silent = false } = {}) {
  const log = (...args) => {
    if (!silent) console.log(...args);
  };

  await connectDatabase();
  configureCloudinary();

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  // 1. Seed Initial Administrator
  const adminName = (process.env.ADMIN_NAME || 'Sriyas Healthcare Admin').trim();
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@sriyashealthcare.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Sriyas@2026';

  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await Admin.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'superadmin',
      isActive: true
    });
    log(`[Seed] Created initial administrator: ${adminEmail}`);
  } else {
    log(`[Seed] Verified existing administrator: ${adminEmail}`);
  }

  // 2. Seed Brands (Idempotent upsert by slug)
  const brandIdMap = {};
  for (const b of catalog.brands) {
    const brandDoc = await Brand.findOneAndUpdate(
      { slug: b.slug },
      {
        $set: {
          name: b.name,
          slug: b.slug,
          tabLabel: b.tabLabel || b.name,
          icon: b.icon || '🔬',
          logoUrl: b.logoUrl || '',
          description: b.description || '',
          displayOrder: b.displayOrder,
          isActive: true
        }
      },
      { upsert: true, new: true }
    );
    brandIdMap[b.slug] = brandDoc._id;
  }
  log(`[Seed] Upserted ${Object.keys(brandIdMap).length} brands.`);

  // 3. Seed Categories (Idempotent upsert by slug)
  const categoryIdMap = {};
  for (const c of catalog.categories) {
    const brandId = brandIdMap[c.brandSlug] || null;
    const heroImg = await resolveAssetUpload(
      c.heroImage?.url || '',
      'sriyas-healthcare/categories',
      'image'
    );

    const catDoc = await Category.findOneAndUpdate(
      { slug: c.slug },
      {
        $set: {
          name: c.name,
          slug: c.slug,
          brand: brandId,
          heroTitle: c.heroTitle || c.name,
          description: c.description || '',
          heroGradient: c.heroGradient || 'linear-gradient(135deg,#1a3a5c,#2d6b9e)',
          heroImage: {
            url: heroImg.url,
            publicId: heroImg.publicId
          },
          displayOrder: c.displayOrder,
          isActive: true
        }
      },
      { upsert: true, new: true }
    );
    categoryIdMap[c.slug] = catDoc._id;
  }
  log(`[Seed] Upserted ${Object.keys(categoryIdMap).length} categories.`);

  // 4. Seed Products (Idempotent upsert by slug)
  let upsertedProducts = 0;
  for (const p of catalog.products) {
    const brandId = brandIdMap[p.brandSlug];
    const categoryId = categoryIdMap[p.categorySlug];

    if (!brandId || !categoryId) {
      throw new Error(`Missing brand or category mapping for product ${p.name}`);
    }

    const uploadedImages = [];
    for (let i = 0; i < (p.images || []).length; i++) {
      const imgObj = p.images[i];
      const resolved = await resolveAssetUpload(
        imgObj.url,
        'sriyas-healthcare/products',
        'image'
      );
      uploadedImages.push({
        url: resolved.url,
        publicId: resolved.publicId,
        isPrimary: i === 0
      });
    }

    let brochureObj = { url: '', publicId: '', filename: '' };
    if (p.brochure && p.brochure.url) {
      const resolvedPdf = await resolveAssetUpload(
        p.brochure.url,
        'sriyas-healthcare/brochures',
        'raw'
      );
      brochureObj = {
        url: resolvedPdf.url,
        publicId: resolvedPdf.publicId,
        filename: p.brochure.filename || path.basename(p.brochure.url)
      };
    }

    await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          legacyId: p.legacyId,
          name: p.name,
          slug: p.slug,
          brand: brandId,
          category: categoryId,
          cardCategory: p.cardCategory || '',
          detailCategory: p.detailCategory || '',
          shortSpecification: p.shortSpecification || '',
          description: p.description || '',
          images: uploadedImages,
          cardBg: p.cardBg || '',
          features: p.features || [],
          specifications: p.specifications || [],
          applications: p.applications || [],
          brochure: brochureObj,
          isActive: true,
          displayOrder: p.displayOrder,
          deletedAt: null
        }
      },
      { upsert: true, new: true }
    );
    upsertedProducts++;
  }

  // 5. Verification Audit
  const dbBrandsCount = await Brand.countDocuments({});
  const dbCategoriesCount = await Category.countDocuments({});
  const dbProductsCount = await Product.countDocuments({ deletedAt: null });

  log('═══════════════════════════════════════════════════════════');
  log('  SRIYAS HEALTHCARE — MIGRATION & SEED VERIFICATION REPORT');
  log('═══════════════════════════════════════════════════════════');
  log(`  Original Brands Count     : ${catalog.brands.length} | DB Brands Count     : ${dbBrandsCount}`);
  log(`  Original Categories Count : ${catalog.categories.length} | DB Categories Count : ${dbCategoriesCount}`);
  log(`  Original Products Count   : ${catalog.products.length} | DB Products Count   : ${dbProductsCount}`);

  const allDbProducts = await Product.find({ deletedAt: null }).populate('brand').populate('category');
  const missingNames = catalog.products.filter(
    orig => !allDbProducts.some(dbp => dbp.slug === orig.slug && dbp.name === orig.name)
  );
  const brokenImages = allDbProducts.filter(dbp => !dbp.images || dbp.images.length === 0 || !dbp.images[0].url);
  const brochuresCount = allDbProducts.filter(dbp => dbp.brochure && dbp.brochure.url).length;

  log(`  Missing Products          : ${missingNames.length}`);
  log(`  Products Missing Images   : ${brokenImages.length}`);
  log(`  Products With Brochures   : ${brochuresCount} (Expected: 2)`);
  log('═══════════════════════════════════════════════════════════');

  if (missingNames.length > 0 || brokenImages.length > 0 || dbProductsCount < catalog.products.length) {
    throw new Error('Migration verification failed!');
  }

  return {
    brands: dbBrandsCount,
    categories: dbCategoriesCount,
    products: dbProductsCount
  };
}

async function ensureSeededOnStartup() {
  try {
    const productCount = await Product.countDocuments({});
    const adminCount = await Admin.countDocuments({});
    if (productCount === 0 || adminCount === 0) {
      console.log('[Startup] Database is empty — running initial catalogue & admin seed...');
      await runSeed({ silent: false });
    }
  } catch (err) {
    console.error('[Startup] Auto-seed check error:', err.message);
  }
}

if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('[Seed] Migration and verification completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Error during seed:', err);
      process.exit(1);
    });
}

module.exports = {
  runSeed,
  ensureSeededOnStartup
};

