/**
 * Sriyas Healthcare — SEO Assets & Prerender Generator
 * Generates:
 * 1. client/public/sitemap.xml & client/dist/sitemap.xml
 * 2. client/public/robots.txt & client/dist/robots.txt
 * 3. Route-specific prerendered HTML with exact titles, meta descriptions, canonical URLs,
 *    Open Graph tags, and Schema.org JSON-LD structured data for Cloudflare Workers Static Assets.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const clientDir = path.join(rootDir, 'client');
const publicDir = path.join(clientDir, 'public');
const distDir = path.join(clientDir, 'dist');

// Ensure server/node_modules is accessible
const serverNodeModules = path.join(rootDir, 'server', 'node_modules');
if (fs.existsSync(serverNodeModules) && !module.paths.includes(serverNodeModules)) {
  module.paths.unshift(serverNodeModules);
}

require('dotenv').config({ path: path.join(rootDir, '.env') });
require('dotenv').config({ path: path.join(rootDir, 'server', '.env') });

if (process.env.USE_LOCAL_DB === undefined && process.env.NODE_ENV !== 'production') {
  process.env.USE_LOCAL_DB = 'true';
}

const { connectDatabase } = require('../server/config/database');
const Brand = require('../server/models/Brand');
const Product = require('../server/models/Product');
const HomepageContent = require('../server/models/HomepageContent');
const { buildSitemapXml, buildRobotsTxt } = require('../server/controllers/seoController');

const DOMAIN = 'https://sriyashealthcare.com';

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${DOMAIN}/#organization`,
    name: 'Sriyas Healthcare Private Limited',
    alternateName: 'Sriyas Healthcare',
    url: DOMAIN,
    logo: `${DOMAIN}/assets/logos/sriyas-emblem.png`,
    description:
      'Premier surgical products and medical device distribution company based in Chennai, India, supplying sutures, surgical meshes, tissue adhesives, and advanced wound care solutions.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Plot No.53A, First Floor, East Facing, Oil Mill Road, Maruthi Nagar, Karambakkam, Thundalam',
      addressLocality: 'Chennai',
      addressRegion: 'Tamil Nadu',
      postalCode: '600077',
      addressCountry: 'IN'
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+91-9600804456',
        contactType: 'sales & customer support',
        areaServed: 'IN',
        availableLanguage: ['en', 'ta']
      },
      {
        '@type': 'ContactPoint',
        telephone: '+91-9367772801',
        contactType: 'hospital procurement enquiry',
        areaServed: 'IN',
        availableLanguage: ['en', 'ta']
      }
    ],
    email: 'Sriyashealthcare@gmail.com',
    taxID: '33ABQCS4744P1ZJ'
  };
}

function buildLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'WholesaleStore'],
    '@id': `${DOMAIN}/#localbusiness`,
    name: 'Sriyas Healthcare Private Limited',
    image: `${DOMAIN}/assets/logos/sriyas-emblem.png`,
    url: DOMAIN,
    telephone: '+919600804456',
    priceRange: '$$',
    description:
      'Authorized distributor of world-class surgical sutures, tissue adhesives, hernia meshes, and wound care devices in Chennai, Tamil Nadu, India.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Plot No.53A, First Floor, East Facing, Oil Mill Road, Maruthi Nagar, Karambakkam, Thundalam',
      addressLocality: 'Chennai',
      addressRegion: 'Tamil Nadu',
      postalCode: '600077',
      addressCountry: 'IN'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '13.0458',
      longitude: '80.1472'
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '18:30'
      }
    ]
  };
}

function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${DOMAIN}/#website`,
    url: DOMAIN,
    name: 'Sriyas Healthcare',
    description: 'Surgical Products & Medical Device Distributor in Chennai, India',
    publisher: {
      '@id': `${DOMAIN}/#organization`
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${DOMAIN}/products?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

function buildBreadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url
    }))
  };
}

function injectMetadataIntoHtml(templateHtml, routeMeta) {
  const {
    title,
    description,
    canonicalUrl,
    ogImage = `${DOMAIN}/assets/logos/sriyas-emblem.png`,
    ogType = 'website',
    noindex = false,
    schemas = [],
    initialBodyHtml = ''
  } = routeMeta;

  let html = templateHtml;

  // 1. Replace or insert Title
  const titleTag = `<title>${escapeHtml(title)}</title>`;
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, titleTag);
  } else {
    html = html.replace('</head>', `  ${titleTag}\n</head>`);
  }

  // 2. Build Head Meta Tags
  const metaTags = [
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow'}" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:type" content="${escapeHtml(ogType)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    `<meta property="og:site_name" content="Sriyas Healthcare" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`
  ];

  // 3. Inject Schemas
  for (const schema of schemas) {
    if (schema) {
      metaTags.push(`<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`);
    }
  }

  const metaBlock = `\n  <!-- Route-Specific SEO & Open Graph Metadata -->\n  ${metaTags.join('\n  ')}\n`;

  // Remove existing static meta description/og tags from base template to avoid duplicate tags
  html = html
    .replace(/<meta\s+name="description"[\s\S]*?>/gi, '')
    .replace(/<meta\s+property="og:[\w:]+"[\s\S]*?>/gi, '')
    .replace(/<meta\s+name="twitter:[\w:]+"[\s\S]*?>/gi, '')
    .replace(/<link\s+rel="canonical"[\s\S]*?>/gi, '')
    .replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');

  html = html.replace('</head>', `${metaBlock}</head>`);

  // 4. Inject initial crawlable HTML into <div id="root">
  if (initialBodyHtml && html.includes('<div id="root"></div>')) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root"><div id="prerendered-content" class="prerender-seo-wrap">${initialBodyHtml}</div></div>`
    );
  }

  return html;
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SRIYAS HEALTHCARE — SEO ASSET & PRERENDER GENERATOR');
  console.log('═══════════════════════════════════════════════════════════════');

  await connectDatabase();

  // 1. Fetch data
  const [brands, products, hpDoc] = await Promise.all([
    Brand.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }),
    Product.find({ isActive: true, deletedAt: null }).populate('brand').sort({ displayOrder: 1, name: 1 }),
    HomepageContent.findOne({ singletonKey: 'main_homepage' }).catch(() => null)
  ]);

  const activeBrands = brands || [];
  const activeProducts = (products || []).filter(p => p.brand && p.brand.isActive !== false);
  const hpPublished = hpDoc?.published || {};
  const hpSeo = hpPublished.seo || {};

  console.log(`[Data] Found ${activeBrands.length} active brands and ${activeProducts.length} active products.`);

  // 2. Generate Sitemap.xml & Robots.txt
  console.log('[Assets] Generating sitemap.xml and robots.txt...');
  const sitemapXml = await buildSitemapXml();
  const robotsTxt = buildRobotsTxt();

  ensureDirSync(publicDir);
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf8');

  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
    fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf8');
  }
  console.log('  ✓ sitemap.xml written to client/public and client/dist');
  console.log('  ✓ robots.txt written to client/public and client/dist');

  // 3. Read template HTML
  const templatePath = fs.existsSync(path.join(distDir, 'index.html'))
    ? path.join(distDir, 'index.html')
    : path.join(clientDir, 'index.html');
  const templateHtml = fs.readFileSync(templatePath, 'utf8');

  // If distDir does not exist yet (e.g. running standalone before build), create it
  ensureDirSync(distDir);

  const orgSchema = buildOrganizationSchema();
  const localSchema = buildLocalBusinessSchema();
  const webSiteSchema = buildWebSiteSchema();

  // ─────────────────────────────────────────────────────────────
  // A. Homepage: /
  // ─────────────────────────────────────────────────────────────
  const homeTitle =
    hpSeo.title ||
    'Sriyas Healthcare | Surgical Products & Medical Device Distributor in Chennai, India';
  const homeDesc =
    hpSeo.description ||
    'Sriyas Healthcare Private Limited is a Chennai-based healthcare distributor supplying surgical sutures, medical devices, tissue adhesives, surgical meshes and wound care solutions across India.';
  const homeCanonical = hpSeo.canonicalUrl || `${DOMAIN}/`;

  const homeHtml = injectMetadataIntoHtml(templateHtml, {
    title: homeTitle,
    description: homeDesc,
    canonicalUrl: homeCanonical,
    ogImage: hpSeo.ogImage ? (hpSeo.ogImage.startsWith('http') ? hpSeo.ogImage : `${DOMAIN}${hpSeo.ogImage}`) : `${DOMAIN}/assets/logos/sriyas-emblem.png`,
    ogType: 'website',
    noindex: hpSeo.robotsIndex === false,
    schemas: [orgSchema, localSchema, webSiteSchema],
    initialBodyHtml: `
      <header class="sr-only">
        <h1>Sriyas Healthcare Private Limited</h1>
        <p>Advanced Surgical Products & Medical Device Distribution Partner in Chennai, India</p>
      </header>
    `
  });
  fs.writeFileSync(path.join(distDir, 'index.html'), homeHtml, 'utf8');
  console.log('  ✓ Prerendered: / (Homepage)');

  // ─────────────────────────────────────────────────────────────
  // B. Products Directory: /products
  // ─────────────────────────────────────────────────────────────
  const productsDir = path.join(distDir, 'products');
  ensureDirSync(productsDir);

  const productsBreadcrumbs = buildBreadcrumbSchema([
    { name: 'Home', url: `${DOMAIN}/` },
    { name: 'Products Directory', url: `${DOMAIN}/products` }
  ]);

  const productsTitle = 'Medical & Surgical Products Directory | Sriyas Healthcare Chennai';
  const productsDesc =
    'Browse our comprehensive catalogue of world-class surgical sutures, hernia meshes, tissue adhesives, wound care dressings, and medical equipment in India.';

  const productsHtml = injectMetadataIntoHtml(templateHtml, {
    title: productsTitle,
    description: productsDesc,
    canonicalUrl: `${DOMAIN}/products`,
    ogType: 'website',
    schemas: [productsBreadcrumbs, webSiteSchema],
    initialBodyHtml: `
      <main class="sr-only">
        <h1>Find the Right Healthcare Product — Sriyas Healthcare</h1>
        <p>Complete surgical and medical product directory including ${activeBrands.map(b => b.name).join(', ')}.</p>
        <nav aria-label="Partner Brands">
          <ul>
            ${activeBrands.map(b => `<li><a href="/products/${encodeURIComponent(b.slug)}">${escapeHtml(b.name)} Products</a></li>`).join('')}
          </ul>
        </nav>
      </main>
    `
  });
  fs.writeFileSync(path.join(productsDir, 'index.html'), productsHtml, 'utf8');
  console.log('  ✓ Prerendered: /products (Products Directory)');

  // ─────────────────────────────────────────────────────────────
  // C. Contact Us: /contact
  // ─────────────────────────────────────────────────────────────
  const contactDir = path.join(distDir, 'contact');
  ensureDirSync(contactDir);

  const contactBreadcrumbs = buildBreadcrumbSchema([
    { name: 'Home', url: `${DOMAIN}/` },
    { name: 'Contact Us', url: `${DOMAIN}/contact` }
  ]);

  const contactTitle = 'Contact Sriyas Healthcare | Medical Distributor in Chennai, India';
  const contactDesc =
    'Contact Sriyas Healthcare Private Limited in Chennai for hospital supplies, surgical product quotes, clinical enquiries, and distribution partnerships. Call +91 96008 04456.';

  const contactHtml = injectMetadataIntoHtml(templateHtml, {
    title: contactTitle,
    description: contactDesc,
    canonicalUrl: `${DOMAIN}/contact`,
    ogType: 'website',
    schemas: [contactBreadcrumbs, localSchema],
    initialBodyHtml: `
      <main class="sr-only">
        <h1>Contact Sriyas Healthcare Private Limited</h1>
        <p>Plot No.53A, First Floor, East Facing, Oil Mill Road, Maruthi Nagar, Karambakkam, Thundalam, Chennai - 600077, Tamil Nadu, India.</p>
        <p>Phone: +91 96008 04456 / +91 93677 72801 | Email: Sriyashealthcare@gmail.com</p>
      </main>
    `
  });
  fs.writeFileSync(path.join(contactDir, 'index.html'), contactHtml, 'utf8');
  console.log('  ✓ Prerendered: /contact (Contact Page)');

  // ─────────────────────────────────────────────────────────────
  // D. About Page: /about
  // ─────────────────────────────────────────────────────────────
  const aboutDir = path.join(distDir, 'about');
  ensureDirSync(aboutDir);

  const aboutBreadcrumbs = buildBreadcrumbSchema([
    { name: 'Home', url: `${DOMAIN}/` },
    { name: 'About Sriyas Healthcare', url: `${DOMAIN}/about` }
  ]);

  const aboutTitle = 'About Sriyas Healthcare | Medical & Surgical Distribution Chennai';
  const aboutDesc =
    'Learn about Sriyas Healthcare Private Limited — our mission, leadership, values, and dedication to supplying hospitals with world-class surgical devices.';

  const aboutHtml = injectMetadataIntoHtml(templateHtml, {
    title: aboutTitle,
    description: aboutDesc,
    canonicalUrl: `${DOMAIN}/about`,
    ogType: 'website',
    schemas: [aboutBreadcrumbs, orgSchema]
  });
  fs.writeFileSync(path.join(aboutDir, 'index.html'), aboutHtml, 'utf8');
  console.log('  ✓ Prerendered: /about (About Sriyas)');

  // ─────────────────────────────────────────────────────────────
  // E. Brand / Manufacturer Pages: /products/:brandSlug
  // ─────────────────────────────────────────────────────────────
  for (const b of activeBrands) {
    if (!b.slug) continue;
    const brandDir = path.join(productsDir, b.slug);
    ensureDirSync(brandDir);

    const brandProducts = activeProducts.filter(p => String(p.brand?._id || p.brand) === String(b._id));
    const brandBreadcrumbs = buildBreadcrumbSchema([
      { name: 'Home', url: `${DOMAIN}/` },
      { name: 'Products', url: `${DOMAIN}/products` },
      { name: b.name, url: `${DOMAIN}/products/${encodeURIComponent(b.slug)}` }
    ]);

    const brandTitle =
      b.seoTitle ||
      `${b.name} Surgical & Medical Products | Sriyas Healthcare`;
    const brandDesc =
      b.seoDescription ||
      (b.description
        ? `${b.name}: ${b.description.slice(0, 140)}... Distributed by Sriyas Healthcare.`
        : `Explore authorized ${b.name} surgical sutures, medical devices, and equipment distributed by Sriyas Healthcare in India.`);

    const brandLogo = b.logoUrl
      ? (b.logoUrl.startsWith('http') ? b.logoUrl : `${DOMAIN}${b.logoUrl}`)
      : `${DOMAIN}/assets/logos/sriyas-emblem.png`;

    const brandSchema = {
      '@context': 'https://schema.org',
      '@type': 'Brand',
      name: b.name,
      logo: brandLogo,
      url: `${DOMAIN}/products/${encodeURIComponent(b.slug)}`,
      description: b.description || brandDesc
    };

    const brandHtml = injectMetadataIntoHtml(templateHtml, {
      title: brandTitle,
      description: brandDesc,
      canonicalUrl: `${DOMAIN}/products/${encodeURIComponent(b.slug)}`,
      ogImage: brandLogo,
      ogType: 'website',
      schemas: [brandBreadcrumbs, brandSchema],
      initialBodyHtml: `
        <main class="sr-only">
          <h1>${escapeHtml(b.name)} Products — Sriyas Healthcare</h1>
          <p>${escapeHtml(b.description || brandDesc)}</p>
          <ul>
            ${brandProducts.map(p => `<li><a href="/products/${encodeURIComponent(b.slug)}/${encodeURIComponent(p.slug)}">${escapeHtml(p.name)}</a></li>`).join('')}
          </ul>
        </main>
      `
    });

    fs.writeFileSync(path.join(brandDir, 'index.html'), brandHtml, 'utf8');
    console.log(`  ✓ Prerendered: /products/${b.slug} (${b.name})`);

    // ─────────────────────────────────────────────────────────────
    // F. Individual Product Pages: /products/:brandSlug/:productSlug
    // ─────────────────────────────────────────────────────────────
    for (const p of brandProducts) {
      if (!p.slug) continue;
      const productDir = path.join(brandDir, p.slug);
      ensureDirSync(productDir);

      const prodBreadcrumbs = buildBreadcrumbSchema([
        { name: 'Home', url: `${DOMAIN}/` },
        { name: 'Products', url: `${DOMAIN}/products` },
        { name: b.name, url: `${DOMAIN}/products/${encodeURIComponent(b.slug)}` },
        { name: p.name, url: `${DOMAIN}/products/${encodeURIComponent(b.slug)}/${encodeURIComponent(p.slug)}` }
      ]);

      const primaryImgObj = (p.images || []).find(img => img.isPrimary) || (p.images || [])[0];
      const prodImg = primaryImgObj?.url
        ? (primaryImgObj.url.startsWith('http') ? primaryImgObj.url : `${DOMAIN}${primaryImgObj.url}`)
        : `${DOMAIN}/assets/logos/sriyas-emblem.png`;

      const prodTitle =
        p.seoTitle ||
        `${p.name} | ${b.name} | Sriyas Healthcare`;
      const prodDesc =
        p.seoDescription ||
        (p.description
          ? `${p.name} from ${b.name}: ${p.description.slice(0, 130)}... Distributed by Sriyas Healthcare.`
          : `Explore technical specifications, clinical applications, and hospital enquiries for ${p.name} (${b.name}) from Sriyas Healthcare.`);

      const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        image: prodImg,
        description: p.description || p.shortSpecification || prodDesc,
        brand: {
          '@type': 'Brand',
          name: b.name
        },
        sku: p.legacyId || p.slug,
        url: `${DOMAIN}/products/${encodeURIComponent(b.slug)}/${encodeURIComponent(p.slug)}`
      };

      if (p.category?.name || p.cardCategory) {
        productSchema.category = p.category?.name || p.cardCategory;
      }

      const prodHtml = injectMetadataIntoHtml(templateHtml, {
        title: prodTitle,
        description: prodDesc,
        canonicalUrl: `${DOMAIN}/products/${encodeURIComponent(b.slug)}/${encodeURIComponent(p.slug)}`,
        ogImage: prodImg,
        ogType: 'product',
        schemas: [prodBreadcrumbs, productSchema],
        initialBodyHtml: `
          <main class="sr-only">
            <h1>${escapeHtml(p.name)}</h1>
            <p><strong>Manufacturer:</strong> ${escapeHtml(b.name)}</p>
            <p><strong>Category:</strong> ${escapeHtml(p.cardCategory || p.category?.name || '')}</p>
            <p>${escapeHtml(p.description || p.shortSpecification || '')}</p>
          </main>
        `
      });

      fs.writeFileSync(path.join(productDir, 'index.html'), prodHtml, 'utf8');
    }
  }

  console.log(`  ✓ Prerendered ${activeProducts.length} individual product pages.`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ALL SEO ASSETS & PRERENDERED PAGES GENERATED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════════════');

  process.exit(0);
}

run().catch(err => {
  console.error('[SEO Generator Fatal Error]', err);
  process.exit(1);
});
