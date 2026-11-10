const path = require('path');
const http = require('http');

// Load server/app
const app = require('../server/app');

async function runTests() {
  console.log('Testing Express API endpoints for Partner Browsing Flow...');

  // Start server on an ephemeral port
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  try {
    // Test 1: GET /api/brands
    const resBrands = await fetch(`${baseUrl}/api/brands`);
    const dataBrands = await resBrands.json();
    console.log('1. GET /api/brands status:', resBrands.status);
    console.log('   Brand count:', dataBrands.count);
    console.log('   Brand names & slugs:', (dataBrands.brands || []).map(b => `${b.name} (${b.slug}) - ${b.productCount} prods`));
    if (resBrands.status !== 200 || !dataBrands.brands || dataBrands.brands.length === 0) {
      throw new Error('GET /api/brands failed or returned no brands');
    }

    // Test 2: GET /api/brands/:slug (peters)
    const resPeters = await fetch(`${baseUrl}/api/brands/peters`);
    const dataPeters = await resPeters.json();
    console.log('2. GET /api/brands/peters status:', resPeters.status);
    console.log('   Partner name:', dataPeters.brand?.name);
    console.log('   Partner productCount:', dataPeters.brand?.productCount);
    if (resPeters.status !== 200 || dataPeters.brand?.name !== 'Peters Surgical') {
      throw new Error('GET /api/brands/peters failed');
    }

    // Test 3: GET /api/brands/:slug (liquiband)
    const resLiquiband = await fetch(`${baseUrl}/api/brands/liquiband`);
    const dataLiquiband = await resLiquiband.json();
    console.log('3. GET /api/brands/liquiband status:', resLiquiband.status);
    console.log('   Partner name:', dataLiquiband.brand?.name);
    if (resLiquiband.status !== 200 || !dataLiquiband.brand) {
      throw new Error('GET /api/brands/liquiband failed');
    }

    // Test 4: GET /api/brands/:slug (invalid)
    const resInvalidBrand = await fetch(`${baseUrl}/api/brands/unknown-brand-xyz`);
    console.log('4. GET /api/brands/unknown-brand-xyz status (expected 404):', resInvalidBrand.status);
    if (resInvalidBrand.status !== 404) {
      throw new Error('Expected 404 for unknown brand');
    }

    // Test 5: GET /api/products?brand=peters
    const resProdsPeters = await fetch(`${baseUrl}/api/products?brand=peters`);
    const dataProdsPeters = await resProdsPeters.json();
    console.log('5. GET /api/products?brand=peters status:', resProdsPeters.status);
    console.log('   Peters products count:', dataProdsPeters.products?.length);
    if (resProdsPeters.status !== 200) {
      throw new Error('GET /api/products?brand=peters failed: ' + JSON.stringify(dataProdsPeters));
    }
    const allPeters = dataProdsPeters.products.every(p => {
      const bSlug = p.brand?.slug || p.brand;
      return bSlug === 'peters' || String(p.brand?._id || p.brand) === String(dataPeters.brand._id);
    });
    console.log('   All products belong strictly to Peters?', allPeters);
    if (!allPeters) {
      throw new Error('Found product not belonging to Peters in brand-filtered query');
    }

    // Test 6: GET /api/products?brand=liquiband
    const resProdsLiquiband = await fetch(`${baseUrl}/api/products?brand=liquiband`);
    const dataProdsLiquiband = await resProdsLiquiband.json();
    console.log('6. GET /api/products?brand=liquiband status:', resProdsLiquiband.status);
    console.log('   LiquiBand products count:', dataProdsLiquiband.products?.length);
    if (resProdsLiquiband.status !== 200) {
      throw new Error('GET /api/products?brand=liquiband failed');
    }

    // Test 7: GET /api/products/brand/peters
    const resBrandRoute = await fetch(`${baseUrl}/api/products/brand/peters`);
    const dataBrandRoute = await resBrandRoute.json();
    console.log('7. GET /api/products/brand/peters status:', resBrandRoute.status);
    console.log('   Brand name:', dataBrandRoute.brand?.name);
    console.log('   Product count:', dataBrandRoute.products?.length);
    if (resBrandRoute.status !== 200) {
      throw new Error('GET /api/products/brand/peters failed');
    }

    // Test 8: GET /api/categories?brand=peters
    const resCatsPeters = await fetch(`${baseUrl}/api/categories?brand=peters`);
    const dataCatsPeters = await resCatsPeters.json();
    console.log('8. GET /api/categories?brand=peters status:', resCatsPeters.status);
    console.log('   Categories count:', dataCatsPeters.categories?.length);
    if (resCatsPeters.status !== 200) {
      throw new Error('GET /api/categories?brand=peters failed');
    }

    // Test 9: GET /api/products/slug/:slug
    const firstProd = dataProdsPeters.products[0];
    if (firstProd) {
      const resProdDetail = await fetch(`${baseUrl}/api/products/slug/${firstProd.slug}`);
      const dataProdDetail = await resProdDetail.json();
      console.log(`9. GET /api/products/slug/${firstProd.slug} status:`, resProdDetail.status);
      console.log('   Product name:', dataProdDetail.product?.name);
      console.log('   Product brand:', dataProdDetail.product?.brand?.name);
      if (resProdDetail.status !== 200 || !dataProdDetail.product) {
        throw new Error(`GET /api/products/slug/${firstProd.slug} failed`);
      }
    }

    console.log('\n=========================================');
    console.log('ALL 9 BACKEND TESTS PASSED SUCCESSFULLY!');
    console.log('=========================================');
  } finally {
    server.close();
  }
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
