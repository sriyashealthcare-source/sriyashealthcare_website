const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'server', 'data', 'cloudinary_migration_manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const map = {};
for (const [key, item] of Object.entries(manifest)) {
  if (item && item.url) {
    map[key] = item.url;
    if (key.startsWith('/')) {
      map[key.slice(1)] = item.url;
    }
  }
}

const lines = [
  '/**',
  ' * Sriyas Healthcare - Cloudinary Asset Mapping & Delivery Utilities',
  ' * Auto-generated from Cloudinary Migration Manifest.',
  ' * Every public-facing image is served directly via Cloudinary CDN.',
  ' */',
  '',
  "export const CLOUDINARY_CLOUD_NAME = 'pgjzw0zu';",
  "export const CLOUDINARY_BASE_URL = 'https://res.cloudinary.com/pgjzw0zu/image/upload/';",
  '',
  '// Primary branded assets',
  `export const SRIYAS_EMBLEM_URL = ${JSON.stringify(manifest['/assets/logos/sriyas-emblem.png']?.url || 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048213/sriyas-healthcare/general/sriyas-emblem.png')};`,
  '',
  `export const SRIYAS_HERO_LOGO_URL = ${JSON.stringify(manifest['/assets/logos/sriyas-hero-logo.png']?.url || 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048211/sriyas-healthcare/homepage/hero/sriyas-hero-logo.png')};`,
  '',
  `export const STOREFRONT_LOCATION_URL = ${JSON.stringify(manifest['/assets/contact/storefront-location.jpg']?.url || 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048221/sriyas-healthcare/contact/storefront-location.jpg')};`,
  '',
  'export const BRAND_LOGOS = {',
  `  peters: ${JSON.stringify(manifest['/assets/logos/peters-surgical.png']?.url || '')},`,
  `  liquiband: ${JSON.stringify(manifest['/assets/logos/liquiband.png']?.url || '')},`,
  `  ams: ${JSON.stringify(manifest['/assets/logos/advanced-medical-solutions.png']?.url || '')},`,
  `  gore: ${JSON.stringify(manifest['/assets/logos/gore.png']?.url || '')}`,
  '};',
  '',
  'export const PLACEHOLDERS = {',
  `  leadership: ${JSON.stringify(manifest['/assets/placeholders/portrait-leadership-placeholder.svg']?.url || '')},`,
  `  team: ${JSON.stringify(manifest['/assets/placeholders/portrait-team-placeholder.svg']?.url || '')},`,
  `  workplace: ${JSON.stringify(manifest['/assets/placeholders/workplace-workspace-placeholder.jpg']?.url || '')},`,
  `  reception: ${JSON.stringify(manifest['/assets/placeholders/office-reception-placeholder.jpg']?.url || '')},`,
  `  operations: ${JSON.stringify(manifest['/assets/placeholders/healthcare-operations-placeholder.jpg']?.url || '')},`,
  `  ctaBackdrop: ${JSON.stringify(manifest['/assets/placeholders/cta-backdrop-placeholder.jpg']?.url || '')},`,
  `  productDefault: ${JSON.stringify(manifest['/assets/products/peters/filbloc-1.png']?.url || manifest['/assets/logos/sriyas-emblem.png']?.url || '')}`,
  '};',
  '',
  '// Full lookup table for all local paths mapped to Cloudinary URLs',
  `export const LOCAL_TO_CLOUDINARY_MAP = ${JSON.stringify(map, null, 2)};`,
  '',
  '/**',
  ' * Resolves any image URL to its Cloudinary CDN delivery URL.',
  ' * Handles legacy local paths, relative paths, full Cloudinary URLs, and external URLs.',
  ' */',
  'export function getCloudinaryUrl(pathOrUrl, fallback = SRIYAS_EMBLEM_URL) {',
  '  if (!pathOrUrl) return fallback;',
  "  if (typeof pathOrUrl !== 'string') return fallback;",
  '',
  '  // Already a Cloudinary URL',
  "  if (pathOrUrl.includes('res.cloudinary.com')) {",
  '    return pathOrUrl;',
  '  }',
  '',
  '  // Lookup in migrated manifest map',
  '  const cleanPath = pathOrUrl.trim();',
  '  if (LOCAL_TO_CLOUDINARY_MAP[cleanPath]) {',
  '    return LOCAL_TO_CLOUDINARY_MAP[cleanPath];',
  '  }',
  '',
  '  // Strip query/hash and retry',
  "  const withoutQuery = cleanPath.split('?')[0].split('#')[0];",
  '  if (LOCAL_TO_CLOUDINARY_MAP[withoutQuery]) {',
  '    return LOCAL_TO_CLOUDINARY_MAP[withoutQuery];',
  '  }',
  '',
  '  // If it is another external HTTP/HTTPS URL, return as-is',
  "  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('data:') || cleanPath.startsWith('blob:')) {",
  '    return cleanPath;',
  '  }',
  '',
  '  // Fallback',
  '  return fallback;',
  '}',
  ''
];

const targetPath = path.join(__dirname, '..', 'client', 'src', 'utils', 'cloudinaryAssets.js');
fs.writeFileSync(targetPath, lines.join('\n'));
console.log('Successfully wrote', targetPath, 'with', Object.keys(map).length, 'mappings');
