import React from 'react';
import ImageUploadField from './ImageUploadField';

export default function HeroEditorPanel({ hero, onChange }) {
  const updateField = (key, value) => {
    onChange({ ...hero, [key]: value });
  };

  return (
    <div className="admin-card hp-editor-panel">
      <div className="admin-card-header">
        <div>
          <h3>Hero Section &amp; Brand Transformation</h3>
          <p className="hp-panel-desc">
            Controls the initial viewport lockup shown at page top and the brand mark that animates smoothly into the top-left navbar on scroll.
          </p>
        </div>
        <span className="status-badge status-resolved">Always First</span>
      </div>

      <div className="hp-form-stack">
        <ImageUploadField
          label="Hero Emblem / Brand Logo"
          value={hero.logo}
          onChange={(nextLogo) => updateField('logo', nextLogo)}
          hint="Transparent PNG or crisp SVG logo recommended (used in Hero & synchronized when docked to Navbar)."
        />

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="hero-companyName">Primary Brand Wordmark</label>
            <input
              id="hero-companyName"
              type="text"
              value={hero.companyName || ''}
              onChange={(e) => updateField('companyName', e.target.value)}
              placeholder="SRIYAS"
            />
          </div>

          <div className="admin-field">
            <label htmlFor="hero-companySubtitle">Company Subtitle</label>
            <input
              id="hero-companySubtitle"
              type="text"
              value={hero.companySubtitle || ''}
              onChange={(e) => updateField('companySubtitle', e.target.value)}
              placeholder="HEALTHCARE PVT LTD"
            />
          </div>
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="hero-tagline">Hero Tagline</label>
            <input
              id="hero-tagline"
              type="text"
              value={hero.tagline || ''}
              onChange={(e) => updateField('tagline', e.target.value)}
              placeholder="Empowering Healthcare with Care and Innovation"
            />
          </div>

          <div className="admin-field">
            <label htmlFor="hero-values">Core Values Line</label>
            <input
              id="hero-values"
              type="text"
              value={hero.valuesText || ''}
              onChange={(e) => updateField('valuesText', e.target.value)}
              placeholder="CARE · TRUST · INNOVATION"
            />
          </div>
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="hero-ctaText">Primary Button Text</label>
            <input
              id="hero-ctaText"
              type="text"
              value={hero.ctaText || ''}
              onChange={(e) => updateField('ctaText', e.target.value)}
              placeholder="Explore Sriyas"
            />
          </div>

          <div className="admin-field">
            <label htmlFor="hero-ctaLink">Primary Button Link</label>
            <input
              id="hero-ctaLink"
              type="text"
              value={hero.ctaLink || ''}
              onChange={(e) => updateField('ctaLink', e.target.value)}
              placeholder="#about-sriyas"
            />
          </div>
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="hero-secCtaText">Secondary Button Text</label>
            <input
              id="hero-secCtaText"
              type="text"
              value={hero.secondaryCtaText || ''}
              onChange={(e) => updateField('secondaryCtaText', e.target.value)}
              placeholder="Explore Products"
            />
          </div>

          <div className="admin-field">
            <label htmlFor="hero-secCtaLink">Secondary Button Link</label>
            <input
              id="hero-secCtaLink"
              type="text"
              value={hero.secondaryCtaLink || ''}
              onChange={(e) => updateField('secondaryCtaLink', e.target.value)}
              placeholder="/products"
            />
          </div>
        </div>

        <div className="hp-toggle-row">
          <label className="hp-checkbox-pill">
            <input
              type="checkbox"
              checked={hero.showTagline !== false}
              onChange={(e) => updateField('showTagline', e.target.checked)}
            />
            <span>Show Tagline</span>
          </label>

          <label className="hp-checkbox-pill">
            <input
              type="checkbox"
              checked={hero.showValues !== false}
              onChange={(e) => updateField('showValues', e.target.checked)}
            />
            <span>Show Core Values Line</span>
          </label>

          <label className="hp-checkbox-pill">
            <input
              type="checkbox"
              checked={hero.showSecondaryCta !== false}
              onChange={(e) => updateField('showSecondaryCta', e.target.checked)}
            />
            <span>Show Secondary CTA Button</span>
          </label>
        </div>
      </div>
    </div>
  );
}

