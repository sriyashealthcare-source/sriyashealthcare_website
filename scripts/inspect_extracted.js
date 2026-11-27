const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scripts/dolphin_mesh_extracted.json'));
console.log('Total Products extracted:', data.length);
let totalCodes = 0;
data.forEach((p, idx) => {
  totalCodes += p.productCodes.length;
  console.log(`[${idx + 1}] ${p.name} -> Subcat: "${p.subcatName}"`);
  console.log(`    Subtitle: "${p.subtitle}"`);
  console.log(`    Codes: ${p.productCodes.length} (e.g. ${p.productCodes.slice(0, 3).map(c => c.code).join(', ')}...)`);
  console.log(`    Images: ${p.images.join(', ')}`);
});
console.log('\nTotal Product Codes:', totalCodes);
