const https = require('https');
const fs = require('fs');

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const knit3d = await fetchUrl('https://dolphinmesh.com/knit-3d-mesh/');
  const tacksure = await fetchUrl('https://dolphinmesh.com/mesh-tacker/');
  fs.writeFileSync('scripts/knit3d.html', knit3d);
  fs.writeFileSync('scripts/tacksure.html', tacksure);
  console.log('Saved knit3d and tacksure');
}

run().catch(console.error);
