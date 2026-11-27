const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scripts/dolphin_mesh_extracted.json'));

data.forEach((p, idx) => {
  console.log(`\n======================================================`);
  console.log(`[${idx + 1}] ${p.name} (${p.subtitle})`);
  console.log(`Lead: ${p.lead}`);
  console.log(`Features count: ${p.features.length}`);
  console.log(`Specs count: ${Object.keys(p.specs).length}`, p.specs);
  console.log(`Composition: ${p.compositionText.slice(0, 100)}...`);
  console.log(`Characteristics: ${p.characteristicsText.slice(0, 100)}...`);
  console.log(`Applications:`, p.applications);
});
