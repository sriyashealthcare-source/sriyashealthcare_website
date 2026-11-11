import React from 'react';
import ImageUploadField from './ImageUploadField';

export default function WhatWeDoEditorPanel({ whatWeDo, onChange }) {
  const updateField = (key, value) => {
    onChange({ ...whatWeDo, [key]: value });
  };

  const items = Array.isArray(whatWeDo.items) ? whatWeDo.items : [];

  const updateItem = (index, patch) => {
    const next = items.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
    updateField('items', next);
  };

  const addItem = () => {
    const next = [
      ...items,
      {
        id: `wwd-${Date.now()}`,
        title: 'New Healthcare Capability',
        description: '',
        icon: '🩺',
        image: { url: '', publicId: '', alt: '' },
        linkUrl: '/products',
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
          <h3>What We Do</h3>
          <p className="hp-panel-desc">
            Highlight Sriyas Healthcare&apos;s distribution capabilities, clinical product specialties, and hospital supply activities.
          </p>
        </div>

        <label className="hp-checkbox-pill">
          <input
            type="checkbox"
            checked={whatWeDo.enabled !== false}
            onChange={(e) => updateField('enabled', e.target.checked)}
          />
          <span>Section Visible</span>
        </label>
      </div>

      <div className="hp-form-stack">
        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="wwd-eyebrow">Section Eyebrow</label>
            <input
              id="wwd-eyebrow"
              type="text"
              value={whatWeDo.eyebrow || ''}
              onChange={(e) => updateField('eyebrow', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="wwd-heading">Section Heading</label>
            <input
              id="wwd-heading"
              type="text"
              value={whatWeDo.heading || ''}
              onChange={(e) => updateField('heading', e.target.value)}
            />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="wwd-subtitle">Section Subtitle</label>
          <textarea
            id="wwd-subtitle"
            rows={2}
            value={whatWeDo.subtitle || ''}
            onChange={(e) => updateField('subtitle', e.target.value)}
          />
        </div>

        <div className="hp-subcollection">
          <div className="hp-subcollection-header">
            <h4>Activity Cards ({items.length})</h4>
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={addItem}
            >
              + Add Activity Card
            </button>
          </div>

          <div className="hp-repeater-list">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="hp-repeater-item">
                <div className="hp-repeater-top">
                  <strong>
                    Card #{idx + 1}: {item.title || 'Untitled'}
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
                    <label>Card Title *</label>
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => updateItem(idx, { title: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>Badge Icon (Emoji/Symbol)</label>
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

                <div className="admin-field">
                  <label>Link Destination</label>
                  <input
                    type="text"
                    value={item.linkUrl || ''}
                    onChange={(e) => updateItem(idx, { linkUrl: e.target.value })}
                    placeholder="/products/peters"
                  />
                </div>

                <ImageUploadField
                  compact
                  label="Card Feature Image (optional)"
                  value={item.image}
                  onChange={(media) => updateItem(idx, { image: media })}
                  hint="If omitted, the badge icon is styled prominently instead."
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

