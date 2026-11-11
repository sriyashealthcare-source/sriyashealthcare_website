import React, { useMemo, useState } from 'react';
import HomepageContentRenderer from '../../home/HomepageContentRenderer';
import '../../../styles/homepage.css';

function buildPreviewSnapshot(draft) {
  if (!draft) return null;

  return {
    ...draft,
    workplace: {
      ...draft.workplace,
      images: (draft.workplace?.images || []).filter(
        (item) => item.isActive !== false && item.url
      )
    },
    leadership: {
      ...draft.leadership,
      items: (draft.leadership?.items || []).filter(
        (item) => item.isActive !== false && item.name
      )
    },
    team: {
      ...draft.team,
      items: (draft.team?.items || []).filter(
        (item) => item.isActive !== false && item.name
      )
    },
    whatWeDo: {
      ...draft.whatWeDo,
      items: (draft.whatWeDo?.items || []).filter(
        (item) => item.isActive !== false && item.title
      )
    },
    values: {
      ...draft.values,
      items: (draft.values?.items || []).filter(
        (item) => item.isActive !== false && item.title
      )
    }
  };
}

export default function HomepagePreviewModal({
  isOpen,
  draft,
  onClose,
  onPublish,
  publishing
}) {
  const [viewportMode, setViewportMode] = useState('desktop');

  const previewData = useMemo(() => buildPreviewSnapshot(draft), [draft]);

  if (!isOpen || !previewData) return null;

  const isMobilePreview = viewportMode === 'mobile';

  return (
    <div
      className="hp-preview-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Draft Homepage Preview"
    >
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
                  !isMobilePreview ? 'adm-btn-primary' : 'adm-btn-ghost'
                }`}
                onClick={() => setViewportMode('desktop')}
              >
                Desktop
              </button>
              <button
                type="button"
                className={`adm-btn adm-btn-sm ${
                  isMobilePreview ? 'adm-btn-primary' : 'adm-btn-ghost'
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
              isMobilePreview ? 'hp-preview-viewport--mobile' : 'hp-preview-viewport--desktop'
            }`}
          >
            <HomepageContentRenderer
              homepage={previewData}
              isPreview
              forceMobile={isMobilePreview}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
