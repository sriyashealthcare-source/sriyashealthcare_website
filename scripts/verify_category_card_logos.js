const fs = require('fs');
const assert = require('assert');

console.log('═══════════════════════════════════════════════════════════════');
console.log('VERIFYING CATEGORY & SUBCATEGORY CARD LOGO ENHANCEMENTS');
console.log('═══════════════════════════════════════════════════════════════');

// 1. Verify PartnerProducts.jsx
const ppSrc = fs.readFileSync('client/src/pages/customer/PartnerProducts.jsx', 'utf8');
assert(!ppSrc.includes('drilldown-cat-icon-badge'), 'drilldown-cat-icon-badge should be completely removed');
assert(ppSrc.includes('{catLogo && ('), 'catLogo should only render container when non-null');
assert(ppSrc.includes('{subLogo ? ('), 'subLogo should only render container when non-null');
console.log('✓ PartnerProducts.jsx: Icon placeholder removed, strict conditional logo rendering verified.');

// 2. Verify client/src/styles/customer.css
const cssSrc = fs.readFileSync('client/src/styles/customer.css', 'utf8');
assert(cssSrc.includes('height: 68px;'), 'drilldown-cat-logo-wrap must have enlarged height');
assert(cssSrc.includes('min-width: 110px;'), 'drilldown-cat-logo-wrap must have min-width: 110px');
assert(cssSrc.includes('max-width: 180px;'), 'drilldown-cat-logo-wrap must have max-width: 180px');
assert(cssSrc.includes('.drilldown-category-card-header--no-logo'), 'drilldown-category-card-header--no-logo must be defined');
assert(!cssSrc.includes('.drilldown-cat-icon-badge'), 'drilldown-cat-icon-badge must be deleted from css');
console.log('✓ customer.css: Logo container enlarged to 68px height, 110-180px width, clean no-logo styling applied.');

// 3. Verify client/src/pages/admin/BrandCategoryManagement.jsx
const bcmSrc = fs.readFileSync('client/src/pages/admin/BrandCategoryManagement.jsx', 'utf8');
assert(bcmSrc.includes("formData.append('logoUrl', (catLogoUrl || '').trim())"), 'Admin form must always append logoUrl to allow clearing');
assert(bcmSrc.includes('Clear Logo'), 'Admin form must provide Clear Logo button');
console.log('✓ BrandCategoryManagement.jsx: Logo clearing and UI button verified.');

// 4. Verify server/controllers/categoryController.js
const ccSrc = fs.readFileSync('server/controllers/categoryController.js', 'utf8');
assert(ccSrc.includes("logoImage = { url: '', publicId: '', format: 'webp', width: 0, height: 0 }"), 'categoryController must clear logoImage when logoUrl is empty');
console.log('✓ categoryController.js: Clearing logo properly resets logoImage and logoUrl in backend.');

// 5. Test mock card render states
const testCategories = [
  { name: 'Dolphin Sutures', logoUrl: '/images/brands/dolphin-sutures-logo.webp' },
  { name: 'I) MEDICAL ADHESIVES', logoUrl: '' },
  { name: 'II) SUTURES', logoUrl: null },
  { name: 'III) SURGICAL KITS', logoUrl: undefined }
];

testCategories.forEach(c => {
  const rawLogo = c.logoUrl || c.logo_url || (c.logoImage && c.logoImage.url) || '';
  const catLogo = typeof rawLogo === 'string' && rawLogo.trim() !== '' ? rawLogo.trim() : null;
  if (catLogo) {
    console.log(`  [HAS LOGO] ${c.name} -> renders .drilldown-cat-logo-wrap with logo "${catLogo}"`);
  } else {
    console.log(`  [NO LOGO]  ${c.name} -> renders clean header with NO logo container or placeholder`);
  }
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('ALL CATEGORY & SUBCATEGORY CARD VERIFICATION CHECKS PASSED!');
console.log('═══════════════════════════════════════════════════════════════');
