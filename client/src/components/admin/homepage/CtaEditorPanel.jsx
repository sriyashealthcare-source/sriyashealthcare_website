import React from 'react';
import ImageUploadField from './ImageUploadField';

export default function CtaEditorPanel({ callToAction = {}, onChange }) {
  const updateField = (key, value) => {
    onChange({ ...callToAction, [key]: value });
  };

  return (
    <div className="admin-card hp-editor-panel">
      <div className="admin-card-header">
        <div>
          <h3>Closing Call To Action &amp; Contact Invitation</h3>
          <p className="hp-panel-desc">
            Control the final obsidian &amp; gold conversion banner inviting hospitals and partners to explore Sriyas Healthcare&apos;s product catalogue or connect directly.
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

        <div className="hp-toggle-row">
          <label className="hp-checkbox-pill">
            <input
              type="checkbox"
              checked={callToAction.showContactDetails !== false}
              onChange={(e) => updateField('showContactDetails', e.target.checked)}
            />
            <span>Show Direct Contact Strip</span>
          </label>
        </div>

        {callToAction.showContactDetails !== false && (
          <>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="cta-phone">Phone Numbers Line</label>
                <input
                  id="cta-phone"
                  type="text"
                  value={callToAction.contactPhone || ''}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  placeholder="+91 96008 04456 · +91 93677 72801"
                />
              </div>

              <div className="admin-field">
                <label htmlFor="cta-email">Contact Email</label>
                <input
                  id="cta-email"
                  type="email"
                  value={callToAction.contactEmail || ''}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  placeholder="Sriyashealthcare@gmail.com"
                />
              </div>
            </div>

            <div className="admin-field">
              <label htmlFor="cta-address">Office Address Line</label>
              <textarea
                id="cta-address"
                rows={2}
                value={callToAction.contactAddress || ''}
                onChange={(e) => updateField('contactAddress', e.target.value)}
              />
            </div>
          </>
        )}

        <ImageUploadField
          label="CTA Atmospheric Backdrop Image (Optional)"
          value={callToAction.backgroundImage}
          defaultAspectRatio="16/9"
          onChange={(media) => updateField('backgroundImage', media)}
          hint="Subtle background atmosphere visible beneath the dark obsidian gradient."
        />
      </div>
    </div>
  );
}
