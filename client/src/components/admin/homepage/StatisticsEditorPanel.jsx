import React, { useState, useRef, useEffect } from 'react';
import '../../../styles/statisticsEditor.css';

function makeId() {
  return `stat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function formatPreviewNumber(val, decimals = 0) {
  const num = Number(val);
  if (!Number.isFinite(num)) return '0';
  const dec = Math.max(0, Math.min(3, Number(decimals) || 0));
  return dec > 0 ? num.toFixed(dec) : Math.round(num).toLocaleString('en-IN');
}

export default function StatisticsEditorPanel({ statistics = {}, onChange }) {
  const items = Array.isArray(statistics.items) ? [...statistics.items] : [];

  // Track expanded state for each card (map of id -> boolean)
  const [expandedMap, setExpandedMap] = useState(() => {
    const map = {};
    // Initially expand the first card or all cards if 2 or fewer
    items.forEach((it, idx) => {
      map[it.id] = idx === 0 || items.length <= 2;
    });
    return map;
  });

  // Track which item was newly added to scroll & focus
  const [newlyAddedId, setNewlyAddedId] = useState(null);
  const cardRefs = useRef({});
  const titleInputRefs = useRef({});

  // When a new item is added, scroll into view and focus its title input
  useEffect(() => {
    if (newlyAddedId) {
      const cardEl = cardRefs.current[newlyAddedId];
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      const titleInput = titleInputRefs.current[newlyAddedId];
      if (titleInput) {
        const timer = setTimeout(() => {
          titleInput.focus();
        }, 150);
        return () => clearTimeout(timer);
      }
      setNewlyAddedId(null);
    }
  }, [newlyAddedId]);

  const updateField = (field, value) => {
    onChange({
      ...statistics,
      [field]: value
    });
  };

  const handleAddItem = () => {
    const newItem = {
      id: makeId(),
      title: '',
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

    setExpandedMap(prev => ({ ...prev, [newItem.id]: true }));
    setNewlyAddedId(newItem.id);
  };

  const handleUpdateItem = (id, updates) => {
    const nextItems = items.map((it) => (it.id === id ? { ...it, ...updates } : it));
    updateField('items', nextItems);
  };

  const handleRemoveItem = (id, title) => {
    const displayName = title ? `"${title}"` : 'this milestone';
    if (!window.confirm(`Are you sure you want to delete ${displayName}? This action cannot be undone once published.`)) {
      return;
    }
    const nextItems = items
      .filter((it) => it.id !== id)
      .map((it, idx) => ({ ...it, displayOrder: idx + 1 }));
    updateField('items', nextItems);
    setExpandedMap(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
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

  const toggleExpand = (id) => {
    setExpandedMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAllExpand = (expand) => {
    const newMap = {};
    items.forEach(it => {
      newMap[it.id] = expand;
    });
    setExpandedMap(newMap);
  };

  const activeCount = items.filter(it => it.isActive !== false).length;
  const isSectionActive = statistics.enabled !== false;

  return (
    <div className="hp-stats-editor-root">
      {/* ─────────────────────────────────────────────────────────────
          1. Header Card with Section Status Toggle
          ───────────────────────────────────────────────────────────── */}
      <div className="hp-stats-panel-header">
        <div className="hp-stats-header-info">
          <div className="hp-stats-badge-pill">
            <span className="hp-stats-badge-dot" />
            <span>Homepage Metrics</span>
          </div>
          <h2 className="hp-stats-title">Statistics &amp; Impact Counters</h2>
          <p className="hp-stats-desc">
            Manage company milestones, verified institutional metrics, and numerical statistics displayed on your homepage.
          </p>
        </div>

        {/* Section Active status control */}
        <div className="hp-stats-status-control">
          <div className="hp-stats-status-indicator">
            <span
              className={`hp-stats-status-dot ${isSectionActive ? 'is-active' : 'is-disabled'}`}
              aria-hidden="true"
            />
            <span className="hp-stats-status-text">
              {isSectionActive ? 'Section Active' : 'Section Disabled'}
            </span>
          </div>
          <label className="hp-stats-toggle-switch" title="Toggle section visibility on live website">
            <input
              type="checkbox"
              checked={isSectionActive}
              onChange={(e) => updateField('enabled', e.target.checked)}
            />
            <span className="hp-stats-toggle-track">
              <span className="hp-stats-toggle-thumb" />
            </span>
          </label>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. Section Header Content Card
          ───────────────────────────────────────────────────────────── */}
      <div className="hp-stats-card">
        <div className="hp-stats-card-header">
          <div className="hp-stats-card-title-wrap">
            <div className="hp-stats-card-icon" aria-hidden="true">📋</div>
            <div>
              <h3 className="hp-stats-card-title">Section Header Content</h3>
              <p className="hp-stats-card-desc">
                Configure the eyebrow label, main heading, and narrative introduction displayed above the statistics grid.
              </p>
            </div>
          </div>
        </div>

        <div className="hp-stats-form-grid">
          <div className="hp-stats-form-group">
            <label className="hp-stats-label" htmlFor="stats-eyebrow">
              <span>Section Eyebrow</span>
              <span className="hp-stats-opt">(Optional)</span>
            </label>
            <input
              id="stats-eyebrow"
              type="text"
              className="hp-stats-input"
              value={statistics.eyebrow || ''}
              placeholder="e.g. Key Milestones & Reach"
              onChange={(e) => updateField('eyebrow', e.target.value)}
            />
            <span className="hp-stats-input-hint">
              Small uppercase badge rendered directly above the primary heading.
            </span>
          </div>

          <div className="hp-stats-form-group">
            <label className="hp-stats-label" htmlFor="stats-heading">
              <span>Main Heading</span>
              <span className="hp-stats-opt">(Optional)</span>
            </label>
            <input
              id="stats-heading"
              type="text"
              className="hp-stats-input"
              value={statistics.heading || ''}
              placeholder="e.g. Delivering Dependability at Scale"
              onChange={(e) => updateField('heading', e.target.value)}
            />
            <span className="hp-stats-input-hint">
              Primary headline introducing company metrics and healthcare partnerships.
            </span>
          </div>
        </div>

        <div className="hp-stats-form-group" style={{ marginTop: '20px' }}>
          <label className="hp-stats-label" htmlFor="stats-subtitle">
            <span>Subtitle / Narrative Summary</span>
            <span className="hp-stats-opt">(Optional)</span>
          </label>
          <textarea
            id="stats-subtitle"
            className="hp-stats-textarea"
            rows="3"
            value={statistics.subtitle || ''}
            placeholder="Brief introduction explaining company scale, distribution footprint, institutional partnerships, or years of dedicated service..."
            onChange={(e) => updateField('subtitle', e.target.value)}
          />
          <span className="hp-stats-input-hint">
            Concise contextual paragraph bridging your corporate overview with institutional proof points.
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. Verified Numerical Statistics List Card
          ───────────────────────────────────────────────────────────── */}
      <div className="hp-stats-card">
        <div className="hp-stats-card-header">
          <div className="hp-stats-card-title-wrap">
            <div className="hp-stats-card-icon" aria-hidden="true">🔢</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 className="hp-stats-card-title">Verified Numerical Statistics</h3>
                <span className="hp-stats-count-tag">
                  {items.length} {items.length === 1 ? 'Metric' : 'Metrics'} ({activeCount} Active)
                </span>
              </div>
              <p className="hp-stats-card-desc">
                Only publish verified factual numbers. If no statistics are active, this section remains hidden from public visitors.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {items.length > 1 && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="hp-stat-toggle-expand-btn"
                  onClick={() => toggleAllExpand(true)}
                  title="Expand all cards"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  className="hp-stat-toggle-expand-btn"
                  onClick={() => toggleAllExpand(false)}
                  title="Collapse all cards"
                >
                  Collapse All
                </button>
              </div>
            )}

            <button
              type="button"
              className="hp-stats-add-btn"
              onClick={handleAddItem}
              id="stats-add-metric-btn"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              <span>Add Statistic</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="hp-stats-empty-state">
            <span className="hp-stats-empty-icon" aria-hidden="true">📊</span>
            <h4 className="hp-stats-empty-title">No Verified Statistics Added Yet</h4>
            <p className="hp-stats-empty-desc">
              The statistics section is currently hidden from the live website. Click below to add verified institutional numbers (e.g. Healthcare Partners, Years of Service, or Product Lines).
            </p>
            <button
              type="button"
              className="hp-stats-add-btn"
              onClick={handleAddItem}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              <span>Add First Statistic</span>
            </button>
          </div>
        ) : (
          /* List of Statistic Cards */
          <div className="hp-stats-list">
            {items.map((item, idx) => {
              const isExpanded = Boolean(expandedMap[item.id]);
              const formattedNumber = formatPreviewNumber(item.value, item.decimals);
              const isItemActive = item.isActive !== false;
              const hasTitleError = !String(item.title || '').trim();
              const hasValueError = !Number.isFinite(Number(item.value));

              return (
                <div
                  key={item.id || idx}
                  ref={(el) => { cardRefs.current[item.id] = el; }}
                  className={`hp-stat-card-item ${isExpanded ? 'is-expanded' : ''}`}
                >
                  {/* Card Header Strip */}
                  <div
                    className="hp-stat-item-header"
                    onClick={() => toggleExpand(item.id)}
                    title={isExpanded ? 'Click to collapse card' : 'Click to expand and edit card'}
                  >
                    <div className="hp-stat-item-meta">
                      {/* Order Indicator */}
                      <span className="hp-stat-order-pill" title={`Display Order: #${idx + 1}`}>
                        #{idx + 1}
                      </span>

                      {/* Title & Preview Badge */}
                      <div className="hp-stat-item-titles">
                        <div className="hp-stat-item-main-title">
                          <span className="hp-stat-item-preview-badge">
                            {item.prefix}{formattedNumber}{item.suffix}
                          </span>
                          <span>{item.title || <em style={{ color: '#9CA3AF', fontWeight: 400 }}>Untitled Statistic</em>}</span>
                        </div>
                        {item.description ? (
                          <p className="hp-stat-item-subtitle">{item.description}</p>
                        ) : (
                          <p className="hp-stat-item-subtitle" style={{ fontStyle: 'italic', color: '#999' }}>
                            No description entered
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="hp-stat-item-actions" onClick={(e) => e.stopPropagation()}>
                      {/* Active/Inactive Badge */}
                      <span className={`hp-stat-active-pill ${isItemActive ? 'is-active' : 'is-inactive'}`}>
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isItemActive ? '#16A34A' : '#9CA3AF'
                          }}
                        />
                        <span>{isItemActive ? 'Active' : 'Hidden'}</span>
                      </span>

                      {/* Reorder Buttons */}
                      <button
                        type="button"
                        className="hp-stat-icon-btn"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, -1)}
                        title="Move Up"
                        aria-label="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="hp-stat-icon-btn"
                        disabled={idx === items.length - 1}
                        onClick={() => handleMove(idx, 1)}
                        title="Move Down"
                        aria-label="Move Down"
                      >
                        ↓
                      </button>

                      {/* Expand / Collapse Control */}
                      <button
                        type="button"
                        className="hp-stat-toggle-expand-btn"
                        onClick={() => toggleExpand(item.id)}
                        aria-expanded={isExpanded}
                      >
                        <span>{isExpanded ? 'Done' : 'Edit'}</span>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                        >
                          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        className="hp-stat-icon-btn hp-stat-icon-btn-delete"
                        onClick={() => handleRemoveItem(item.id, item.title)}
                        title="Delete statistic"
                        aria-label="Delete statistic"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path d="M3 4h10M6 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Editing Area & Live Preview */}
                  {isExpanded && (
                    <div className="hp-stat-item-body">
                      {/* Left: Input Form Grid */}
                      <div className="hp-stat-editor-fields">
                        {/* Row 1: Metric Title (Full Width) */}
                        <div className="hp-stats-form-group">
                          <label className="hp-stats-label" htmlFor={`stat-title-${item.id}`}>
                            <span>Metric Title <span className="hp-stats-req">*</span></span>
                          </label>
                          <input
                            ref={(el) => { titleInputRefs.current[item.id] = el; }}
                            id={`stat-title-${item.id}`}
                            type="text"
                            className={`hp-stats-input ${hasTitleError ? 'has-error' : ''}`}
                            value={item.title || ''}
                            placeholder="Healthcare Partners"
                            onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                          />
                          {hasTitleError ? (
                            <span className="hp-stats-error-msg">Metric Title is required to display on the live website.</span>
                          ) : (
                            <span className="hp-stats-input-hint">The primary milestone label displayed beneath the numerical counter.</span>
                          )}
                        </div>

                        {/* Row 2: Value, Prefix, Suffix */}
                        <div className="hp-stat-row-3col">
                          <div className="hp-stats-form-group">
                            <label className="hp-stats-label" htmlFor={`stat-val-${item.id}`}>
                              <span>Numeric Value <span className="hp-stats-req">*</span></span>
                            </label>
                            <input
                              id={`stat-val-${item.id}`}
                              type="number"
                              step="any"
                              className={`hp-stats-input ${hasValueError ? 'has-error' : ''}`}
                              value={item.value !== undefined ? item.value : ''}
                              placeholder="25"
                              onChange={(e) =>
                                handleUpdateItem(item.id, {
                                  value: e.target.value === '' ? '' : Number(e.target.value)
                                })
                              }
                            />
                            {hasValueError ? (
                              <span className="hp-stats-error-msg">Enter a valid number.</span>
                            ) : (
                              <span className="hp-stats-input-hint">Target number counted up to.</span>
                            )}
                          </div>

                          <div className="hp-stats-form-group">
                            <label className="hp-stats-label" htmlFor={`stat-pre-${item.id}`}>
                              <span>Prefix</span>
                              <span className="hp-stats-opt">(Optional)</span>
                            </label>
                            <input
                              id={`stat-pre-${item.id}`}
                              type="text"
                              className="hp-stats-input"
                              value={item.prefix || ''}
                              placeholder="e.g. ₹ or +"
                              onChange={(e) => handleUpdateItem(item.id, { prefix: e.target.value })}
                            />
                            <span className="hp-stats-input-hint">Placed before number.</span>
                          </div>

                          <div className="hp-stats-form-group">
                            <label className="hp-stats-label" htmlFor={`stat-suf-${item.id}`}>
                              <span>Suffix</span>
                              <span className="hp-stats-opt">(Optional)</span>
                            </label>
                            <input
                              id={`stat-suf-${item.id}`}
                              type="text"
                              className="hp-stats-input"
                              value={item.suffix || ''}
                              placeholder="e.g. + or Years"
                              onChange={(e) => handleUpdateItem(item.id, { suffix: e.target.value })}
                            />
                            <span className="hp-stats-input-hint">Placed after number.</span>
                          </div>
                        </div>

                        {/* Row 3: Decimal Precision, Description */}
                        <div className="hp-stat-row-2col">
                          <div className="hp-stats-form-group">
                            <label className="hp-stats-label" htmlFor={`stat-dec-${item.id}`}>
                              <span>Decimal Precision</span>
                            </label>
                            <select
                              id={`stat-dec-${item.id}`}
                              className="hp-stats-select"
                              value={item.decimals || 0}
                              onChange={(e) =>
                                handleUpdateItem(item.id, { decimals: Number(e.target.value) })
                              }
                            >
                              <option value="0">0 (Whole numbers, e.g. 25)</option>
                              <option value="1">1 decimal (e.g. 25.5)</option>
                              <option value="2">2 decimals (e.g. 99.95)</option>
                            </select>
                            <span className="hp-stats-input-hint">Number of decimal places.</span>
                          </div>

                          <div className="hp-stats-form-group">
                            <label className="hp-stats-label" htmlFor={`stat-desc-${item.id}`}>
                              <span>Description</span>
                              <span className="hp-stats-opt">(Optional)</span>
                            </label>
                            <input
                              id={`stat-desc-${item.id}`}
                              type="text"
                              className="hp-stats-input"
                              value={item.description || ''}
                              placeholder="A short explanation of this milestone"
                              onChange={(e) =>
                                handleUpdateItem(item.id, { description: e.target.value })
                              }
                            />
                            <span className="hp-stats-input-hint">Secondary explanation shown below the title.</span>
                          </div>
                        </div>

                        {/* Active Toggle Control for this Card */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                          <label className="hp-stats-toggle-switch">
                            <input
                              type="checkbox"
                              checked={isItemActive}
                              onChange={(e) => handleUpdateItem(item.id, { isActive: e.target.checked })}
                            />
                            <span className="hp-stats-toggle-track">
                              <span className="hp-stats-toggle-thumb" />
                            </span>
                          </label>
                          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: isItemActive ? '#15803D' : '#6B7280' }}>
                            {isItemActive ? 'Published & Visible on Homepage' : 'Hidden from Homepage Visitors'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Real-time Live Homepage Preview */}
                      <div className="hp-stat-preview-container">
                        <div className="hp-stat-preview-header">
                          <span>Live Homepage Preview</span>
                          <span className="hp-stat-preview-tag">👁 Real-time</span>
                        </div>

                        <article className="hp-stat-live-preview-card">
                          <div className="hp-stat-preview-metric-wrap">
                            {item.prefix && (
                              <span className="hp-stat-preview-affix hp-stat-preview-prefix">{item.prefix}</span>
                            )}
                            <span className="hp-stat-preview-number">{formattedNumber}</span>
                            {item.suffix && (
                              <span className="hp-stat-preview-affix hp-stat-preview-suffix">{item.suffix}</span>
                            )}
                          </div>
                          <h4 className="hp-stat-preview-title">
                            {item.title || 'METRIC TITLE'}
                          </h4>
                          {item.description ? (
                            <p className="hp-stat-preview-desc">{item.description}</p>
                          ) : (
                            <p className="hp-stat-preview-desc" style={{ color: '#A0A0A0', fontStyle: 'italic' }}>
                              Optional milestone description
                            </p>
                          )}
                        </article>

                        <p className="hp-stat-preview-hint">
                          Preview reflects live homepage card styling, typography, and gold gradient numbers.
                        </p>
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
