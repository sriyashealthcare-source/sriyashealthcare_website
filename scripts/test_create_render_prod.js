const https = require('https');

async function testCreateProd() {
  // 1. Login
  const loginData = JSON.stringify({ email: 'admin@sriyashealthcare.com', password: 'Sriyas@2026' });
  const token = await new Promise((resolve, reject) => {
    const req = https.request('https://sriyashealthcare-website.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data).token));
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  // 2. Post test product
  const prodData = JSON.stringify({
    name: 'Petcryl 910® · Polyglactin 910 Sutures',
    slug: 'polyglactin-sutures',
    brand: '6b0701c15f4c0b292e887ee2',
    category: '6b071d33ff5454ef1b7691f0',
    shortSpecification: 'Copolymer of Glycolide and L-lactide (90:10) · USP 6-0 to 4',
    description: 'Petcryl 910 polyglactin 910 sutures — braided, coated synthetic absorbable sutures for soft tissue approximation and ligation.',
    cardCategory: 'Dolphin Sutures · Absorbable Sutures',
    detailCategory: 'Futura Medtech · Dolphin Sutures · Absorbable Sutures',
    imageUrls: ['https://sriyashealthcare-website.sriyashealthcare.workers.dev/images/products/dolphin-sutures/polyglactin-sutures.png'],
    features: ['Braided, coated construction', 'Predictable hydrolytic absorption', 'Secure knotting'],
    specifications: [
      { name: 'Material', value: 'Copolymer of Glycolide and L-lactide (90:10)' },
      { name: 'Coating', value: 'Poly (glycolide-co-L-lactide) with Calcium Stearate' }
    ],
    applications: ['General Surgery', 'Gynecology & Obstetrics'],
    isActive: true
  });

  const prodRes = await new Promise((resolve, reject) => {
    const req = https.request('https://sriyashealthcare-website.onrender.com/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(prodData),
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.write(prodData);
    req.end();
  });

  console.log('Create Product Response:', prodRes.status, prodRes.data);
}

testCreateProd().catch(console.error);
