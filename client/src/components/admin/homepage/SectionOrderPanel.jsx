import React, { useState } from 'react';

const SECTION_META = {
  about: {
    label: 'About Sriyas Healthcare',
    desc: 'Corporate story, vision, mission & collage imagery',
    tabId: 'about'
  },
  whatWeDo: {
    label: 'What We Do',
    desc: 'Specialty medical & surgical distribution capability cards',
    tabId: 'whatWeDo'
  },
  founders: {
    label: 'Founders & Leadership',
    desc: 'Leadership portraits & bios (auto-hidden if empty)',
    tabId: 'founders'
  },
  productCategories: {
    label: 'Healthcare Solutions / Product Categories',
    desc: 'Dynamic product category grid synced from database',
    tabId: 'productCategories'
  },
  partners: {
    label: 'Our Partners',
    desc: 'Floating manufacturer partner logos synced from Brands collection',
    tabId: 'partners'
  },
  whyChooseUs: {
    label: 'Why Choose Sriyas Healthcare',
    desc: 'Editorial strength pillars highlighting clinical reliability',
    tabId: 'whyChooseUs'
  },
  callToAction: {
    label: 'Closing Call To Action',
    desc: 'Obsidian & gold bottom conversion banner',
    tabId: 'callToAction'
  }
};

export default function SectionOrderPanel({
  draft,
  onOrderChange,
  onToggleSection,
  onNavigateTab
}) {
  const [dragIndex, setDragIndex] = useState(null);

  const order = Array.isArray(draft.sectionOrder) ? draft.sectionOrder : [];

  const moveSection = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= order.length || fromIndex === toIndex) return;
    const next = [...order];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onOrderChange(next);
  };

  return (
    <div className="admin-card hp-editor-panel">
      <div className="admin-card-header">
        <div>
          <h3>Homepage Section Order &amp; Visibility</h3>
          <p className="hp-panel-desc">
            Drag rows or use the arrows to change how storytelling sections appear beneath the Hero section. Toggle any section on or off cleanly.
          </p>
        </div>
      </div>

      <div className="hp-order-locked-row">
        <div>
          <span className="hp-order-badge">Pinned #1</span>
          <strong>Hero Brand Transformation Stage</strong>
          <small>Always anchored at top of homepage for scroll-to-navbar logo animation.</small>
        </div>
        <button
          type="button"
          className="adm-btn adm-btn-secondary adm-btn-sm"
          onClick={() => onNavigateTab('hero')}
        >
          Edit Hero
        </button>
      </div>

      <div className="hp-order-list">
        {order.map((key, idx) => {
          const meta = SECTION_META[key] || { label: key, desc: '', tabId: key };
          const sectionObj = draft[key] || {};
          const isEnabled = sectionObj.enabled !== false;

          return (
            <div
              key={key}
              draggable
              onDragStart={() => setDragIndex(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== idx) {
                  moveSection(dragIndex, idx);
                }
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`hp-order-row ${dragIndex === idx ? 'is-dragging' : ''} ${
                !isEnabled ? 'is-hidden-section' : ''
              }`}
            >
              <div className="hp-order-handle" title="Drag to reorder" aria-hidden="true">
                ⋮⋮
              </div>

              <div className="hp-order-num">#{idx + 2}</div>

              <div className="hp-order-info">
                <strong>{meta.label}</strong>
                <small>{meta.desc}</small>
              </div>

              <div className="hp-order-controls">
                <label className="hp-checkbox-pill">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => onToggleSection(key, e.target.checked)}
                  />
                  <span>{isEnabled ? 'Visible' : 'Hidden'}</span>
                </label>

                <button
                  type="button"
                  className="adm-btn adm-btn-ghost adm-btn-sm"
                  onClick={() => moveSection(idx, idx - 1)}
                  disabled={idx === 0}
                  title="Move Up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn-ghost adm-btn-sm"
                  onClick={() => moveSection(idx, idx + 1)}
                  disabled={idx === order.length - 1}
                  title="Move Down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary adm-btn-sm"
                  onClick={() => onNavigateTab(meta.tabId)}
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

