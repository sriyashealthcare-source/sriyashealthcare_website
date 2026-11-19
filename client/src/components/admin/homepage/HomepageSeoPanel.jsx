import React from 'react';
import ImageUploadField from './ImageUploadField';
import { SRIYAS_EMBLEM_URL } from '../../../utils/cloudinaryAssets';

const DEFAULT_SEO = {
  title: 'Sriyas Healthcare | Surgical Products & Medical Device Distributor in Chennai, India',
  description:
    'Sriyas Healthcare Private Limited is a Chennai-based healthcare distributor supplying surgical sutures, medical devices, tissue adhesives, surgical meshes and wound care solutions across India.',
  keywords:
    'Sriyas Healthcare, surgical products distributor Chennai, medical device distributor India, surgical sutures, tissue adhesives, hernia mesh, wound care',
  canonicalUrl: 'https://sriyashealthcare.com',
  ogTitle: '',
  ogDescription: '',
  ogImage: SRIYAS_EMBLEM_URL,
  robotsIndex: true,
  robotsFollow: true
};

export default function HomepageSeoPanel({
  draft = {},
  onChange,
  onSaveDraft,
  onPublish
}) {
  const seo = { ...DEFAULT_SEO, ...(draft.seo || {}) };

  const commit = (patch) => {
    onChange({
      ...draft,
      seo: {
        ...seo,
        ...patch
      }
    });
  };

  const titleLength = (seo.title || '').length;
  const descLength = (seo.description || '').length;

  const displayTitle = seo.title || DEFAULT_SEO.title;
  const displayDesc = seo.description || DEFAULT_SEO.description;
  const displayUrl = seo.canonicalUrl || 'https://sriyashealthcare.com';

  return (
    <div className="hp-panel hp-seo-panel">
      {/* Header Card */}
      <div className="hp-card" style={{ marginBottom: '24px' }}>
        <div className="hp-card-header" style={{ marginBottom: '14px' }}>
          <div>
            <div className="hp-stats-badge-pill">
              <span className="hp-stats-badge-dot" />
              GLOBAL HOMEPAGE SEO
            </div>
            <h2 className="hp-card-title">Homepage SEO &amp; Social Metadata</h2>
            <p className="hp-card-desc">
              Manage search engine titles, meta descriptions, canonical URLs, and social sharing previews for Sriyas Healthcare&apos;s homepage.
            </p>
          </div>
        </div>
      </div>

      {/* Google Search Snippet Live Preview */}
      <div className="hp-card" style={{ marginBottom: '24px' }}>
        <div className="hp-card-header" style={{ marginBottom: '16px' }}>
          <div>
            <h3 className="hp-card-title" style={{ fontSize: '1.25rem' }}>
              🔍 Live Google Search Result Preview
            </h3>
            <p className="hp-card-desc">
              How the Sriyas Healthcare homepage appears in Google organic search results.
            </p>
          </div>
        </div>

        <div className="hp-google-preview-card" style={{
          background: '#FFFFFF',
          border: '1px solid #DFE1E5',
          borderRadius: '12px',
          padding: '20px 22px',
          maxWidth: '680px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          fontFamily: 'arial, sans-serif'
        }}>
          {/* URL & Favicon Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: '#F1F3F4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img src="/favicon.png" alt="" width="16" height="16" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', color: '#202124', fontWeight: 500, lineHeight: 1.2 }}>
                Sriyas Healthcare
              </span>
              <span style={{ fontSize: '12px', color: '#4D5156', lineHeight: 1.2 }}>
                {displayUrl}
              </span>
            </div>
          </div>

          {/* Title Link */}
          <h4 style={{
            fontSize: '19px',
            color: '#1A0DAB',
            fontWeight: 400,
            lineHeight: 1.3,
            margin: '0 0 4px',
            cursor: 'pointer'
          }}>
            {displayTitle}
          </h4>

          {/* Description */}
          <p style={{
            fontSize: '14px',
            color: '#4D5156',
            lineHeight: 1.5,
            margin: 0
          }}>
            {displayDesc}
          </p>
        </div>

        {/* Quality Badges */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.78rem',
            padding: '4px 10px',
            borderRadius: '6px',
            background: titleLength >= 40 && titleLength <= 65 ? '#EAF7ED' : '#FEF3C7',
            color: titleLength >= 40 && titleLength <= 65 ? '#15803D' : '#B45309',
            fontWeight: 600
          }}>
            Title: {titleLength} / 60 characters {titleLength >= 40 && titleLength <= 65 ? '✓ Optimal' : '(40–60 recommended)'}
          </span>
          <span style={{
            fontSize: '0.78rem',
            padding: '4px 10px',
            borderRadius: '6px',
            background: descLength >= 120 && descLength <= 165 ? '#EAF7ED' : '#FEF3C7',
            color: descLength >= 120 && descLength <= 165 ? '#15803D' : '#B45309',
            fontWeight: 600
          }}>
            Description: {descLength} / 160 characters {descLength >= 120 && descLength <= 165 ? '✓ Optimal' : '(120–160 recommended)'}
          </span>
        </div>
      </div>

      {/* Core SEO Form Fields */}
      <div className="hp-card" style={{ marginBottom: '24px' }}>
        <h3 className="hp-card-title" style={{ fontSize: '1.25rem', marginBottom: '18px' }}>
          On-Page Search Tags
        </h3>

        <div className="hp-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* SEO Title */}
          <div className="hp-form-group">
            <label className="hp-stats-label">
              <span>Homepage SEO Title <span className="hp-stats-req">*</span></span>
              <span className="hp-stats-opt">{titleLength} chars</span>
            </label>
            <input
              type="text"
              className="hp-stats-input"
              value={seo.title}
              onChange={(e) => commit({ title: e.target.value })}
              placeholder="Sriyas Healthcare | Surgical Products & Medical Device Distributor in Chennai, India"
            />
            <p className="hp-stats-input-hint">
              Appears in browser tabs and as the primary headline in Google search results. Recommended: 50–60 characters.
            </p>
          </div>

          {/* Meta Description */}
          <div className="hp-form-group">
            <label className="hp-stats-label">
              <span>Homepage Meta Description <span className="hp-stats-req">*</span></span>
              <span className="hp-stats-opt">{descLength} chars</span>
            </label>
            <textarea
              rows={3}
              className="hp-stats-textarea"
              value={seo.description}
              onChange={(e) => commit({ description: e.target.value })}
              placeholder="Sriyas Healthcare Private Limited is a Chennai-based healthcare distributor supplying surgical sutures, medical devices, tissue adhesives, surgical meshes and wound care solutions across India."
            />
            <p className="hp-stats-input-hint">
              Summary snippet shown under your search title in Google. Recommended: 130–160 characters.
            </p>
          </div>

          {/* Canonical URL */}
          <div className="hp-form-group">
            <label className="hp-stats-label">
              <span>Canonical Homepage URL</span>
              <span className="hp-stats-opt">Standard: https://sriyashealthcare.com</span>
            </label>
            <input
              type="url"
              className="hp-stats-input"
              value={seo.canonicalUrl}
              onChange={(e) => commit({ canonicalUrl: e.target.value })}
              placeholder="https://sriyashealthcare.com"
            />
            <p className="hp-stats-input-hint">
              Tells search engines the authoritative URL to avoid duplicate content flags.
            </p>
          </div>

          {/* Meta Keywords */}
          <div className="hp-form-group">
            <label className="hp-stats-label">
              <span>Keyword Themes (Internal Reference &amp; Meta)</span>
            </label>
            <input
              type="text"
              className="hp-stats-input"
              value={seo.keywords}
              onChange={(e) => commit({ keywords: e.target.value })}
              placeholder="surgical sutures distributor Chennai, medical device supplier India, tissue adhesives, hernia mesh"
            />
          </div>
        </div>
      </div>

      {/* Social Sharing & Robots Directives */}
      <div className="hp-card" style={{ marginBottom: '24px' }}>
        <h3 className="hp-card-title" style={{ fontSize: '1.25rem', marginBottom: '18px' }}>
          Social Sharing &amp; Crawler Directives
        </h3>

        <div className="hp-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="hp-form-group">
            <label className="hp-stats-label">
              <span>Open Graph Title (Optional)</span>
            </label>
            <input
              type="text"
              className="hp-stats-input"
              value={seo.ogTitle}
              onChange={(e) => commit({ ogTitle: e.target.value })}
              placeholder="Leave blank to use main SEO title"
            />
          </div>

          <div className="hp-form-group">
            <label className="hp-stats-label">
              <span>Open Graph Image URL</span>
            </label>
            <input
              type="text"
              className="hp-stats-input"
              value={seo.ogImage}
              onChange={(e) => commit({ ogImage: e.target.value })}
              placeholder="https://res.cloudinary.com/.../sriyas-emblem.png"
            />
          </div>
        </div>

        <div className="hp-form-group" style={{ marginTop: '16px' }}>
          <label className="hp-stats-label">
            <span>Open Graph Description (Optional)</span>
          </label>
          <textarea
            rows={2}
            className="hp-stats-textarea"
            value={seo.ogDescription}
            onChange={(e) => commit({ ogDescription: e.target.value })}
            placeholder="Leave blank to use main meta description"
          />
        </div>

        {/* Indexing Checkboxes */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#242424' }}>
            <input
              type="checkbox"
              checked={seo.robotsIndex !== false}
              onChange={(e) => commit({ robotsIndex: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#D4AF37' }}
            />
            <strong>Allow search engines to index this page (robots: index)</strong>
          </label>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#242424' }}>
            <input
              type="checkbox"
              checked={seo.robotsFollow !== false}
              onChange={(e) => commit({ robotsFollow: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#D4AF37' }}
            />
            <strong>Allow search engines to follow links (robots: follow)</strong>
          </label>
        </div>
      </div>
    </div>
  );
}
