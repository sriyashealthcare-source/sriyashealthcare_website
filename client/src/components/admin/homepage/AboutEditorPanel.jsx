import React from 'react';
import ImageUploadField from './ImageUploadField';

export default function AboutEditorPanel({ about, onChange }) {
  const updateField = (key, value) => {
    onChange({ ...about, [key]: value });
  };

  const images = Array.isArray(about.images) ? about.images : [];

  const updateImageItem = (index, patch) => {
    const next = images.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
    updateField('images', next);
  };

  const addImageSlot = () => {
    const next = [
      ...images,
      {
        id: `about-img-${Date.now()}`,
        url: '',
        publicId: '',
        caption: '',
        size: images.length === 0 ? 'primary' : images.length === 1 ? 'secondary' : 'accent',
        displayOrder: images.length + 1
      }
    ];
    updateField('images', next);
  };

  const moveImage = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    updateField(
      'images',
      next.map((item, idx) => ({ ...item, displayOrder: idx + 1 }))
    );
  };

  const removeImage = (index) => {
    const next = images
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    updateField('images', next);
  };

  return (
    <div className="admin-card hp-editor-panel">
      <div className="admin-card-header">
        <div>
          <h3>About Sriyas Healthcare</h3>
          <p className="hp-panel-desc">
            Tell Sriyas Healthcare&apos;s authentic corporate story, vision, mission, and upload multiple images rendered as an overlapping architectural collage.
          </p>
        </div>

        <label className="hp-checkbox-pill">
          <input
            type="checkbox"
            checked={about.enabled !== false}
            onChange={(e) => updateField('enabled', e.target.checked)}
          />
          <span>Section Visible</span>
        </label>
      </div>

      <div className="hp-form-stack">
        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="about-eyebrow">Section Eyebrow</label>
            <input
              id="about-eyebrow"
              type="text"
              value={about.eyebrow || ''}
              onChange={(e) => updateField('eyebrow', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="about-preset">Collage Layout Preset</label>
            <select
              id="about-preset"
              value={about.layoutPreset || 'split-collage'}
              onChange={(e) => updateField('layoutPreset', e.target.value)}
            >
              <option value="split-collage">Asymmetric Split &amp; Overlapping Collage</option>
              <option value="editorial-stacked">Editorial Stacked Story</option>
              <option value="centered-feature">Centered Executive Feature</option>
            </select>
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="about-heading">Main Section Heading</label>
          <input
            id="about-heading"
            type="text"
            value={about.heading || ''}
            onChange={(e) => updateField('heading', e.target.value)}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="about-intro">Company Introduction (Lead Paragraph)</label>
          <textarea
            id="about-intro"
            rows={3}
            value={about.introduction || ''}
            onChange={(e) => updateField('introduction', e.target.value)}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="about-supporting">Supporting Corporate Narrative</label>
          <textarea
            id="about-supporting"
            rows={3}
            value={about.supportingText || ''}
            onChange={(e) => updateField('supportingText', e.target.value)}
          />
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="about-vision">Vision Statement</label>
            <textarea
              id="about-vision"
              rows={3}
              value={about.vision || ''}
              onChange={(e) => updateField('vision', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="about-mission">Mission Statement</label>
            <textarea
              id="about-mission"
              rows={3}
              value={about.mission || ''}
              onChange={(e) => updateField('mission', e.target.value)}
            />
          </div>
        </div>

        <div className="hp-subcollection">
          <div className="hp-subcollection-header">
            <div>
              <h4>About Section Images ({images.length})</h4>
              <p className="hp-field-hint">
                Image 1 renders as the primary focal frame; Image 2 overlaps subtly beside it.
              </p>
            </div>
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={addImageSlot}
              disabled={images.length >= 6}
            >
              + Add Photo
            </button>
          </div>

          {images.length === 0 && (
            <p className="hp-empty-note">
              No About images uploaded yet. Add images from Cloudinary or local photo files.
            </p>
          )}

          <div className="hp-repeater-list">
            {images.map((img, idx) => (
              <div key={img.id || idx} className="hp-repeater-item">
                <div className="hp-repeater-top">
                  <strong>Photo #{idx + 1}</strong>
                  <div className="hp-repeater-actions">
                    <button
                      type="button"
                      className="adm-btn adm-btn-ghost adm-btn-sm"
                      onClick={() => moveImage(idx, -1)}
                      disabled={idx === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="adm-btn adm-btn-ghost adm-btn-sm"
                      onClick={() => moveImage(idx, 1)}
                      disabled={idx === images.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="adm-btn adm-btn-danger adm-btn-sm"
                      onClick={() => removeImage(idx)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <ImageUploadField
                  compact
                  label=""
                  value={{ url: img.url, publicId: img.publicId, alt: img.caption }}
                  onChange={(media) =>
                    updateImageItem(idx, {
                      url: media.url,
                      publicId: media.publicId,
                      caption: img.caption || media.alt || ''
                    })
                  }
                />

                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>Caption</label>
                    <input
                      type="text"
                      value={img.caption || ''}
                      onChange={(e) => updateImageItem(idx, { caption: e.target.value })}
                      placeholder="Caption shown beneath photo"
                    />
                  </div>
                  <div className="admin-field">
                    <label>Frame Role</label>
                    <select
                      value={img.size || 'primary'}
                      onChange={(e) => updateImageItem(idx, { size: e.target.value })}
                    >
                      <option value="primary">Primary Feature Frame</option>
                      <option value="secondary">Overlapping Secondary Frame</option>
                      <option value="accent">Accent Frame</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

