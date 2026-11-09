/**
 * SRIYAS HEALTHCARE — CLOUDINARY BULK ASSET MIGRATION TOOL
 * 
 * Safely migrates the 79 extracted local media assets from client/public/assets/
 * to organized Cloudinary folders (sriyas/products, sriyas/brands, sriyas/categories, sriyas/brochures, sriyas/website),
 * and updates MongoDB Atlas records without loss or downtime.
 * 
 * Usage:
 *   node scripts/migrateAssetsToCloudinary.js --dry-run    (Simulates migration without uploading)
 *   node scripts/migrateAssetsToCloudinary.js              (Executes migration)
 */

const path = require('path');
const fs = require('fs');

// Ensure server node_modules are loaded
const serverNodeModules = path.join(__dirname, '..', 'server', 'node_modules');
if (fs.existsSync(serverNodeModules) && !module.paths.includes(serverNodeModules)) {
  module.paths.unshift(serverNodeModules);
}

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { connectDatabase } = require('../server/config/database');
const { configureCloudinary, isCloudinaryConfigured, uploadLocalFile, CLOUDINARY_FOLDERS } = require('../server/config/cloudinary');
const Product = require('../server/models/Product');
const Brand = require('../server/models/Brand');
const Category = require('../server/models/Category');

const isDryRun = process.argv.includes('--dry-run');
const publicDir = path.join(__dirname, '..', 'client', 'public');

