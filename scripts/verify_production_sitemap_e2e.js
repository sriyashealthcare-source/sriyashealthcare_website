/**
 * Sriyas Healthcare — Production E2E Verification Script
 * Tests live endpoints on https://sriyashealthcare.com
 */

const https = require('https');

const BASE_URL = 'https://sriyashealthcare.com';

function fetchUrl(url, options = {}, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      return reject(new Error(`Too many redirects for ${url}`));
    }
    const parsed = new URL(url);
    const req = https.request(parsed, {
      method: options.method || 'GET',
      headers: {
        'User-Agent': options.userAgent || 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': options.accept || '*/*',
        ...options.headers
      }
    }, (res) => {
      // If 301, 302, 307, 308 redirect and not strictly disabled
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && options.followRedirects !== false) {
        const nextUrl = new URL(res.headers.location, url).toString();
        return resolve(fetchUrl(nextUrl, options, redirectCount + 1));
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          finalUrl: url,
          redirected: redirectCount > 0
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
    req.end();
  });
}

async function runProductionTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SRIYAS HEALTHCARE — PRODUCTION LIVE DEPLOYMENT AUDIT');
  console.log(`  Target: ${BASE_URL}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. SITEMAP.XML VERIFICATION
  console.log('[Test 1] Auditing Live Sitemap: https://sriyashealthcare.com/sitemap.xml...');
  const sitemapRes = await fetchUrl(`${BASE_URL}/sitemap.xml`, {
    accept: 'application/xml, text/xml, */*'
  });
  assert(sitemapRes.statusCode === 200, `Sitemap returns HTTP 200 (Got: ${sitemapRes.statusCode})`);
  assert(
    (sitemapRes.headers['content-type'] || '').includes('xml'),
    `Sitemap Content-Type is XML (Got: ${sitemapRes.headers['content-type']})`
  );
  assert(!sitemapRes.data.includes('<!DOCTYPE html>'), 'Sitemap is NOT an HTML fallback page');
  assert(sitemapRes.data.startsWith('<?xml'), 'Sitemap starts with XML declaration');
  assert(sitemapRes.data.includes('<urlset') && sitemapRes.data.includes('</urlset>'), 'Sitemap has valid <urlset> root element');

  const locMatches = sitemapRes.data.match(/<loc>(.*?)<\/loc>/g) || [];
  const extractedUrls = locMatches.map(m => m.replace(/<\/?loc>/g, '').trim());
  console.log(`  -> Found ${extractedUrls.length} URLs in live sitemap.`);
  assert(extractedUrls.length >= 33, `Sitemap contains all catalog URLs (Found: ${extractedUrls.length}, Expected >= 33)`);

  assert(extractedUrls.includes(`${BASE_URL}/`), 'Sitemap includes Homepage (/)');
  assert(extractedUrls.includes(`${BASE_URL}/products`), 'Sitemap includes Products Directory (/products)');
  assert(extractedUrls.includes(`${BASE_URL}/contact`), 'Sitemap includes Contact page (/contact)');
  assert(extractedUrls.includes(`${BASE_URL}/products/peters`), 'Sitemap includes Peters Surgical brand');
  assert(extractedUrls.includes(`${BASE_URL}/products/liquiband`), 'Sitemap includes LiquiBand brand');
  assert(extractedUrls.includes(`${BASE_URL}/products/cutimed`), 'Sitemap includes Cutimed Sorbact brand');
  assert(extractedUrls.includes(`${BASE_URL}/products/gentacoll`), 'Sitemap includes Genta-Coll brand');
  assert(extractedUrls.includes(`${BASE_URL}/products/gore`), 'Sitemap includes W. L. Gore brand');
  assert(extractedUrls.includes(`${BASE_URL}/products/peters/i-col`), 'Sitemap includes I-Col product page');
  assert(!sitemapRes.data.includes('/admin'), 'Sitemap strictly excludes admin pages');
  assert(!sitemapRes.data.includes('localhost'), 'Sitemap has no localhost references');

  // 2. ROBOTS.TXT VERIFICATION
  console.log('\n[Test 2] Auditing Live Robots: https://sriyashealthcare.com/robots.txt...');
  const robotsRes = await fetchUrl(`${BASE_URL}/robots.txt`, { accept: 'text/plain, */*' });
  assert(robotsRes.statusCode === 200, `robots.txt returns HTTP 200 (Got: ${robotsRes.statusCode})`);
  assert(
    (robotsRes.headers['content-type'] || '').includes('text/plain'),
    `robots.txt Content-Type is text/plain (Got: ${robotsRes.headers['content-type']})`
  );
  assert(robotsRes.data.includes('User-agent: *'), 'robots.txt includes User-agent: *');
  assert(robotsRes.data.includes('Allow: /'), 'robots.txt allows root path');
  assert(robotsRes.data.includes('Disallow: /admin'), 'robots.txt blocks /admin');
  assert(
    robotsRes.data.includes('Sitemap: https://sriyashealthcare.com/sitemap.xml'),
    'robots.txt accurately references canonical sitemap URL'
  );

  // 3. HOMEPAGE VERIFICATION
  console.log('\n[Test 3] Auditing Live Homepage: https://sriyashealthcare.com/...');
  const homeRes = await fetchUrl(`${BASE_URL}/`);
  assert(homeRes.statusCode === 200, `Homepage returns HTTP 200 (Got: ${homeRes.statusCode})`);
  assert(homeRes.data.includes('Sriyas Healthcare'), 'Homepage contains brand identity text');
  assert(homeRes.data.includes('<title>'), 'Homepage contains <title> tag');
  assert(homeRes.data.includes('rel="canonical"'), 'Homepage contains canonical link');

  // 4. MANUFACTURER BRAND PAGE VERIFICATION
  console.log('\n[Test 4] Auditing Live Manufacturer Page: https://sriyashealthcare.com/products/peters...');
  const brandRes = await fetchUrl(`${BASE_URL}/products/peters`);
  assert(brandRes.statusCode === 200, `Brand page returns HTTP 200 (Got: ${brandRes.statusCode})`);
  assert(
    brandRes.data.includes('Peters Surgical'),
    'Brand page contains "Peters Surgical" title or metadata'
  );
  assert(
    brandRes.data.includes('https://sriyashealthcare.com/products/peters'),
    'Brand page contains correct canonical URL'
  );
  assert(
    brandRes.data.includes('"@type":"Brand"') || brandRes.data.includes('"@type": "Brand"'),
    'Brand page contains Schema.org Brand structured data'
  );

  // 5. INDIVIDUAL PRODUCT PAGE VERIFICATION
  console.log('\n[Test 5] Auditing Live Product Page: https://sriyashealthcare.com/products/peters/i-col...');
  const prodRes = await fetchUrl(`${BASE_URL}/products/peters/i-col`);
  assert(prodRes.statusCode === 200, `Product page returns HTTP 200 (Got: ${prodRes.statusCode})`);
  assert(
    prodRes.data.includes('<title>I-Col™ | Peters Surgical | Sriyas Healthcare</title>'),
    'Product page returns specific prerendered title: "I-Col™ | Peters Surgical | Sriyas Healthcare"'
  );
  assert(
    prodRes.data.includes('https://sriyashealthcare.com/products/peters/i-col'),
    'Product page contains accurate canonical URL'
  );
  assert(
    prodRes.data.includes('"@type": "Product"') || prodRes.data.includes('"@type":"Product"'),
    'Product page contains Schema.org Product structured data'
  );
  assert(
    prodRes.data.includes('<h1>I-Col™</h1>'),
    'Product page contains semantic <h1> heading for crawlers without JS'
  );

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`  ALL ${passedTests}/${totalTests} PRODUCTION E2E AUDIT TESTS PASSED!`);
  console.log('  Live sitemap.xml is ready for Google Search Console submission.');
  console.log('═══════════════════════════════════════════════════════════════');
}

runProductionTests().catch(err => {
  console.error('\n[Production Audit Failed]:', err.message);
  process.exit(1);
});
