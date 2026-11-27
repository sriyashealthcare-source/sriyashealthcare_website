const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://dolphinmesh.com';

const PRODUCTS_CONFIG = [
  // 1. Polypropylene Mesh
  {
    subcatName: 'Polypropylene Mesh',
    subcatSlug: 'polypropylene-mesh',
    subcatDesc: 'High-tenacity knitted, 3D anatomical, and titanised polypropylene meshes for open and laparoscopic inguinal and ventral hernia repair.',
    name: 'Knit',
    slug: 'knit',
    subtitle: 'Knitted Polypropylene Mesh',
    path: '/knitted-polypropylene-mesh/',
    primaryImgKey: 'knit.webp',
    boxImgKey: 'knit-box.webp'
  },
  {
    subcatName: 'Polypropylene Mesh',
    subcatSlug: 'polypropylene-mesh',
    name: 'Knit 3D',
    slug: 'knit-3d',
    subtitle: '3D Anatomical Polypropylene Mesh',
    path: '/knit-3d-mesh/',
    primaryImgKey: 'knit-3d.webp',
    boxImgKey: 'knit-3d-box.webp'
  },
  {
    subcatName: 'Polypropylene Mesh',
    subcatSlug: 'polypropylene-mesh',
    name: 'Tiolene',
    slug: 'tiolene',
    subtitle: 'Titanised Polypropylene Mesh',
    path: '/tiolene-mesh/',
    primaryImgKey: 'tiolene.webp',
    boxImgKey: 'tiolene-box.webp'
  },

  // 2. Composite Barrier Mesh
  {
    subcatName: 'Composite Barrier Mesh',
    subcatSlug: 'composite-barrier-mesh',
    subcatDesc: 'Advanced dual-sided composite meshes with visceral anti-adhesive barrier layers for intraperitoneal onlay mesh (IPOM) and ventral hernia repairs.',
    name: 'Silene',
    slug: 'silene',
    subtitle: 'Silicone-Polymer Composite Mesh',
    path: '/silene-mesh/',
    primaryImgKey: 'silene.webp',
    boxImgKey: 'silene-box.webp'
  },
  {
    subcatName: 'Composite Barrier Mesh',
    subcatSlug: 'composite-barrier-mesh',
    name: 'Teflene',
    slug: 'teflene',
    subtitle: 'PTFE-Polypropylene Composite Mesh',
    path: '/teflene-mesh/',
    primaryImgKey: 'teflene.webp',
    boxImgKey: 'teflene-box.webp'
  },
  {
    subcatName: 'Composite Barrier Mesh',
    subcatSlug: 'composite-barrier-mesh',
    name: 'Ultralene',
    slug: 'ultralene',
    subtitle: 'Polyester-Polyethylene Composite Mesh',
    path: '/ultralene-mesh/',
    primaryImgKey: 'ultralene.webp',
    boxImgKey: 'ultralene-box.webp'
  },
  {
    subcatName: 'Composite Barrier Mesh',
    subcatSlug: 'composite-barrier-mesh',
    name: 'Duolene',
    slug: 'duolene',
    subtitle: 'Polypropylene-Polyethylene Composite Mesh',
    path: '/duolene-mesh/',
    primaryImgKey: 'duolene.webp',
    boxImgKey: 'duolene-box.webp'
  },

  // 3. Semi Absorbable Mesh
  {
    subcatName: 'Semi Absorbable Mesh',
    subcatSlug: 'semi-absorbable-mesh',
    subcatDesc: 'Composite meshes combining fast-absorbing synthetic polymers with permanent lightweight filaments to minimize foreign body presence while maintaining physiological burst strength.',
    name: 'Monosolve V2',
    slug: 'monosolve-v2',
    subtitle: 'Semi Absorbable Composite Mesh',
    path: '/monosolve-v2-mesh/',
    primaryImgKey: 'monosolve-v2.webp',
    boxImgKey: 'monosolve-v2-box.webp'
  },
  {
    subcatName: 'Semi Absorbable Mesh',
    subcatSlug: 'semi-absorbable-mesh',
    name: 'Monosolve V2 3D',
    slug: 'monosolve-v2-3d',
    subtitle: 'Semi Absorbable 3D Anatomical Mesh',
    path: '/monosolve-v2-3d-mesh/',
    primaryImgKey: 'monosolve-v2-3d.webp',
    boxImgKey: 'monosolve-v2-3d-box.webp'
  },

  // 4. Mesh Fixation
  {
    subcatName: 'Mesh Fixation',
    subcatSlug: 'mesh-fixation',
    subcatDesc: 'Ergonomic disposable helical mesh fixation tackers and titanium/absorbable anchors for secure laparoscopic and open hernia repair.',
    name: 'Tacksure',
    slug: 'tacksure',
    subtitle: 'Mesh Tacker',
    path: '/mesh-tacker/',
    primaryImgKey: 'tacksure.webp',
    boxImgKey: 'tacksure-box.webp'
  }
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function downloadBinary(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBinary(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

function cleanHtml(str) {
  if (!str) return '';
  return str
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&times;/g, '×')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractProduct(cfg, targetImgDir) {
  const fullUrl = BASE_URL + cfg.path;
  console.log(`\n[CRAWL] Fetching ${cfg.name} from ${fullUrl}...`);
  const html = await fetchUrl(fullUrl);

  // 1. Title and Lead description
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = h1Match ? cleanHtml(h1Match[1]) : cfg.name;

  // Lead / intro paragraph
  const leadMatch = html.match(/<p class=["']lead["'][^>]*>([\s\S]*?)<\/p>/i) ||
                    html.match(/<div class=["']lead["'][^>]*>([\s\S]*?)<\/div>/i) ||
                    html.match(/<header[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  const lead = leadMatch ? cleanHtml(leadMatch[1]) : '';

  // 2. Extract Features / Benefits
  const features = [];
  // Look for feature blocks, e.g. <div class="f-card"> or <li> inside feature sections
  const featureSectionMatch = html.match(/feature by feature[\s\S]*?<section[\s\S]*?<\/section>/i) ||
                              html.match(/<section[^>]*class=["'][^"']*feature[^"']*["'][\s\S]*?<\/section>/i);
  
  // Also regex match all h3/p pairs or list items in the features section
  const fCardRegex = /<(?:div|article|li)[^>]*class=["'][^"']*(?:f-card|card|feature|item)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;
  let fMatch;
  const fSectionHtml = featureSectionMatch ? featureSectionMatch[0] : html;
  while ((fMatch = fCardRegex.exec(fSectionHtml)) !== null) {
    const cardContent = fMatch[1];
    const h = (cardContent.match(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/i) || [])[1];
    const p = (cardContent.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1];
    if (h && p) {
      features.push({
        title: cleanHtml(h),
        description: cleanHtml(p)
      });
    }
  }

  // If no f-cards, look for why surgeons choose
  if (features.length === 0) {
    const whyMatch = html.match(/Why surgeons choose[\s\S]*?<\/section>/i);
    if (whyMatch) {
      const liMatches = whyMatch[0].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
      liMatches.forEach(li => {
        const text = cleanHtml(li);
        if (text) features.push({ title: text.split('.')[0], description: text });
      });
    }
  }

  // 3. Technical Specifications & Characteristics
  const specs = {};
  // Look for specs tables or definition lists
  const specDlMatch = html.match(/<dl[\s\S]*?<\/dl>/gi) || [];
  specDlMatch.forEach(dl => {
    const dtDdRegex = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
    let m;
    while ((m = dtDdRegex.exec(dl)) !== null) {
      const k = cleanHtml(m[1]).replace(/:$/, '');
      const v = cleanHtml(m[2]);
      if (k && v) specs[k] = v;
    }
  });

  // Also check composition & construction section
  const compMatch = html.match(/Composition and Construction[\s\S]*?<section[\s\S]*?<\/section>/i) ||
                    html.match(/Composition[\s\S]*?<\/section>/i);
  let compositionText = '';
  if (compMatch) {
    compositionText = cleanHtml(compMatch[0].replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, ''));
  }

  // Also check characteristics & handling section
  const charMatch = html.match(/Characteristics and Handling[\s\S]*?<section[\s\S]*?<\/section>/i) ||
                    html.match(/Characteristics[\s\S]*?<\/section>/i);
  let characteristicsText = '';
  if (charMatch) {
    characteristicsText = cleanHtml(charMatch[0].replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, ''));
  }

  // 4. Clinical Indications / Applications
  const appMatch = html.match(/Applications[\s\S]*?<section[\s\S]*?<\/section>/i) ||
                   html.match(/Indications[\s\S]*?<\/section>/i);
  let applications = [];
  if (appMatch) {
    const liMatches = appMatch[0].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    liMatches.forEach(li => {
      const t = cleanHtml(li);
      if (t) applications.push(t);
    });
    if (applications.length === 0) {
      const pMatches = appMatch[0].match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
      pMatches.forEach(p => {
        const t = cleanHtml(p);
        if (t) applications.push(t);
      });
    }
  }

  // 5. Product Code Matrix (121 codes across all products)
  const productCodes = [];
  const trRegex = /<tr\s+([^>]*data-code[^>]*)>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const attrStr = trMatch[1];
    const trInner = trMatch[2];

    const codeMatch = attrStr.match(/data-code=["']([^"']+)["']/i);
    const descMatch = attrStr.match(/data-desc=["']([^"']+)["']/i);
    const variantMatch = attrStr.match(/data-variant=["']([^"']+)["']/i);
    const shapeMatch = attrStr.match(/data-shape=["']([^"']+)["']/i);
    const sizeMatch = attrStr.match(/data-size=["']([^"']+)["']/i);

    const code = codeMatch ? codeMatch[1].trim() : '';
    const desc = descMatch ? descMatch[1].trim() : '';
    const variant = variantMatch ? variantMatch[1].trim() : '';
    const shape = shapeMatch ? shapeMatch[1].trim() : '';
    const size = sizeMatch ? sizeMatch[1].trim() : '';

    if (code) {
      productCodes.push({
        code,
        description: desc,
        variant,
        shape,
        size
      });
    }
  }

  console.log(`  ✓ Title: "${title}" | Subtitle: "${cfg.subtitle}"`);
  console.log(`  ✓ Lead length: ${lead.length} chars`);
  console.log(`  ✓ Features: ${features.length} items`);
  console.log(`  ✓ Applications: ${applications.length} items`);
  console.log(`  ✓ Product Codes found: ${productCodes.length} codes`);

  // 6. Download Images
  const imgLinks = [];
  // Find webp images associated with this product
  const imgRegex = /src=["'](\.\.\/)?assets\/img\/([^"']+\.webp(?:\?v=\d+)?)["']/gi;
  let im;
  while ((im = imgRegex.exec(html)) !== null) {
    const filename = im[2].split('?')[0];
    if (
      filename.includes(cfg.slug) ||
      filename === cfg.primaryImgKey ||
      filename === cfg.boxImgKey
    ) {
      imgLinks.push(filename);
    }
  }

  // Add primary and box image keys if not already present
  if (cfg.primaryImgKey && !imgLinks.includes(cfg.primaryImgKey)) imgLinks.push(cfg.primaryImgKey);
  if (cfg.boxImgKey && !imgLinks.includes(cfg.boxImgKey)) imgLinks.push(cfg.boxImgKey);

  const downloadedImages = [];
  for (const imgName of [...new Set(imgLinks)]) {
    const remoteUrl = `${BASE_URL}/assets/img/${imgName}`;
    const localFileName = `dolphin-mesh-${imgName}`;
    const localFullPath = path.join(targetImgDir, localFileName);
    const publicRelPath = `/images/products/dolphin-mesh/${localFileName}`;

    try {
      if (!fs.existsSync(localFullPath)) {
        console.log(`  Downloading ${remoteUrl} -> ${localFileName}...`);
        await downloadBinary(remoteUrl, localFullPath);
      }
      downloadedImages.push(publicRelPath);
    } catch (e) {
      console.warn(`  Failed downloading ${remoteUrl}:`, e.message);
    }
  }

  return {
    ...cfg,
    extractedTitle: title,
    lead,
    features,
    specs,
    compositionText,
    characteristicsText,
    applications,
    productCodes,
    images: downloadedImages,
    primaryImage: downloadedImages[0] || `/images/products/dolphin-mesh/dolphin-mesh-${cfg.primaryImgKey}`
  };
}

async function run() {
  const targetImgDir = path.join(__dirname, '..', 'client', 'public', 'images', 'products', 'dolphin-mesh');
  if (!fs.existsSync(targetImgDir)) {
    fs.mkdirSync(targetImgDir, { recursive: true });
  }

  console.log('Target Image Directory:', targetImgDir);
  const results = [];
  let totalCodes = 0;

  for (const cfg of PRODUCTS_CONFIG) {
    const data = await extractProduct(cfg, targetImgDir);
    totalCodes += data.productCodes.length;
    results.push(data);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`EXTRACTION COMPLETE! Total Products: ${results.length}, Total Codes: ${totalCodes}`);
  console.log('═══════════════════════════════════════════════════════════════');

  const outPath = path.join(__dirname, 'dolphin_mesh_extracted.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Saved extracted data to ${outPath}`);
}

run().catch(console.error);