async function migrateAssets() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`  SRIYAS HEALTHCARE — CLOUDINARY ASSET MIGRATION TOOL ${isDryRun ? '(DRY-RUN MODE)' : '(LIVE MODE)'}`);
  console.log('═══════════════════════════════════════════════════════════════════════');

  if (!isCloudinaryConfigured()) {
    console.error('Error: Cloudinary credentials are not set in .env.');
    process.exit(1);
  }

  await connectDatabase();
  configureCloudinary();

  const report = {
    brandsMigrated: 0,
    categoriesMigrated: 0,
    productImagesMigrated: 0,
    brochuresMigrated: 0,
    skippedAlreadyCloudinary: 0,
    failed: []
  };

  // 1. Migrate Brand Logos
  console.log('\n[1/4] Inspecting Brand Logos...');
  const brands = await Brand.find({});
  for (const brand of brands) {
    if (brand.logoUrl && brand.logoUrl.startsWith('/assets/')) {
      const localPath = path.join(publicDir, brand.logoUrl.replace(/^\//, ''));
      if (fs.existsSync(localPath)) {
        if (isDryRun) {
          console.log(`  [Dry-Run] Would upload brand logo: ${brand.name} -> ${brand.logoUrl}`);
          report.brandsMigrated++;
        } else {
          try {
            const res = await uploadLocalFile(localPath, CLOUDINARY_FOLDERS.brands, 'image');
            if (res && res.url) {
              await Brand.updateOne({ _id: brand._id }, { $set: { logoUrl: res.url, logoPublicId: res.publicId } });
              console.log(`  ✓ Migrated brand logo: ${brand.name} -> ${res.url}`);
              report.brandsMigrated++;
            }
          } catch (err) {
            console.error(`  ✗ Failed brand logo for ${brand.name}:`, err.message);
            report.failed.push({ item: brand.name, error: err.message });
          }
        }
      }
    } else if (brand.logoUrl && brand.logoUrl.includes('res.cloudinary.com')) {
      report.skippedAlreadyCloudinary++;
    }
  }

  // 2. Migrate Category Banners
  console.log('\n[2/4] Inspecting Category Banners...');
  const categories = await Category.find({});
  for (const cat of categories) {
    if (cat.heroImage && cat.heroImage.url && cat.heroImage.url.startsWith('/assets/')) {
      const localPath = path.join(publicDir, cat.heroImage.url.replace(/^\//, ''));
      if (fs.existsSync(localPath)) {
        if (isDryRun) {
          console.log(`  [Dry-Run] Would upload category banner: ${cat.name} -> ${cat.heroImage.url}`);
          report.categoriesMigrated++;
        } else {
          try {
            const res = await uploadLocalFile(localPath, CLOUDINARY_FOLDERS.categories, 'image');
            if (res && res.url) {
              await Category.updateOne({ _id: cat._id }, {
                $set: {
                  'heroImage.url': res.url,
                  'heroImage.publicId': res.publicId,
                  'heroImage.format': res.format || 'webp',
                  'heroImage.width': res.width || 0,
                  'heroImage.height': res.height || 0
                }
              });
              console.log(`  ✓ Migrated category banner: ${cat.name} -> ${res.url}`);
              report.categoriesMigrated++;
            }
          } catch (err) {
            console.error(`  ✗ Failed category banner for ${cat.name}:`, err.message);
            report.failed.push({ item: cat.name, error: err.message });
          }
        }
      }
    } else if (cat.heroImage && cat.heroImage.url && cat.heroImage.url.includes('res.cloudinary.com')) {
      report.skippedAlreadyCloudinary++;
    }
  }

  // 3. Migrate Product Images
  console.log('\n[3/4] Inspecting Product Images...');
  const products = await Product.find({ deletedAt: null });
  for (const product of products) {
    let imagesModified = false;
    const newImages = [];

    for (let i = 0; i < (product.images || []).length; i++) {
      const img = product.images[i];
      if (img.url && img.url.startsWith('/assets/')) {
        const localPath = path.join(publicDir, img.url.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          if (isDryRun) {
            console.log(`  [Dry-Run] Would upload product image: ${product.name} [${i}] -> ${img.url}`);
            report.productImagesMigrated++;
            newImages.push(img);
          } else {
            try {
              const res = await uploadLocalFile(localPath, CLOUDINARY_FOLDERS.products, 'image');
              if (res && res.url) {
                newImages.push({
                  url: res.url,
                  publicId: res.publicId,
                  format: res.format || 'webp',
                  width: res.width || 0,
                  height: res.height || 0,
                  isPrimary: img.isPrimary !== undefined ? img.isPrimary : i === 0
                });
                imagesModified = true;
                report.productImagesMigrated++;
                console.log(`  ✓ Migrated product image: ${product.name} [${i}]`);
              } else {
                newImages.push(img);
              }
            } catch (err) {
              console.error(`  ✗ Failed product image for ${product.name}:`, err.message);
              report.failed.push({ item: `${product.name} (img ${i})`, error: err.message });
              newImages.push(img);
            }
          }
        } else {
          newImages.push(img);
        }
      } else {
        newImages.push(img);
        if (img.url && img.url.includes('res.cloudinary.com')) {
          report.skippedAlreadyCloudinary++;
        }
      }
    }

    if (!isDryRun && imagesModified) {
      await Product.updateOne({ _id: product._id }, { $set: { images: newImages } });
    }

    // 4. Migrate Product Brochure
    if (product.brochure && product.brochure.url && product.brochure.url.startsWith('/assets/')) {
      const localPdfPath = path.join(publicDir, product.brochure.url.replace(/^\//, ''));
      if (fs.existsSync(localPdfPath)) {
        if (isDryRun) {
          console.log(`  [Dry-Run] Would upload brochure: ${product.name} -> ${product.brochure.url}`);
          report.brochuresMigrated++;
        } else {
          try {
            const res = await uploadLocalFile(localPdfPath, CLOUDINARY_FOLDERS.brochures, 'raw');
            if (res && res.url) {
              await Product.updateOne({ _id: product._id }, {
                $set: {
                  'brochure.url': res.url,
                  'brochure.publicId': res.publicId,
                  'brochure.format': 'pdf',
                  'brochure.filename': product.brochure.filename || path.basename(localPdfPath)
                }
              });
              console.log(`  ✓ Migrated brochure: ${product.name} -> ${res.url}`);
              report.brochuresMigrated++;
            }
          } catch (err) {
            console.error(`  ✗ Failed brochure for ${product.name}:`, err.message);
            report.failed.push({ item: `${product.name} (brochure)`, error: err.message });
          }
        }
      }
    } else if (product.brochure && product.brochure.url && product.brochure.url.includes('res.cloudinary.com')) {
      report.skippedAlreadyCloudinary++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('  MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`  Mode                         : ${isDryRun ? 'DRY-RUN (Simulated)' : 'LIVE (Uploaded to Cloudinary)'}`);
  console.log(`  Brand Logos Migrated         : ${report.brandsMigrated}`);
  console.log(`  Category Banners Migrated    : ${report.categoriesMigrated}`);
  console.log(`  Product Images Migrated      : ${report.productImagesMigrated}`);
  console.log(`  Brochures Migrated           : ${report.brochuresMigrated}`);
  console.log(`  Already Cloudinary (Skipped) : ${report.skippedAlreadyCloudinary}`);
  console.log(`  Failures                     : ${report.failed.length}`);
  console.log('═══════════════════════════════════════════════════════════════════════');

  process.exit(0);
}

if (require.main === module) {
  migrateAssets().catch(err => {
    console.error('Migration fatal error:', err);
    process.exit(1);
  });
}

module.exports = { migrateAssets };

