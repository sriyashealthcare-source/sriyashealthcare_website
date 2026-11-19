/**
 * Sriyas Healthcare — Complete Cloudinary Asset Migration Script
 * Migrates all website images and documents from client/public/assets/ to Cloudinary
 * in strict accordance with the user-defined folder hierarchy.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');
const publicDir = path.join(clientDir, 'public');

// Ensure server node_modules are accessible
const serverNodeModules = path.join(serverDir, 'node_modules');
if (fs.existsSync(serverNodeModules) && !module.paths.includes(serverNodeModules)) {
  module.paths.unshift(serverNodeModules);
}

require('dotenv').config({ path: path.join(rootDir, '.env') });
const { configureCloudinary, cloudinary, isCloudinaryConfigured } = require('../server/config/cloudinary');

const ASSET_MAPPING = [
  // ─── 1. HOMEPAGE & BRAND LOGOS ───
  {
    localUrl: '/assets/logos/sriyas-hero-logo.png',
    localFile: path.join(publicDir, 'assets/logos/sriyas-hero-logo.png'),
    folder: 'sriyas-healthcare/homepage/hero',
    publicId: 'sriyas-hero-logo',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/logos/sriyas-emblem.png',
    localFile: path.join(publicDir, 'assets/logos/sriyas-emblem.png'),
    folder: 'sriyas-healthcare/general',
    publicId: 'sriyas-emblem',
    resourceType: 'image'
  },
  {
    localUrl: 'https://sriyashealthcare.com/assets/logos/sriyas-emblem.png',
    localFile: path.join(publicDir, 'assets/logos/sriyas-emblem.png'),
    folder: 'sriyas-healthcare/general',
    publicId: 'sriyas-emblem',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/logos/peters-surgical.png',
    localFile: path.join(publicDir, 'assets/logos/peters-surgical.png'),
    folder: 'sriyas-healthcare/brands',
    publicId: 'peters-surgical-logo',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/logos/liquiband.png',
    localFile: path.join(publicDir, 'assets/logos/liquiband.png'),
    folder: 'sriyas-healthcare/brands',
    publicId: 'liquiband-logo',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/logos/advanced-medical-solutions.png',
    localFile: path.join(publicDir, 'assets/logos/advanced-medical-solutions.png'),
    folder: 'sriyas-healthcare/brands',
    publicId: 'advanced-medical-solutions-logo',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/logos/gore.png',
    localFile: path.join(publicDir, 'assets/logos/gore.png'),
    folder: 'sriyas-healthcare/brands',
    publicId: 'gore-logo',
    resourceType: 'image'
  },

  // ─── 2. CONTACT ───
  {
    localUrl: '/assets/contact/storefront-location.jpg',
    localFile: path.join(publicDir, 'assets/contact/storefront-location.jpg'),
    folder: 'sriyas-healthcare/contact',
    publicId: 'storefront-location',
    resourceType: 'image'
  },

  // ─── 3. HOMEPAGE GALLERY & PLACEHOLDERS ───
  {
    localUrl: '/assets/placeholders/office-reception-placeholder.jpg',
    localFile: path.join(publicDir, 'assets/placeholders/office-reception-placeholder.jpg'),
    folder: 'sriyas-healthcare/homepage/gallery',
    publicId: 'office-reception',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/placeholders/workplace-workspace-placeholder.jpg',
    localFile: path.join(publicDir, 'assets/placeholders/workplace-workspace-placeholder.jpg'),
    folder: 'sriyas-healthcare/homepage/gallery',
    publicId: 'workplace-workspace',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/placeholders/healthcare-operations-placeholder.jpg',
    localFile: path.join(publicDir, 'assets/placeholders/healthcare-operations-placeholder.jpg'),
    folder: 'sriyas-healthcare/homepage/gallery',
    publicId: 'healthcare-operations',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/placeholders/portrait-leadership-placeholder.svg',
    localFile: path.join(publicDir, 'assets/placeholders/portrait-leadership-placeholder.svg'),
    folder: 'sriyas-healthcare/homepage/leadership',
    publicId: 'portrait-leadership-placeholder',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/placeholders/portrait-team-placeholder.svg',
    localFile: path.join(publicDir, 'assets/placeholders/portrait-team-placeholder.svg'),
    folder: 'sriyas-healthcare/homepage/team',
    publicId: 'portrait-team-placeholder',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/placeholders/cta-backdrop-placeholder.jpg',
    localFile: path.join(publicDir, 'assets/placeholders/cta-backdrop-placeholder.jpg'),
    folder: 'sriyas-healthcare/banners',
    publicId: 'cta-backdrop',
    resourceType: 'image'
  },

  // ─── 4. CATEGORIES ───
  {
    localUrl: '/assets/categories/cat-cutimed-wound-care-infection-management.png',
    localFile: path.join(publicDir, 'assets/categories/cat-cutimed-wound-care-infection-management.png'),
    folder: 'sriyas-healthcare/categories',
    publicId: 'cat-cutimed-wound-care',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/categories/cat-gentacoll-haemostasis-antibiotic-collagen-sponge.png',
    localFile: path.join(publicDir, 'assets/categories/cat-gentacoll-haemostasis-antibiotic-collagen-sponge.png'),
    folder: 'sriyas-healthcare/categories',
    publicId: 'cat-gentacoll-haemostasis',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/categories/cat-gore-absorbable-biomaterials-tissue-reinforcement.png',
    localFile: path.join(publicDir, 'assets/categories/cat-gore-absorbable-biomaterials-tissue-reinforcement.png'),
    folder: 'sriyas-healthcare/categories',
    publicId: 'cat-gore-biomaterials',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/categories/cat-liquiband-hernia-mesh-fixation.png',
    localFile: path.join(publicDir, 'assets/categories/cat-liquiband-hernia-mesh-fixation.png'),
    folder: 'sriyas-healthcare/categories',
    publicId: 'cat-liquiband-mesh-fixation',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/categories/cat-liquiband-topical-skin-adhesive.png',
    localFile: path.join(publicDir, 'assets/categories/cat-liquiband-topical-skin-adhesive.png'),
    folder: 'sriyas-healthcare/categories',
    publicId: 'cat-liquiband-skin-adhesive',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/categories/cat-peters-barbed-sutures-knotless.png',
    localFile: path.join(publicDir, 'assets/categories/cat-peters-barbed-sutures-knotless.png'),
    folder: 'sriyas-healthcare/categories',
    publicId: 'cat-peters-barbed-sutures',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/categories/cat-peters-haemostasis-titanium-clips.png',
    localFile: path.join(publicDir, 'assets/categories/cat-peters-haemostasis-titanium-clips.png'),
    folder: 'sriyas-healthcare/categories',
    publicId: 'cat-peters-titanium-clips',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/categories/cat-peters-natural-absorbable-sutures.png',
    localFile: path.join(publicDir, 'assets/categories/cat-peters-natural-absorbable-sutures.png'),
    folder: 'sriyas-healthcare/categories',
    publicId: 'cat-peters-natural-sutures',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/categories/cat-peters-non-absorbable-sutures.png',
    localFile: path.join(publicDir, 'assets/categories/cat-peters-non-absorbable-sutures.png'),
    folder: 'sriyas-healthcare/categories',
    publicId: 'cat-peters-non-absorbable',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/categories/cat-peters-surgical-adhesive.png',
    localFile: path.join(publicDir, 'assets/categories/cat-peters-surgical-adhesive.png'),
    folder: 'sriyas-healthcare/categories',
    publicId: 'cat-peters-surgical-adhesive',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/categories/cat-peters-surgical-kits-obstetrics.png',
    localFile: path.join(publicDir, 'assets/categories/cat-peters-surgical-kits-obstetrics.png'),
    folder: 'sriyas-healthcare/categories',
    publicId: 'cat-peters-obstetrics-kits',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/categories/cat-peters-surgical-mesh.png',
    localFile: path.join(publicDir, 'assets/categories/cat-peters-surgical-mesh.png'),
    folder: 'sriyas-healthcare/categories',
    publicId: 'cat-peters-surgical-mesh',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/categories/cat-peters-synthetic-absorbable-sutures.png',
    localFile: path.join(publicDir, 'assets/categories/cat-peters-synthetic-absorbable-sutures.png'),
    folder: 'sriyas-healthcare/categories',
    publicId: 'cat-peters-synthetic-sutures',
    resourceType: 'image'
  },

  // ─── 5. PETERS SURGICAL PRODUCTS ───
  {
    localUrl: '/assets/products/catgut-1.png',
    localFile: path.join(publicDir, 'assets/products/catgut-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'catgut-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/csection-1.png',
    localFile: path.join(publicDir, 'assets/products/csection-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'csection-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/filbloc-1.png',
    localFile: path.join(publicDir, 'assets/products/filbloc-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'filbloc-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/filbloc90-1.png',
    localFile: path.join(publicDir, 'assets/products/filbloc90-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'filbloc90-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/filbloc90-2.png',
    localFile: path.join(publicDir, 'assets/products/filbloc90-2.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'filbloc90-2',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/filbloc_perm-1.png',
    localFile: path.join(publicDir, 'assets/products/filbloc_perm-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'filbloc_perm-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/icol-1.png',
    localFile: path.join(publicDir, 'assets/products/icol-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'icol-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/icol_fast-1.png',
    localFile: path.join(publicDir, 'assets/products/icol_fast-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'icol_fast-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/ifabond-1.png',
    localFile: path.join(publicDir, 'assets/products/ifabond-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'ifabond-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/ifabond-2.png',
    localFile: path.join(publicDir, 'assets/products/ifabond-2.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'ifabond-2',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/monocol-1.png',
    localFile: path.join(publicDir, 'assets/products/monocol-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'monocol-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/polycol-1.png',
    localFile: path.join(publicDir, 'assets/products/polycol-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'polycol-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/steribon-1.png',
    localFile: path.join(publicDir, 'assets/products/steribon-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'steribon-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/stericryl-1.png',
    localFile: path.join(publicDir, 'assets/products/stericryl-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'stericryl-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/sterilene_mesh-1.png',
    localFile: path.join(publicDir, 'assets/products/sterilene_mesh-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'sterilene_mesh-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/sterilene_mesh-2.png',
    localFile: path.join(publicDir, 'assets/products/sterilene_mesh-2.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'sterilene_mesh-2',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/sterilene_suture-1.png',
    localFile: path.join(publicDir, 'assets/products/sterilene_suture-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'sterilene_suture-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/sterilon-1.png',
    localFile: path.join(publicDir, 'assets/products/sterilon-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'sterilon-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/sterisil-1.png',
    localFile: path.join(publicDir, 'assets/products/sterisil-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'sterisil-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/titanium-1.png',
    localFile: path.join(publicDir, 'assets/products/titanium-1.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'titanium-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/titanium-2.png',
    localFile: path.join(publicDir, 'assets/products/titanium-2.png'),
    folder: 'sriyas-healthcare/products/peters-surgical',
    publicId: 'titanium-2',
    resourceType: 'image'
  },

  // ─── 6. LIQUIBAND PRODUCTS ───
  {
    localUrl: '/assets/products/lb_optima-1.png',
    localFile: path.join(publicDir, 'assets/products/lb_optima-1.png'),
    folder: 'sriyas-healthcare/products/liquiband',
    publicId: 'lb_optima-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/lb_optima-2.png',
    localFile: path.join(publicDir, 'assets/products/lb_optima-2.png'),
    folder: 'sriyas-healthcare/products/liquiband',
    publicId: 'lb_optima-2',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/lb_exceed-1.png',
    localFile: path.join(publicDir, 'assets/products/lb_exceed-1.png'),
    folder: 'sriyas-healthcare/products/liquiband',
    publicId: 'lb_exceed-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/lb_exceed-2.png',
    localFile: path.join(publicDir, 'assets/products/lb_exceed-2.png'),
    folder: 'sriyas-healthcare/products/liquiband',
    publicId: 'lb_exceed-2',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/fix8-1.png',
    localFile: path.join(publicDir, 'assets/products/fix8-1.png'),
    folder: 'sriyas-healthcare/products/liquiband',
    publicId: 'fix8-1',
    resourceType: 'image'
  },

  // ─── 7. CUTIMED SORBACT PRODUCTS ───
  {
    localUrl: '/assets/products/cutimed_sorbact-1.png',
    localFile: path.join(publicDir, 'assets/products/cutimed_sorbact-1.png'),
    folder: 'sriyas-healthcare/products/cutimed-sorbact',
    publicId: 'cutimed_sorbact-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/cutimed_siltec-1.png',
    localFile: path.join(publicDir, 'assets/products/cutimed_siltec-1.png'),
    folder: 'sriyas-healthcare/products/cutimed-sorbact',
    publicId: 'cutimed_siltec-1',
    resourceType: 'image'
  },

  // ─── 8. GENTA-COLL PRODUCTS ───
  {
    localUrl: '/assets/products/gentacoll-1.png',
    localFile: path.join(publicDir, 'assets/products/gentacoll-1.png'),
    folder: 'sriyas-healthcare/products/genta-coll',
    publicId: 'gentacoll-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/gentacoll-2.png',
    localFile: path.join(publicDir, 'assets/products/gentacoll-2.png'),
    folder: 'sriyas-healthcare/products/genta-coll',
    publicId: 'gentacoll-2',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/gentacoll-3.png',
    localFile: path.join(publicDir, 'assets/products/gentacoll-3.png'),
    folder: 'sriyas-healthcare/products/genta-coll',
    publicId: 'gentacoll-3',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/gentacoll-4.png',
    localFile: path.join(publicDir, 'assets/products/gentacoll-4.png'),
    folder: 'sriyas-healthcare/products/genta-coll',
    publicId: 'gentacoll-4',
    resourceType: 'image'
  },

  // ─── 9. W. L. GORE PRODUCTS ───
  {
    localUrl: '/assets/products/gore_bioa-1.png',
    localFile: path.join(publicDir, 'assets/products/gore_bioa-1.png'),
    folder: 'sriyas-healthcare/products/gore',
    publicId: 'gore_bioa-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/gore_synecor_ip-1.png',
    localFile: path.join(publicDir, 'assets/products/gore_synecor_ip-1.png'),
    folder: 'sriyas-healthcare/products/gore',
    publicId: 'gore_synecor_ip-1',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/gore_synecor_ip-2.png',
    localFile: path.join(publicDir, 'assets/products/gore_synecor_ip-2.png'),
    folder: 'sriyas-healthcare/products/gore',
    publicId: 'gore_synecor_ip-2',
    resourceType: 'image'
  },
  {
    localUrl: '/assets/products/gore_synecor_ip-3.png',
    localFile: path.join(publicDir, 'assets/products/gore_synecor_ip-3.png'),
    folder: 'sriyas-healthcare/products/gore',
    publicId: 'gore_synecor_ip-3',
    resourceType: 'image'
  },

  // ─── 10. PRODUCT BROCHURES (RAW PDF) ───
  {
    localUrl: '/assets/documents/GORE_BIO-A_Tissue_Reinforcement_Brochure.pdf',
    localFile: path.join(publicDir, 'assets/documents/GORE_BIO-A_Tissue_Reinforcement_Brochure.pdf'),
    folder: 'sriyas-healthcare/documents',
    publicId: 'gore-bio-a-brochure',
    resourceType: 'raw'
  },
  {
    localUrl: '/assets/documents/GORE_SYNECOR_IP_Biomaterial_Brochure.pdf',
    localFile: path.join(publicDir, 'assets/documents/GORE_SYNECOR_IP_Biomaterial_Brochure.pdf'),
    folder: 'sriyas-healthcare/documents',
    publicId: 'gore-synecor-ip-brochure',
    resourceType: 'raw'
  }
];

async function uploadAsset(entry, dryRun = false) {
  const fullPublicId = `${entry.folder}/${entry.publicId}`;

  if (dryRun) {
    console.log(`[DRY-RUN] Would upload: ${entry.localUrl} -> ${fullPublicId}`);
    return {
      localUrl: entry.localUrl,
      publicId: fullPublicId,
      url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${entry.resourceType}/upload/v1/${fullPublicId}.${path.extname(entry.localFile).replace('.', '')}`,
      status: 'simulated'
    };
  }

  // Upload to Cloudinary with explicit public_id, folder, and auto transformations
  const uploadOptions = {
    public_id: entry.publicId,
    folder: entry.folder,
    resource_type: entry.resourceType,
    overwrite: true,
    use_filename: false,
    unique_filename: false
  };

  if (entry.resourceType === 'image' && !entry.localFile.endsWith('.svg')) {
    uploadOptions.transformation = [
      { quality: 'auto', fetch_format: 'auto' }
    ];
  }

  const result = await cloudinary.uploader.upload(entry.localFile, uploadOptions);
  return {
    localUrl: entry.localUrl,
    publicId: result.public_id,
    url: result.secure_url,
    format: result.format,
    width: result.width || 0,
    height: result.height || 0,
    bytes: result.bytes || 0,
    resourceType: result.resource_type,
    status: 'uploaded'
  };
}

async function runMigration({ dryRun = false } = {}) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  SRIYAS HEALTHCARE — CLOUDINARY MIGRATION SUITE ${dryRun ? '(DRY-RUN)' : '(LIVE)'}`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary credentials missing in .env!');
  }
  configureCloudinary();

  console.log(`\n[Stage 1] Validating local files for ${ASSET_MAPPING.length} entries...`);
  const missingFiles = [];
  for (const entry of ASSET_MAPPING) {
    if (!fs.existsSync(entry.localFile)) {
      missingFiles.push(entry.localFile);
    }
  }

  if (missingFiles.length > 0) {
    console.error(`Error: ${missingFiles.length} local files missing:`, missingFiles);
    throw new Error('Missing local files required for migration.');
  }
  console.log('  ✓ All local assets verified on disk.');

  console.log(`\n[Stage 2] Uploading ${ASSET_MAPPING.length} assets to Cloudinary...`);
  const manifest = {};
  let uploadCount = 0;
  let failCount = 0;

  for (let i = 0; i < ASSET_MAPPING.length; i++) {
    const entry = ASSET_MAPPING[i];
    try {
      const res = await uploadAsset(entry, dryRun);
      manifest[entry.localUrl] = res;
      uploadCount++;
      console.log(`  [${i + 1}/${ASSET_MAPPING.length}] ✓ ${res.publicId} -> ${res.url}`);
    } catch (err) {
      failCount++;
      console.error(`  [${i + 1}/${ASSET_MAPPING.length}] ✗ FAILED ${entry.localUrl}:`, err.message);
    }
  }

  console.log(`\nUpload complete: ${uploadCount} succeeded, ${failCount} failed.`);
  if (failCount > 0) {
    throw new Error(`Migration encountered ${failCount} failures.`);
  }

  // Save migration manifest
  const manifestPath = path.join(serverDir, 'data', 'cloudinary_migration_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\n  ✓ Saved Migration Manifest to: ${manifestPath}`);

  return manifest;
}

if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');
  runMigration({ dryRun: isDryRun }).catch(err => {
    console.error('\n[Migration Fatal Error]:', err);
    process.exit(1);
  });
}

module.exports = {
  ASSET_MAPPING,
  runMigration
};
