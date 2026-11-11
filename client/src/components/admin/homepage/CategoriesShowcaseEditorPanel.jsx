import React from 'react';
import { resolveAssetUrl } from '../../../utils/session';

export default function CategoriesShowcaseEditorPanel({
  productCategories,
  availableCategories = [],
  onChange
}) {
  const updateField = (key, value) => {
    onChange({ ...productCategories, [key]: value });
  };

  const selectedIds = Array.isArray(productCategories.selectedCategoryIds)
    ? productCategories.selectedCategoryIds
    : [];

  const toggleCategory = (catId) => {
    const idStr = String(catId);
    const exists = selectedIds.includes(idStr);
    const next = exists ? selectedIds.filter((id) => id !== idStr) : [...selectedIds, idStr];
    updateField('selectedCategoryIds', next);
  };

  const moveSelected = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[index], next[target]] = [next[target], next[index]];
    updateField('selectedCategoryIds', next);
  };

  const categoryMap = new Map(availableCategories.map((c) => [String(c._id), c]));

  return (
    <div className="admin-card hp-editor-panel">
      <div className="admin-card-header">
        <div>
          <h3>Healthcare Solutions / Product Categories</h3>
          <p className="hp-panel-desc">
            Automatically synced with your active MongoDB Category collection. Customize section headings or hand-pick featured categories &amp; display order.
          </p>
        </div>

        <label className="hp-checkbox-pill">
          <input
            type="checkbox"
            checked={productCategories.enabled !== false}
            onChange={(e) => updateField('enabled', e.target.checked)}
          />
          <span>Section Visible</span>
        </label>
      </div>

      <div className="hp-form-stack">
        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="catsec-eyebrow">Section Eyebrow</label>
            <input
              id="catsec-eyebrow"
              type="text"
              value={productCategories.eyebrow || ''}
              onChange={(e) => updateField('eyebrow', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="catsec-heading">Section Heading</label>
            <input
              id="catsec-heading"
              type="text"
              value={productCategories.heading || ''}
              onChange={(e) => updateField('heading', e.target.value)}
            />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="catsec-subtitle">Section Subtitle</label>
          <textarea
            id="catsec-subtitle"
            rows={2}
            value={productCategories.subtitle || ''}
            onChange={(e) => updateField('subtitle', e.target.value)}
          />
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="catsec-max">Maximum Categories Displayed</label>
            <input
              id="catsec-max"
              type="number"
              min={1}
              max={24}
              value={productCategories.maxDisplay ?? 8}
              onChange={(e) => updateField('maxDisplay', Number(e.target.value) || 8)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="catsec-ctaText">Catalogue Button Text</label>
            <input
              id="catsec-ctaText"
              type="text"
              value={productCategories.ctaText || ''}
              onChange={(e) => updateField('ctaText', e.target.value)}
            />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="catsec-ctaLink">Catalogue Button Link</label>
          <input
            id="catsec-ctaLink"
            type="text"
            value={productCategories.ctaLink || '/products'}
            onChange={(e) => updateField('ctaLink', e.target.value)}
          />
        </div>

        <div className="hp-subcollection">
          <div className="hp-subcollection-header">
            <div>
              <h4>Featured Categories Picker</h4>
              <p className="hp-field-hint">
                Leave none selected to automatically show your top {productCategories.maxDisplay || 8} active categories in catalogue order, or check specific ones to feature and order below.
              </p>
            </div>
            {selectedIds.length > 0 && (
              <button
                type="button"
                className="adm-btn adm-btn-ghost adm-btn-sm"
                onClick={() => updateField('selectedCategoryIds', [])}
              >
                Reset to Auto
              </button>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="hp-selected-order-box">
              <strong>Selected Order ({selectedIds.length}):</strong>
              <div className="hp-selected-chips">
                {selectedIds.map((id, idx) => {
                  const cat = categoryMap.get(id);
                  if (!cat) return null;
                  return (
                    <div key={id} className="hp-order-chip">
                      <span>
                        {idx + 1}. {cat.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => moveSelected(idx, -1)}
                        disabled={idx === 0}
                        title="Move Left / Up"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSelected(idx, 1)}
                        disabled={idx === selectedIds.length - 1}
                        title="Move Right / Down"
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
            {availableCategories.map((cat) => {
              const idStr = String(cat._id);
              const checked = selectedIds.includes(idStr);
              return (
                <label
                  key={idStr}
                  className={`hp-catalogue-pick-item ${checked ? 'is-selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(idStr)}
                  />
                  {cat.heroImage?.url && (
                    <img
                      src={resolveAssetUrl(cat.heroImage.url)}
                      alt={cat.name}
                      className="hp-pick-thumb"
                    />
                  )}
                  <div className="hp-pick-meta">
                    <span className="hp-pick-name">{cat.name}</span>
                    <small className="hp-pick-sub">
                      {cat.brand?.name || 'All Partners'} · {cat.productCount || 0} products
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

