const EventEmitter = require('events');
const { connectDatabase } = require('../server/config/database');
const app = require('../server/app');

function makeMockRequest(method, url) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = { host: 'localhost' };
  req.connection = { remoteAddress: '127.0.0.1' };
  req.socket = req.connection;
  return req;
}

function makeMockResponse() {
  const res = new EventEmitter();
  res.statusCode = 200;
  res._headers = {};
  res._body = '';

  res.setHeader = (k, v) => { res._headers[k.toLowerCase()] = v; };
  res.getHeader = (k) => res._headers[k.toLowerCase()];
  res.removeHeader = (k) => { delete res._headers[k.toLowerCase()]; };
  res.writeHead = (status, headers) => {
    res.statusCode = status;
    if (headers) {
      Object.keys(headers).forEach(k => res.setHeader(k, headers[k]));
    }
  };
  res.write = (chunk) => { res._body += chunk; };
  res.end = (chunk) => {
    if (chunk) res._body += chunk;
    res.emit('finish');
  };
  return res;
}

function executeRoute(method, url) {
  return new Promise((resolve, reject) => {
    const req = makeMockRequest(method, url);
    const res = makeMockResponse();

    res.on('finish', () => {
      let json = null;
      try {
        json = JSON.parse(res._body);
      } catch (_) {
        json = res._body;
      }
      resolve({ status: res.statusCode, headers: res._headers, body: json });
    });

    try {
      app(req, res, (err) => {
        if (err) reject(err);
        else resolve({ status: res.statusCode, headers: res._headers, body: res._body });
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function runTests() {
  console.log('Initializing database connection (using local adapter for offline test)...');
  process.env.MONGODB_URI = '';
  await connectDatabase();
  console.log('Testing Express API endpoints via in-memory mock request/response...');

  // Test 1: GET /api/brands
  const res1 = await executeRoute('GET', '/api/brands');
  console.log('1. GET /api/brands status:', res1.status);
  console.log('   Brand count:', res1.body?.count);
  console.log('   Brands:', (res1.body?.brands || []).map(b => `${b.name} (${b.slug}) [${b.productCount} prods]`));
  if (res1.status !== 200 || !res1.body?.brands || res1.body.brands.length === 0) {
    throw new Error('GET /api/brands failed or returned no brands');
  }

  // Test 2: GET /api/brands/peters
  const res2 = await executeRoute('GET', '/api/brands/peters');
  console.log('2. GET /api/brands/peters status:', res2.status);
  console.log('   Name:', res2.body?.brand?.name);
  console.log('   Product count:', res2.body?.brand?.productCount);
  if (res2.status !== 200 || res2.body?.brand?.name !== 'Peters Surgical') {
    throw new Error('GET /api/brands/peters failed');
  }

  // Test 3: GET /api/brands/liquiband
  const res3 = await executeRoute('GET', '/api/brands/liquiband');
  console.log('3. GET /api/brands/liquiband status:', res3.status);
  console.log('   Name:', res3.body?.brand?.name);
  if (res3.status !== 200 || !res3.body?.brand) {
    throw new Error('GET /api/brands/liquiband failed');
  }

  // Test 4: GET /api/brands/nonexistent
  const res4 = await executeRoute('GET', '/api/brands/unknown-brand-xyz');
  console.log('4. GET /api/brands/unknown-brand-xyz status (expected 404):', res4.status);
  if (res4.status !== 404) {
    throw new Error('Expected 404 for unknown brand');
  }

  // Test 5: GET /api/products?brand=peters
  const res5 = await executeRoute('GET', '/api/products?brand=peters');
  console.log('5. GET /api/products?brand=peters status:', res5.status);
  console.log('   Peters products count:', res5.body?.products?.length);
  if (res5.status !== 200 || !Array.isArray(res5.body?.products)) {
    throw new Error('GET /api/products?brand=peters failed: ' + JSON.stringify(res5.body));
  }
  const allPeters = res5.body.products.every(p => {
    const bSlug = p.brand?.slug || p.brand;
    return bSlug === 'peters' || String(p.brand?._id || p.brand) === String(res2.body.brand._id);
  });
  console.log('   All products belong strictly to Peters?', allPeters);
  if (!allPeters) {
    throw new Error('Found product not belonging to Peters in brand-filtered query');
  }

  // Test 6: GET /api/products?brand=liquiband
  const res6 = await executeRoute('GET', '/api/products?brand=liquiband');
  console.log('6. GET /api/products?brand=liquiband status:', res6.status);
  console.log('   LiquiBand products count:', res6.body?.products?.length);
  if (res6.status !== 200 || !Array.isArray(res6.body?.products)) {
    throw new Error('GET /api/products?brand=liquiband failed');
  }

  // Test 7: GET /api/products/brand/peters
  const res7 = await executeRoute('GET', '/api/products/brand/peters');
  console.log('7. GET /api/products/brand/peters status:', res7.status);
  console.log('   Brand name:', res7.body?.brand?.name);
  console.log('   Products count:', res7.body?.products?.length);
  if (res7.status !== 200 || !res7.body?.brand) {
    throw new Error('GET /api/products/brand/peters failed');
  }

  // Test 8: GET /api/categories?brand=peters
  const res8 = await executeRoute('GET', '/api/categories?brand=peters');
  console.log('8. GET /api/categories?brand=peters status:', res8.status);
  console.log('   Categories count:', res8.body?.categories?.length);
  if (res8.status !== 200 || !Array.isArray(res8.body?.categories)) {
    throw new Error('GET /api/categories?brand=peters failed');
  }

  // Test 9: GET /api/products/slug/:slug
  const firstProd = res5.body.products[0];
  if (firstProd) {
    const res9 = await executeRoute('GET', `/api/products/slug/${firstProd.slug}`);
    console.log(`9. GET /api/products/slug/${firstProd.slug} status:`, res9.status);
    console.log('   Product name:', res9.body?.product?.name);
    console.log('   Product brand:', res9.body?.product?.brand?.name);
    if (res9.status !== 200 || !res9.body?.product) {
      throw new Error(`GET /api/products/slug/${firstProd.slug} failed`);
    }
  }

  // Test 10: GET /api/products?brand=peters&search=mesh
  const res10 = await executeRoute('GET', '/api/products?brand=peters&search=mesh');
  console.log('10. GET /api/products?brand=peters&search=mesh status:', res10.status);
  console.log('    Mesh products found:', res10.body?.products?.map(p => p.name));
  if (res10.status !== 200 || !res10.body?.products?.length) {
    throw new Error('Search failed to find mesh products');
  }

  console.log('\n=========================================');
  console.log('ALL 10 BACKEND TESTS PASSED SUCCESSFULLY!');
  console.log('=========================================');
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
