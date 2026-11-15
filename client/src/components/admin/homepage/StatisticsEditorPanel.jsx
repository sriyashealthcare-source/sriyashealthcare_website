import React, { useState } from 'react';

function makeId() {
  return `stat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

export default function StatisticsEditorPanel({ statistics = {}, onChange }) {
  const [editingId, setEditingId] = useState(null);

  const items = Array.isArray(statistics.items) ? [...statistics.items] : [];

  const updateField = (field, value) => {
    onChange({
      ...statistics,
      [field]: value
    });
  };

  const handleAddItem = () => {
    const newItem = {
      id: makeId(),
      title: 'New Milestone Metric',
      value: 0,
      prefix: '',
      suffix: '+',
      description: '',
      decimals: 0,
      displayOrder: items.length + 1,
      isActive: true
    };
    const nextItems = [...items, newItem];
    updateField('items', nextItems);
    setEditingId(newItem.id);
  };

  const handleUpdateItem = (id, updates) => {
    const nextItems = items.map((it) => (it.id === id ? { ...it, ...updates } : it));
    updateField('items', nextItems);
  };

  const handleRemoveItem = (id) => {
    if (!window.confirm('Are you sure you want to remove this statistic?')) return;
    const nextItems = items.filter((it) => it.id !== id);
    updateField('items', nextItems);
    if (editingId === id) setEditingId(null);
  };

  const handleMove = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const nextItems = [...items];
    const [moved] = nextItems.splice(index, 1);
    nextItems.splice(targetIdx, 0, moved);
    const reordered = nextItems.map((it, idx) => ({ ...it, displayOrder: idx + 1 }));
    updateField('items', reordered);
  };

  return (
    <div className="hp-panel">
      <div className="hp-panel-header">
        <div>
          <h2 className="hp-panel-title">Statistics &amp; Impact Counters</h2>
          <p className="hp-panel-desc">
            Manage company milestones, verified institutional metrics, and numerical statistics.
            When visitors scroll to this section, numbers count smoothly into view.
          </p>
        </div>
        <div className="hp-panel-toggle">
          <label className="hp-switch" aria-label="Enable Statistics Section">
            <input
              type="checkbox"
              checked={statistics.enabled !== false}
              onChange={(e) => updateField('enabled', e.target.checked)}
            />
            <span className="hp-switch-slider" />
          </label>
          <span className="hp-switch-label">
            {statistics.enabled !== false ? 'Section Active' : 'Section Disabled'}
          </span>
        </div>
      </div>

      <div className="hp-card" style={{ marginBottom: '24px' }}>
        <h3 className="hp-card-heading">Section Header Content</h3>
        <div className="hp-form-grid hp-form-grid--2col">
          <div className="hp-form-group">
            <label className="hp-form-label">Section Eyebrow</label>
            <input
              type="text"
              className="hp-input"
              value={statistics.eyebrow || ''}
              placeholder="e.g. Key Milestones & Reach"
              onChange={(e) => updateField('eyebrow', e.target.value)}
            />
          </div>

          <div className="hp-form-group">
            <label className="hp-form-label">Main Heading</label>
            <input
              type="text"
              className="hp-input"
              value={statistics.heading || ''}
              placeholder="e.g. Delivering Dependability at Scale"
              onChange={(e) => updateField('heading', e.target.value)}
            />
          </div>
        </div>

        <div className="hp-form-group" style={{ marginTop: '16px' }}>
          <label className="hp-form-label">Subtitle / Narrative Summary</label>
          <textarea
            className="hp-textarea"
            rows="2"
            value={statistics.subtitle || ''}
            placeholder="Brief introduction explaining company scale, distribution footprint, or institutional partnerships..."
            onChange={(e) => updateField('subtitle', e.target.value)}
          />
        </div>
      </div>

      <div className="hp-card">
        <div className="hp-card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 className="hp-card-heading" style={{ margin: 0 }}>Verified Numerical Statistics</h3>
            <p className="hp-panel-desc" style={{ margin: '4px 0 0' }}>
              Only publish verified factual numbers. If no statistics are active, this section is completely hidden from public visitors.
            </p>
          </div>
          <button
            type="button"
            className="adm-btn adm-btn-secondary adm-btn-sm"
            onClick={handleAddItem}
          >
            + Add Statistic
          </button>
        </div>

        {items.length === 0 ? (
          <div className="hp-empty-slate" style={{ padding: '36px', textAlign: 'center', background: '#faf8f2', borderRadius: '12px', border: '1px dashed #d8cca8' }}>
            <p style={{ margin: '0 0 12px', color: '#68604c', fontWeight: 500 }}>
              No company statistics have been added yet.
            </p>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#8e8673' }}>
              The statistics section is currently hidden from the live website. Click below to add verified metrics (e.g. Years of Experience, Partner Brands, or Product Lines).
            </p>
            <button
              type="button"
              className="adm-btn adm-btn-primary adm-btn-sm"
              onClick={handleAddItem}
            >
              Add First Statistic
            </button>
          </div>
        ) : (
          <div className="hp-stat-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {items.map((item, idx) => {
              const isExpanded = editingId === item.id;
              return (
                <div
                  key={item.id}
                  className="hp-stat-item-row"
                  style={{
                    border: '1px solid #e7decd',
                    borderRadius: '12px',
                    background: '#ffffff',
                    padding: '16px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: '#f4f0e6',
                          color: '#8A6A1F',
                          fontWeight: 700,
                          fontSize: '0.82rem'
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#242424', fontSize: '0.98rem' }}>
                          <span style={{ color: '#A9822C', marginRight: '6px' }}>
                            {item.prefix}{item.value}{item.suffix}
                          </span>
                          {item.title}
                        </div>
                        {item.description && (
                          <div style={{ fontSize: '0.82rem', color: '#777', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', marginRight: '8px' }}>
                        <input
                          type="checkbox"
                          checked={item.isActive !== false}
                          onChange={(e) => handleUpdateItem(item.id, { isActive: e.target.checked })}
                        />
                        <span>{item.isActive !== false ? 'Active' : 'Hidden'}</span>
                      </label>

                      <button
                        type="button"
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, -1)}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        disabled={idx === items.length - 1}
                        onClick={() => handleMove(idx, 1)}
                        title="Move Down"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn-secondary adm-btn-sm"
                        onClick={() => setEditingId(isExpanded ? null : item.id)}
                      >
                        {isExpanded ? 'Done' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn-danger adm-btn-sm"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '1px solid #f0eae1'
                      }}
                    >
                      <div className="hp-form-grid hp-form-grid--2col">
                        <div className="hp-form-group">
                          <label className="hp-form-label">Metric Title</label>
                          <input
                            type="text"
                            className="hp-input"
                            value={item.title || ''}
                            placeholder="e.g. Years of Experience"
                            onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                          />
                        </div>

                        <div className="hp-form-group">
                          <label className="hp-form-label">Numeric Value (Number to count to)</label>
                          <input
                            type="number"
                            step="any"
                            className="hp-input"
                            value={item.value !== undefined ? item.value : ''}
                            placeholder="e.g. 10 or 25"
                            onChange={(e) =>
                              handleUpdateItem(item.id, {
                                value: e.target.value === '' ? 0 : Number(e.target.value)
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="hp-form-grid hp-form-grid--3col" style={{ marginTop: '12px' }}>
                        <div className="hp-form-group">
                          <label className="hp-form-label">Prefix (Optional)</label>
                          <input
                            type="text"
                            className="hp-input"
                            value={item.prefix || ''}
                            placeholder="e.g. ₹ or +"
                            onChange={(e) => handleUpdateItem(item.id, { prefix: e.target.value })}
                          />
                        </div>

                        <div className="hp-form-group">
                          <label className="hp-form-label">Suffix (Optional)</label>
                          <input
                            type="text"
                            className="hp-input"
                            value={item.suffix || ''}
                            placeholder="e.g. + or % or Years"
                            onChange={(e) => handleUpdateItem(item.id, { suffix: e.target.value })}
                          />
                        </div>

                        <div className="hp-form-group">
                          <label className="hp-form-label">Decimals (0 for whole numbers)</label>
                          <select
                            className="hp-select"
                            value={item.decimals || 0}
                            onChange={(e) =>
                              handleUpdateItem(item.id, { decimals: Number(e.target.value) })
                            }
                          >
                            <option value="0">0 (e.g. 10)</option>
                            <option value="1">1 decimal (e.g. 10.5)</option>
                            <option value="2">2 decimals (e.g. 99.95)</option>
                          </select>
                        </div>
                      </div>

                      <div className="hp-form-group" style={{ marginTop: '12px' }}>
                        <label className="hp-form-label">Description (Optional)</label>
                        <input
                          type="text"
                          className="hp-input"
                          value={item.description || ''}
                          placeholder="e.g. Dedicated healthcare distribution service across Tamil Nadu"
                          onChange={(e) =>
                            handleUpdateItem(item.id, { description: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

