import React, { useEffect } from 'react';

const DOMAIN = 'https://sriyashealthcare.com';

function setMetaTag(selector, attribute, value) {
  let tag = document.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    if (selector.startsWith('meta[name=')) {
      const name = selector.match(/meta\[name="([^"]+)"\]/)?.[1];
      if (name) tag.setAttribute('name', name);
    } else if (selector.startsWith('meta[property=')) {
      const prop = selector.match(/meta\[property="([^"]+)"\]/)?.[1];
      if (prop) tag.setAttribute('property', prop);
    }
    document.head.appendChild(tag);
  }
  tag.setAttribute(attribute, value);
}

function setCanonicalTag(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setJsonLdScript(id, schema) {
  let script = document.getElementById(id);
  if (!schema) {
    if (script) script.remove();
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2);
}

export default function SeoHead({
  title = 'Sriyas Healthcare | Surgical Products & Medical Device Distributor in Chennai, India',
  description = 'Sriyas Healthcare Private Limited is an authorized healthcare distributor in Chennai supplying surgical sutures, medical devices, tissue adhesives, surgical meshes and wound care solutions across India.',
  canonicalPath = '',
  canonicalUrl = '',
  ogImage = '',
  ogType = 'website',
  noindex = false,
  keywords = '',
  schema = null
}) {
  useEffect(() => {
    // 1. Title
    if (title) {
      document.title = title;
    }

    // 2. Meta Description & Keywords
    if (description) {
      setMetaTag('meta[name="description"]', 'content', description);
    }
    if (keywords) {
      setMetaTag('meta[name="keywords"]', 'content', keywords);
    }

    // 3. Robots directive
    const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow';
    setMetaTag('meta[name="robots"]', 'content', robotsContent);

    // 4. Canonical URL
    const fullCanonical = canonicalUrl || (canonicalPath ? `${DOMAIN}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}` : DOMAIN);
    setCanonicalTag(fullCanonical);

    // 5. Open Graph tags
    setMetaTag('meta[property="og:title"]', 'content', title);
    setMetaTag('meta[property="og:description"]', 'content', description);
    setMetaTag('meta[property="og:url"]', 'content', fullCanonical);
    setMetaTag('meta[property="og:type"]', 'content', ogType);
    setMetaTag('meta[property="og:site_name"]', 'content', 'Sriyas Healthcare');
    setMetaTag('meta[property="og:locale"]', 'content', 'en_IN');

    const effectiveOgImage = ogImage
      ? (ogImage.startsWith('http') ? ogImage : `${DOMAIN}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`)
      : `${DOMAIN}/assets/logos/sriyas-emblem.png`;
    setMetaTag('meta[property="og:image"]', 'content', effectiveOgImage);

    // 6. Twitter Card tags
    setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'content', title);
    setMetaTag('meta[name="twitter:description"]', 'content', description);
    setMetaTag('meta[name="twitter:image"]', 'content', effectiveOgImage);

    // 7. JSON-LD structured data
    setJsonLdScript('seo-dynamic-jsonld', schema);
  }, [title, description, canonicalPath, canonicalUrl, ogImage, ogType, noindex, keywords, schema]);

  return null;
}
