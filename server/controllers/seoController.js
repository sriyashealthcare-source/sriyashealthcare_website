const Brand = require('../models/Brand');
const Product = require('../models/Product');
const HomepageContent = require('../models/HomepageContent');

const DOMAIN = 'https://sriyashealthcare.com';

function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch (_) {
    return new Date().toISOString().split('T')[0];
  }
}

function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
}

/**
 * Generates dynamic sitemap XML from current active database content or provided items
 */
async function buildSitemapXml(providedBrands = null, providedProducts = null, providedHomepageDoc = null) {
  let brands = providedBrands;
  let products = providedProducts;
  let homepageDoc = providedHomepageDoc;

  if (!brands || !products) {
    const [dbBrands, dbProducts, dbHp] = await Promise.all([
      Brand.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }),
      Product.find({ isActive: true, deletedAt: null }).populate('brand').sort({ displayOrder: 1, name: 1 }),
      HomepageContent.findOne({ singletonKey: 'main_homepage' }).catch(() => null)
    ]);
    brands = brands || dbBrands;
    products = products || dbProducts;
    homepageDoc = homepageDoc || dbHp;
  }

  const lastHomeMod = homepageDoc?.lastPublishedAt || homepageDoc?.updatedAt || new Date();

  const urls = [
    {
      loc: `${DOMAIN}/`,
      lastmod: formatDate(lastHomeMod),
      changefreq: 'weekly',
      priority: '1.0'
    },
    {
      loc: `${DOMAIN}/products`,
      lastmod: formatDate(new Date()),
      changefreq: 'weekly',
      priority: '0.9'
    },
    {
      loc: `${DOMAIN}/contact`,
      lastmod: formatDate(new Date()),
      changefreq: 'monthly',
      priority: '0.8'
    }
  ];

  // Active manufacturer / brand routes
  for (const b of brands) {
    if (!b.slug) continue;
    urls.push({
      loc: `${DOMAIN}/products/${encodeURIComponent(b.slug)}`,
      lastmod: formatDate(b.updatedAt || b.createdAt),
      changefreq: 'weekly',
      priority: '0.85'
    });
  }

  // Active individual product pages
  for (const p of products) {
    if (!p.slug) continue;
    const brandSlug = p.brand?.slug || 'peters';
    urls.push({
      loc: `${DOMAIN}/products/${encodeURIComponent(brandSlug)}/${encodeURIComponent(p.slug)}`,
      lastmod: formatDate(p.updatedAt || p.createdAt),
      changefreq: 'weekly',
      priority: '0.8'
    });
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const item of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(item.loc)}</loc>\n`;
    xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
    xml += `    <priority>${item.priority}</priority>\n`;
    xml += '  </url>\n';
  }
  xml += '</urlset>\n';

  return xml;
}

function buildRobotsTxt() {
  return [
    '# Sriyas Healthcare — Robots Exclusion Directives',
    'User-agent: *',
    'Allow: /',
    'Allow: /products',
    'Allow: /products/*',
    'Allow: /contact',
    'Allow: /assets/',
    'Disallow: /admin',
    'Disallow: /admin/*',
    'Disallow: /api/admin/',
    'Disallow: /api/admin/*',
    '',
    `Sitemap: ${DOMAIN}/sitemap.xml`
  ].join('\n');
}

const getSitemapXml = async (req, res, next) => {
  try {
    const xml = await buildSitemapXml();
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=3600, s-maxage=14400');
    res.status(200).send(xml);
  } catch (error) {
    next(error);
  }
};

const getRobotsTxt = (req, res) => {
  const robots = buildRobotsTxt();
  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.header('Cache-Control', 'public, max-age=86400');
  res.status(200).send(robots);
};

module.exports = {
  buildSitemapXml,
  buildRobotsTxt,
  getSitemapXml,
  getRobotsTxt
};
