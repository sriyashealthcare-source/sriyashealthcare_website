import React, { useState, useRef, useEffect } from 'react';

const SECTION_META = {
  hero: {
    label: 'Hero Brand & Logo Stage',
    desc: 'Large central emblem, corporate identity, tagline, mission statement & primary action buttons',
    tabId: 'hero',
    badge: 'Stage 1'
  },
  about: {
    label: 'About Sriyas Healthcare',
    desc: 'Corporate story, vision, mission, hospital commitment & photographic collage',
    tabId: 'about',
    badge: 'Overview'
  },
  statistics: {
    label: 'Key Statistics & Impact Counter',
    desc: 'Animated milestones, years of experience, partner count & healthcare metrics',
    tabId: 'statistics',
    badge: 'Metrics'
  },
  workplace: {
    label: 'Company Gallery & Workplace',
    desc: 'Office interior, clinical distribution operations & team workspace photo gallery',
    tabId: 'workplace',
    badge: 'Facilities'
  },
  leadership: {
    label: 'Leadership & Governance',
    desc: 'Executive leadership portraits, designations & authentic leadership bios',
    tabId: 'leadership',
    badge: 'Executives'
  },
  team: {
    label: 'Team Members & Clinical Support',
    desc: 'Hospital coordination, clinical liaison and supply logistics specialists',
    tabId: 'team',
    badge: 'People'
  },
  whatWeDo: {
    label: 'What We Do',
    desc: 'Focused surgical supply, clinical distribution & healthcare capabilities',
    tabId: 'whatWeDo',
    badge: 'Services'
  },
  values: {
    label: 'Our Values & Why Choose Us',
    desc: 'Core trust pillars, clinical integrity & editorial feature imagery',
    tabId: 'values',
    badge: 'Pillars'
  },
  callToAction: {
    label: 'Closing Call To Action',
    desc: 'Partnering for Better Healthcare banner, hospital enquiry prompts & direct contact strip',
    tabId: 'callToAction',
    badge: 'Action'
  }
};

const ALL_SECTION_KEYS = [
  'hero',
  'about',
  'statistics',
  'workplace',
  'leadership',
  'team',
  'whatWeDo',
  'values',
  'callToAction'
];

