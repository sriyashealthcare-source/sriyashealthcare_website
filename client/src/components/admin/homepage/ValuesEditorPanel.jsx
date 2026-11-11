import React from 'react';
import ImageUploadField from './ImageUploadField';

export default function ValuesEditorPanel({ values = {}, onChange }) {
  const updateField = (key, value) => {
    onChange({ ...values, [key]: value });
  };

  const items = Array.isArray(values.items) ? values.items : [];

  const updateItem = (index, patch) => {
    const next = items.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
    updateField('items', next);
  };

  const addItem = () => {
    const next = [
      ...items,
      {
        id: `val-${Date.now()}`,
        title: 'New Value Pillar',
        description: '',
        icon: '✦',
        displayOrder: items.length + 1,
        isActive: true
      }
    ];
    updateField('items', next);
  };

  const moveItem = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    updateField(
      'items',
      next.map((item, idx) => ({ ...item, displayOrder: idx + 1 }))
    );
  };

  const removeItem = (index) => {
    const next = items
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    updateField('items', next);
  };

  return (
    <div className="admin-card hp-editor-panel">
      <div className="admin-card-header">
        <div>
          <h3>Our Values &amp; Why Choose Sriyas</h3>
          <p className="hp-panel-desc">
            Highlight ethical governance, quality assurance, and hospital partnership values alongside an optional editorial feature photograph.
          </p>
        </div>

        <label className="hp-checkbox-pill">
          <input
            type="checkbox"
            checked={values.enabled !== false}
            onChange={(e) => updateField('enabled', e.target.checked)}
          />
          <span>Section Visible</span>
        </label>
      </div>

      <div className="hp-form-stack">
        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="val-eyebrow">Section Eyebrow</label>
            <input
              id="val-eyebrow"
              type="text"
              value={values.eyebrow || ''}
              onChange={(e) => updateField('eyebrow', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="val-heading">Section Heading</label>
            <input
              id="val-heading"
              type="text"
              value={values.heading || ''}
              onChange={(e) => updateField('heading', e.target.value)}
            />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="val-subtitle">Section Subtitle</label>
          <textarea
            id="val-subtitle"
            rows={2}
            value={values.subtitle || ''}
            onChange={(e) => updateField('subtitle', e.target.value)}
          />
        </div>

        <ImageUploadField
          label="Values Editorial Feature Image (Optional)"
          value={values.featureImage}
          defaultAspectRatio="4/3"
          onChange={(media) => updateField('featureImage', media)}
          hint="Displayed in the two-column Values split layout beside the pillars list."
        />

        <div className="hp-subcollection">
          <div className="hp-subcollection-header">
            <h4>Value Pillars ({items.length})</h4>
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={addItem}
            >
              + Add Value Pillar
            </button>
          </div>

          <div className="hp-repeater-list">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="hp-repeater-item">
                <div className="hp-repeater-top">
                  <strong>
                    Pillar #{idx + 1}: {item.title || 'Untitled'}
                  </strong>
                  <div className="hp-repeater-actions">
                    <label className="hp-inline-check">
                      <input
                        type="checkbox"
                        checked={item.isActive !== false}
                        onChange={(e) => updateItem(idx, { isActive: e.target.checked })}
                      />
                      <span>Active</span>
                    </label>
                    <button
                      type="button"
                      className="adm-btn adm-btn-ghost adm-btn-sm"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="adm-btn adm-btn-ghost adm-btn-sm"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="adm-btn adm-btn-danger adm-btn-sm"
                      onClick={() => removeItem(idx)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>Title *</label>
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => updateItem(idx, { title: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>Icon (Symbol / Emoji)</label>
                    <input
                      type="text"
                      value={item.icon || ''}
                      onChange={(e) => updateItem(idx, { icon: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-field">
                  <label>Description</label>
                  <textarea
                    rows={2}
                    value={item.description || ''}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

