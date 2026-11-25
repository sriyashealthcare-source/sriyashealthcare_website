const https = require('https');

async function testCreateCat() {
  // 1. Login
  const loginData = JSON.stringify({
    email: 'admin@sriyashealthcare.com',
    password: 'Sriyas@2026'
  });

  const token = await new Promise((resolve, reject) => {
    const req = https.request('https://sriyashealthcare-website.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        resolve(json.token);
      });
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  console.log('Got token:', token ? 'YES' : 'NO');

  // 2. Create Category
  const catData = JSON.stringify({
    name: 'Dolphin Sutures',
    slug: 'dolphin-sutures',
    brand: '6b0701c15f4c0b292e887ee2', // Futura Medtech brand ID on Render
    heroTitle: 'Dolphin Sutures Surgical Portfolio',
    description: 'Comprehensive range of high-precision surgical sutures, hernia meshes, staplers, ligation clips, and advanced wound closure solutions manufactured to ISO 13485 and CE standards.',
    displayOrder: 1,
    isActive: true
  });

  const catRes = await new Promise((resolve, reject) => {
    const req = https.request('https://sriyashealthcare-website.onrender.com/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(catData),
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.write(catData);
    req.end();
  });

  console.log('Create Category Response:', catRes.status, catRes.data);
}

testCreateCat().catch(console.error);
