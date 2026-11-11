import React from 'react';

export default function WhyChooseUsEditorPanel({ whyChooseUs, onChange }) {
  const updateField = (key, value) => {
    onChange({ ...whyChooseUs, [key]: value });
  };

  const items = Array.isArray(whyChooseUs.items) ? whyChooseUs.items : [];

  const updateItem = (index, patch) => {
    const next = items.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
    updateField('items', next);
  };

  const addPillar = () => {
    const next = [
      ...items,
      {
        id: `wcu-${Date.now()}`,
        title: 'New Quality Pillar',
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
          <h3>Why Choose Sriyas Healthcare</h3>
          <p className="hp-panel-desc">
            Manage key strength pillars communicating clinical trustworthiness, manufacturer alliances, and responsive institutional support.
          </p>
        </div>

        <label className="hp-checkbox-pill">
          <input
            type="checkbox"
            checked={whyChooseUs.enabled !== false}
            onChange={(e) => updateField('enabled', e.target.checked)}
          />
          <span>Section Visible</span>
        </label>
      </div>

      <div className="hp-form-stack">
        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="wcu-eyebrow">Section Eyebrow</label>
            <input
              id="wcu-eyebrow"
              type="text"
              value={whyChooseUs.eyebrow || ''}
              onChange={(e) => updateField('eyebrow', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="wcu-heading">Section Heading</label>
            <input
              id="wcu-heading"
              type="text"
              value={whyChooseUs.heading || ''}
              onChange={(e) => updateField('heading', e.target.value)}
            />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="wcu-subtitle">Section Subtitle</label>
          <textarea
            id="wcu-subtitle"
            rows={2}
            value={whyChooseUs.subtitle || ''}
            onChange={(e) => updateField('subtitle', e.target.value)}
          />
        </div>

        <div className="hp-subcollection">
          <div className="hp-subcollection-header">
            <h4>Strength Pillars ({items.length})</h4>
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={addPillar}
            >
              + Add Pillar
            </button>
          </div>

          <div className="hp-repeater-list">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="hp-repeater-item">
                <div className="hp-repeater-top">
                  <strong>
                    Pillar #0{idx + 1}: {item.title || 'Untitled'}
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
                    <label>Pillar Title *</label>
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => updateItem(idx, { title: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>Icon Symbol</label>
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

