const https = require('https');
const fs = require('fs');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const html = await fetchUrl('https://dolphinmesh.com/knitted-polypropylene-mesh/');
  fs.writeFileSync('scripts/knit_sample.html', html);
  console.log('Saved knit_sample.html, length:', html.length);
}

run().catch(console.error);
