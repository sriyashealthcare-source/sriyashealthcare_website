import React, { useMemo, useState } from 'react';
import HomepageContentRenderer from '../../home/HomepageContentRenderer';
import '../../../styles/homepage.css';

function buildPreviewSnapshot(draft, availableBrands = [], availableCategories = []) {
  if (!draft) return null;

  const brandMap = new Map(availableBrands.map((b) => [String(b._id), b]));
  const catMap = new Map(availableCategories.map((c) => [String(c._id), c]));

  const maxCat = Number(draft.productCategories?.maxDisplay) || 8;
  const selCats = Array.isArray(draft.productCategories?.selectedCategoryIds)
    ? draft.productCategories.selectedCategoryIds
    : [];
  let resolvedCategories =
    selCats.length > 0
      ? selCats.map((id) => catMap.get(String(id))).filter(Boolean).slice(0, maxCat)
      : availableCategories.slice(0, maxCat);
  if (resolvedCategories.length === 0) {
    resolvedCategories = availableCategories.slice(0, maxCat);
  }

  const selBrands = Array.isArray(draft.partners?.selectedBrandIds)
    ? draft.partners.selectedBrandIds
    : [];
  let resolvedPartners =
    selBrands.length > 0
      ? selBrands.map((id) => brandMap.get(String(id))).filter(Boolean)
      : availableBrands;
  if (resolvedPartners.length === 0) {
    resolvedPartners = availableBrands;
  }

  return {
    ...draft,
    whatWeDo: {
      ...draft.whatWeDo,
      items: (draft.whatWeDo?.items || []).filter((item) => item.isActive !== false)
    },
    founders: {
      ...draft.founders,
      items: (draft.founders?.items || []).filter((item) => item.isActive !== false)
    },
    whyChooseUs: {
      ...draft.whyChooseUs,
      items: (draft.whyChooseUs?.items || []).filter((item) => item.isActive !== false)
    },
    resolvedCategories,
    resolvedPartners
  };
}

export default function HomepagePreviewModal({
  isOpen,
  draft,
  availableBrands,
  availableCategories,
  onClose,
  onPublish,
  publishing
}) {
  const [viewportMode, setViewportMode] = useState('desktop');

  const previewData = useMemo(
    () => buildPreviewSnapshot(draft, availableBrands, availableCategories),
    [draft, availableBrands, availableCategories]
  );

  if (!isOpen || !previewData) return null;

  return (
    <div className="hp-preview-backdrop" role="dialog" aria-modal="true" aria-label="Draft Homepage Preview">
      <div className="hp-preview-shell">
        <header className="hp-preview-topbar">
          <div className="hp-preview-title-group">
            <span className="status-badge status-in_review">Draft Preview</span>
            <strong>Live Simulation — Not Yet Visible to Customers</strong>
          </div>

          <div className="hp-preview-actions">
            <div className="hp-viewport-switch" role="group" aria-label="Preview Viewport">
              <button
                type="button"
                className={`adm-btn adm-btn-sm ${
                  viewportMode === 'desktop' ? 'adm-btn-primary' : 'adm-btn-ghost'
                }`}
                onClick={() => setViewportMode('desktop')}
              >
                Desktop
              </button>
              <button
                type="button"
                className={`adm-btn adm-btn-sm ${
                  viewportMode === 'mobile' ? 'adm-btn-primary' : 'adm-btn-ghost'
                }`}
                onClick={() => setViewportMode('mobile')}
              >
                Mobile (390px)
              </button>
            </div>

            <button
              type="button"
              className="adm-btn adm-btn-primary adm-btn-sm"
              onClick={onPublish}
              disabled={publishing}
            >
              {publishing ? 'Publishing...' : 'Publish Live'}
            </button>

            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={onClose}
            >
              Close Preview
            </button>
          </div>
        </header>

        <div className="hp-preview-stage">
          <div
            className={`hp-preview-scroll-viewport ${
              viewportMode === 'mobile' ? 'hp-preview-viewport--mobile' : 'hp-preview-viewport--desktop'
            }`}
          >
            <HomepageContentRenderer homepage={previewData} isPreview />
          </div>
        </div>
      </div>
    </div>
  );
}

