import React from 'react';

export default function CtaEditorPanel({ callToAction, onChange }) {
  const updateField = (key, value) => {
    onChange({ ...callToAction, [key]: value });
  };

  return (
    <div className="admin-card hp-editor-panel">
      <div className="admin-card-header">
        <div>
          <h3>Closing Call To Action Banner</h3>
          <p className="hp-panel-desc">
            Control the final obsidian &amp; champagne-gold action banner inviting hospitals and partners to explore products or contact Sriyas Healthcare.
          </p>
        </div>

        <label className="hp-checkbox-pill">
          <input
            type="checkbox"
            checked={callToAction.enabled !== false}
            onChange={(e) => updateField('enabled', e.target.checked)}
          />
          <span>Section Visible</span>
        </label>
      </div>

      <div className="hp-form-stack">
        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="cta-eyebrow">Section Eyebrow</label>
            <input
              id="cta-eyebrow"
              type="text"
              value={callToAction.eyebrow || ''}
              onChange={(e) => updateField('eyebrow', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="cta-heading">Main CTA Heading</label>
            <input
              id="cta-heading"
              type="text"
              value={callToAction.heading || ''}
              onChange={(e) => updateField('heading', e.target.value)}
            />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="cta-support">Supporting Text</label>
          <textarea
            id="cta-support"
            rows={2}
            value={callToAction.supportingText || ''}
            onChange={(e) => updateField('supportingText', e.target.value)}
          />
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="cta-priText">Primary Gold Button Text</label>
            <input
              id="cta-priText"
              type="text"
              value={callToAction.primaryButtonText || ''}
              onChange={(e) => updateField('primaryButtonText', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="cta-priLink">Primary Gold Button Link</label>
            <input
              id="cta-priLink"
              type="text"
              value={callToAction.primaryButtonLink || ''}
              onChange={(e) => updateField('primaryButtonLink', e.target.value)}
            />
          </div>
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="cta-secText">Secondary Outline Button Text</label>
            <input
              id="cta-secText"
              type="text"
              value={callToAction.secondaryButtonText || ''}
              onChange={(e) => updateField('secondaryButtonText', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="cta-secLink">Secondary Outline Button Link</label>
            <input
              id="cta-secLink"
              type="text"
              value={callToAction.secondaryButtonLink || ''}
              onChange={(e) => updateField('secondaryButtonLink', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

