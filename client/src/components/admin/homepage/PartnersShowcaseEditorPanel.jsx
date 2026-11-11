import React from 'react';
import { resolveAssetUrl } from '../../../utils/session';

export default function PartnersShowcaseEditorPanel({
  partners,
  availableBrands = [],
  onChange
}) {
  const updateField = (key, value) => {
    onChange({ ...partners, [key]: value });
  };

  const selectedIds = Array.isArray(partners.selectedBrandIds) ? partners.selectedBrandIds : [];

  const toggleBrand = (brandId) => {
    const idStr = String(brandId);
    const exists = selectedIds.includes(idStr);
    const next = exists ? selectedIds.filter((id) => id !== idStr) : [...selectedIds, idStr];
    updateField('selectedBrandIds', next);
  };

  const moveSelected = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[index], next[target]] = [next[target], next[index]];
    updateField('selectedBrandIds', next);
  };

  const brandMap = new Map(availableBrands.map((b) => [String(b._id), b]));

  return (
    <div className="admin-card hp-editor-panel">
      <div className="admin-card-header">
        <div>
          <h3>Our Partners Showcase</h3>
          <p className="hp-panel-desc">
            Automatically displays active manufacturing partner brands synced with your Brands database. Logos, names, and counts stay live automatically.
          </p>
        </div>

        <label className="hp-checkbox-pill">
          <input
            type="checkbox"
            checked={partners.enabled !== false}
            onChange={(e) => updateField('enabled', e.target.checked)}
          />
          <span>Section Visible</span>
        </label>
      </div>

      <div className="hp-form-stack">
        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="partsec-eyebrow">Section Eyebrow</label>
            <input
              id="partsec-eyebrow"
              type="text"
              value={partners.eyebrow || ''}
              onChange={(e) => updateField('eyebrow', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="partsec-heading">Section Heading</label>
            <input
              id="partsec-heading"
              type="text"
              value={partners.heading || ''}
              onChange={(e) => updateField('heading', e.target.value)}
            />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="partsec-subtitle">Section Subtitle</label>
          <textarea
            id="partsec-subtitle"
            rows={2}
            value={partners.subtitle || ''}
            onChange={(e) => updateField('subtitle', e.target.value)}
          />
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="partsec-ctaText">CTA Button Text</label>
            <input
              id="partsec-ctaText"
              type="text"
              value={partners.ctaText || ''}
              onChange={(e) => updateField('ctaText', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="partsec-ctaLink">CTA Button Link</label>
            <input
              id="partsec-ctaLink"
              type="text"
              value={partners.ctaLink || '/products'}
              onChange={(e) => updateField('ctaLink', e.target.value)}
            />
          </div>
        </div>

        <div className="hp-subcollection">
          <div className="hp-subcollection-header">
            <div>
              <h4>Featured Partners Selection</h4>
              <p className="hp-field-hint">
                Leave unselected to showcase all active partner brands automatically, or check specific partners to customize display selection &amp; order.
              </p>
            </div>
            {selectedIds.length > 0 && (
              <button
                type="button"
                className="adm-btn adm-btn-ghost adm-btn-sm"
                onClick={() => updateField('selectedBrandIds', [])}
              >
                Show All Partners
              </button>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="hp-selected-order-box">
              <strong>Selected Partner Order ({selectedIds.length}):</strong>
              <div className="hp-selected-chips">
                {selectedIds.map((id, idx) => {
                  const brand = brandMap.get(id);
                  if (!brand) return null;
                  return (
                    <div key={id} className="hp-order-chip">
                      <span>
                        {idx + 1}. {brand.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => moveSelected(idx, -1)}
                        disabled={idx === 0}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSelected(idx, 1)}
                        disabled={idx === selectedIds.length - 1}
                      >
                        →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="hp-catalogue-picker-grid">
            {availableBrands.map((brand) => {
              const idStr = String(brand._id);
              const checked = selectedIds.includes(idStr);
              return (
                <label
                  key={idStr}
                  className={`hp-catalogue-pick-item ${checked ? 'is-selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBrand(idStr)}
                  />
                  {brand.logoUrl && (
                    <img
                      src={resolveAssetUrl(brand.logoUrl)}
                      alt={brand.name}
                      className="hp-pick-thumb hp-pick-thumb--contain"
                    />
                  )}
                  <div className="hp-pick-meta">
                    <span className="hp-pick-name">{brand.name}</span>
                    <small className="hp-pick-sub">
                      {brand.productCount || 0} active products
                    </small>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

