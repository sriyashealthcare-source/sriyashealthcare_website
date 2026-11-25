const https = require('https');

const RENDER_BASE = 'https://sriyashealthcare-website.onrender.com/api';

function requestApi(endpoint, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(RENDER_BASE + endpoint);
    const bodyStr = data ? JSON.stringify(data) : null;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    if (bodyStr) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(url, { method, headers, timeout: 35000 }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(resData);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout ' + endpoint));
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function run() {
  console.log('[1/3] Logging in to live Render backend...');
  const loginRes = await requestApi('/auth/login', 'POST', {
    email: 'admin@sriyashealthcare.com',
    password: 'Sriyas@2026'
  });

  if (!loginRes.data?.token) {
    console.error('Failed to log in to Render:', loginRes);
    process.exit(1);
  }
  const token = loginRes.data.token;
  console.log('  ✓ Authenticated with Render.');

  console.log('[2/3] Fetching admin categories from Render...');
  const catRes = await requestApi('/admin/categories', 'GET', null, token);
  const categories = catRes.data?.categories || [];
  console.log(`  ✓ Found ${categories.length} total categories.`);

  const ds = categories.find(c => c.slug === 'dolphin-sutures' || c.name === 'Dolphin Sutures');
  if (ds) {
    console.log(`[3/3] Updating Dolphin Sutures category (ID: ${ds._id})...`);
    const updateRes = await requestApi(`/admin/categories/${ds._id}`, 'PUT', {
      name: 'Dolphin Sutures',
      logoUrl: '/images/brands/dolphin-sutures-logo.webp',
      description: 'Comprehensive portfolio of world-class absorbable, non-absorbable, specialty sutures, surgical mesh, skin staplers, clips, and hemostats.',
      hasSubcategories: true
    }, token);
    console.log('  ✓ Dolphin Sutures updated:', updateRes.status, updateRes.data?.category?.logoUrl);
  } else {
    console.log('  Dolphin Sutures category not found in Render categories list.');
  }

  console.log('\nAll done syncing to Render.');
}

run().catch(console.error);
