const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 30000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          const u = new URL(url);
          redirectUrl = new URL(redirectUrl, u.origin).toString();
        }
        return fetchUrl(redirectUrl).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout ' + url));
    });
  });
}

async function run() {
  console.log('[1] Fetching https://dolphinmesh.com/ ...');
  const home = await fetchUrl('https://dolphinmesh.com/');
  console.log('  Homepage status:', home.status, 'HTML length:', home.data.length);

  fs.writeFileSync(path.join(__dirname, 'dolphinmesh_home.html'), home.data);

  // Extract menu / links
  const links = [];
  const regex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(home.data)) !== null) {
    links.push(match[1]);
  }
  const uniqueLinks = [...new Set(links)];
  const productLinks = uniqueLinks.filter(l => 
    l.includes('knit') || l.includes('tiolene') || l.includes('silene') || 
    l.includes('teflene') || l.includes('ultralene') || l.includes('duolene') || 
    l.includes('monosolve') || l.includes('tacksure') || l.includes('mesh')
  );
  console.log('Relevant links found:', productLinks);
}

run().catch(console.error);