export default function SectionOrderPanel({
  draft,
  onOrderChange,
  onToggleSection,
  onNavigateTab,
  onSaveOrder,
  isSaving = false,
  isDirty = false
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);
  const [dropPosition, setDropPosition] = useState('below'); // 'above' | 'below'
  const [saveFeedback, setSaveFeedback] = useState('');

  const touchState = useRef({
    startY: 0,
    currentIndex: null,
    activeRow: null
  });

  // Ensure all 8 canonical sections exist in the order array without duplicates
  const rawOrder = Array.isArray(draft?.sectionOrder) ? draft.sectionOrder : [];
  const order = React.useMemo(() => {
    const list = [];
    const seen = new Set();
    for (const key of rawOrder) {
      if (ALL_SECTION_KEYS.includes(key) && !seen.has(key)) {
        list.push(key);
        seen.add(key);
      }
    }
    for (const key of ALL_SECTION_KEYS) {
      if (!seen.has(key)) {
        list.push(key);
        seen.add(key);
      }
    }
    return list;
  }, [rawOrder]);

  const moveSection = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= order.length || fromIndex === toIndex) return;
    const next = [...order];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onOrderChange(next);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? 'above' : 'below';

    setDropTargetIndex(index);
    setDropPosition(pos);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDropTargetIndex(null);
      return;
    }

    let targetIdx = index;
    if (dropPosition === 'below' && draggedIndex < index) {
      targetIdx = index;
    } else if (dropPosition === 'above' && draggedIndex > index) {
      targetIdx = index;
    }

    moveSection(draggedIndex, targetIdx);
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  // Mobile Touch Drag Handlers
  const handleTouchStart = (e, index) => {
    const touch = e.touches[0];
    touchState.current = {
      startY: touch.clientY,
      currentIndex: index,
      activeRow: e.currentTarget.closest('.hp-order-row')
    };
    setDraggedIndex(index);
  };

  const handleTouchMove = (e) => {
    if (touchState.current.currentIndex === null) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = element?.closest('.hp-order-row');
    if (row && row.dataset.index !== undefined) {
      const targetIdx = parseInt(row.dataset.index, 10);
      if (!isNaN(targetIdx) && targetIdx !== touchState.current.currentIndex) {
        const rect = row.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const pos = touch.clientY < midY ? 'above' : 'below';
        setDropTargetIndex(targetIdx);
        setDropPosition(pos);
      }
    }
  };

  const handleTouchEnd = () => {
    if (
      touchState.current.currentIndex !== null &&
      dropTargetIndex !== null &&
      dropTargetIndex !== touchState.current.currentIndex
    ) {
      moveSection(touchState.current.currentIndex, dropTargetIndex);
    }
    touchState.current = { startY: 0, currentIndex: null, activeRow: null };
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleSaveClick = async () => {
    if (onSaveOrder) {
      setSaveFeedback('Saving order...');
      await onSaveOrder();
      setSaveFeedback('Section order saved successfully!');
      setTimeout(() => setSaveFeedback(''), 3500);
    }
  };

  return (
    <div className="admin-card hp-editor-panel">
      {/* Panel Header */}
      <div className="admin-card-header hp-order-header-wrap">
        <div>
          <div className="hp-order-eyebrow">HOMEPAGE ARCHITECTURE</div>
          <h3>Section Order &amp; Visibility</h3>
          <p className="hp-panel-desc">
            Decide exactly which sections appear first, second, third, and so on across the entire Sriyas Healthcare homepage.
            Drag rows using the grip handle or use arrow controls. Hidden sections are excluded from the live website.
          </p>
        </div>

        <div className="hp-order-header-actions">
          {isDirty && (
            <span className="hp-order-unsaved-pill" title="You have unsaved changes in the section order">
              ● Unsaved Changes
            </span>
          )}

          {saveFeedback && (
            <span className="hp-order-feedback-pill" role="status">
              ✓ {saveFeedback}
            </span>
          )}

          {onSaveOrder && (
            <button
              type="button"
              className="adm-btn adm-btn-primary adm-btn-sm hp-order-save-btn"
              onClick={handleSaveClick}
              disabled={isSaving}
              title="Save Section Order to Database"
            >
              {isSaving ? 'Saving Order...' : 'Save Order'}
            </button>
          )}
        </div>
      </div>

      {/* Helper Guidance Bar */}
      <div className="hp-order-guide-bar">
        <span className="hp-order-guide-icon" aria-hidden="true">💡</span>
        <span>
          <strong>Pro-tip:</strong> You can drag any section—including <em>Hero</em> and <em>CTA</em>—to any position.
          Use the <strong>Visible / Hidden</strong> toggle to selectively suppress seasonal or in-development sections without losing content.
        </span>
      </div>

      {/* Reorderable Section List */}
      <div
        className="hp-order-list"
        role="list"
        aria-label="Homepage Sections Order"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {order.map((key, idx) => {
          const meta = SECTION_META[key] || {
            label: key,
            desc: 'Custom homepage section',
            tabId: key,
            badge: 'Custom'
          };
          const sectionObj = draft?.[key] || {};
          const isEnabled = sectionObj.enabled !== false;

          const isDraggingThis = draggedIndex === idx;
          const isDropTargetThis = dropTargetIndex === idx;

          return (
            <div
              key={key}
              data-index={idx}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              className={`hp-order-row ${isDraggingThis ? 'is-dragging' : ''} ${
                isDropTargetThis ? `is-drop-target drop-${dropPosition}` : ''
              } ${!isEnabled ? 'is-hidden-section' : ''}`}
              role="listitem"
            >
              {/* Drag Handle with Desktop + Touch Support */}
              <div
                className="hp-order-handle"
                title="Drag to reorder section"
                aria-label={`Drag to reorder ${meta.label}`}
                onTouchStart={(e) => handleTouchStart(e, idx)}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <circle cx="6" cy="4" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="4" r="1.5" fill="currentColor" />
                  <circle cx="6" cy="9" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="9" r="1.5" fill="currentColor" />
                  <circle cx="6" cy="14" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="14" r="1.5" fill="currentColor" />
                </svg>
              </div>

              {/* Order Number Badge */}
              <div className="hp-order-num-badge" title={`Position #${idx + 1} on homepage`}>
                <span className="hp-order-num-prefix">#</span>
                <span className="hp-order-num-val">{idx + 1}</span>
              </div>

              {/* Section Details */}
              <div className="hp-order-info">
                <div className="hp-order-title-row">
                  <strong className="hp-order-title">{meta.label}</strong>
                  {meta.badge && <span className="hp-order-meta-badge">{meta.badge}</span>}
                  {!isEnabled && <span className="hp-order-status-tag tag-hidden">Hidden</span>}
                  {isEnabled && <span className="hp-order-status-tag tag-visible">Visible</span>}
                </div>
                <small className="hp-order-desc">{meta.desc}</small>
              </div>

              {/* Controls: Visibility Toggle, Arrows, and Edit Shortcut */}
              <div className="hp-order-controls">
                {/* Visibility Toggle Switch */}
                <label className="hp-visibility-switch" title={`Toggle visibility for ${meta.label}`}>
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => onToggleSection(key, e.target.checked)}
                    aria-label={`Toggle visibility of ${meta.label}`}
                  />
                  <span className="hp-visibility-slider">
                    <span className="hp-visibility-slider-knob" />
                  </span>
                  <span className="hp-visibility-label">{isEnabled ? 'Show' : 'Hide'}</span>
                </label>

                {/* Accessible Direction Buttons */}
                <div className="hp-order-arrow-group" role="group" aria-label="Reorder position">
                  <button
                    type="button"
                    className="adm-btn adm-btn-ghost adm-btn-sm hp-order-arrow-btn"
                    onClick={() => moveSection(idx, idx - 1)}
                    disabled={idx === 0}
                    title={`Move ${meta.label} Up to #${idx}`}
                    aria-label={`Move ${meta.label} up`}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="adm-btn adm-btn-ghost adm-btn-sm hp-order-arrow-btn"
                    onClick={() => moveSection(idx, idx + 1)}
                    disabled={idx === order.length - 1}
                    title={`Move ${meta.label} Down to #${idx + 2}`}
                    aria-label={`Move ${meta.label} down`}
                  >
                    ▼
                  </button>
                </div>

                {/* Edit Shortcut Button */}
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary adm-btn-sm hp-order-edit-btn"
                  onClick={() => onNavigateTab(meta.tabId)}
                  title={`Open ${meta.label} editor tab`}
                >
                  <span>Edit</span>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
