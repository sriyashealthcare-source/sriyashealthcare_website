import React from 'react';
import ImageUploadField from './ImageUploadField';

const GALLERY_CATEGORIES = [
  'Office',
  'Workplace',
  'Team',
  'Business Activity',
  'Hospital Coordination',
  'Infrastructure'
];

export default function WorkplaceGalleryEditorPanel({ workplace = {}, onChange }) {
  const updateField = (key, value) => {
    onChange({ ...workplace, [key]: value });
  };

  const images = Array.isArray(workplace.images) ? workplace.images : [];

  const updateImage = (index, patch) => {
    const next = images.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
    updateField('images', next);
  };

  const addImage = () => {
    const next = [
      ...images,
      {
        id: `wp-${Date.now()}`,
        url: '',
        publicId: '',
        mobileUrl: '',
        mobilePublicId: '',
        alt: '',
        title: 'Company Workspace',
        caption: '',
        category: 'Workplace',
        focalPoint: 'center center',
        aspectRatio: '16/9',
        displayOrder: images.length + 1,
        isActive: true
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
          <h3>Company &amp; Workplace Gallery</h3>
          <p className="hp-panel-desc">
            Showcase authentic Sriyas Healthcare office spaces, clinical supply operations, and team coordination scenes. Placeholder photos can be replaced anytime via Cloudinary upload or Media Library.
          </p>
        </div>

        <label className="hp-checkbox-pill">
          <input
            type="checkbox"
            checked={workplace.enabled !== false}
            onChange={(e) => updateField('enabled', e.target.checked)}
          />
          <span>Section Visible</span>
        </label>
      </div>

      <div className="hp-form-stack">
        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="wp-eyebrow">Section Eyebrow</label>
            <input
              id="wp-eyebrow"
              type="text"
              value={workplace.eyebrow || ''}
              onChange={(e) => updateField('eyebrow', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="wp-layoutStyle">Gallery Layout Style</label>
            <select
              id="wp-layoutStyle"
              value={workplace.layoutStyle || 'editorial-collage'}
              onChange={(e) => updateField('layoutStyle', e.target.value)}
            >
              <option value="editorial-collage">Editorial Feature Montage</option>
              <option value="gallery-grid">Symmetrical Gallery Grid</option>
            </select>
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="wp-heading">Section Heading</label>
          <input
            id="wp-heading"
            type="text"
            value={workplace.heading || ''}
            onChange={(e) => updateField('heading', e.target.value)}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="wp-subtitle">Section Subtitle</label>
          <textarea
            id="wp-subtitle"
            rows={2}
            value={workplace.subtitle || ''}
            onChange={(e) => updateField('subtitle', e.target.value)}
          />
        </div>

        <div className="hp-subcollection">
          <div className="hp-subcollection-header">
            <div>
              <h4>Workplace &amp; Operations Photos ({images.length})</h4>
              <p className="hp-field-hint">
                Photo #1 spans wide in Editorial Feature mode; reorder anytime with the arrows.
              </p>
            </div>
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={addImage}
              disabled={images.length >= 12}
            >
              + Add Gallery Photo
            </button>
          </div>

          {images.length === 0 && (
            <p className="hp-empty-note">
              No workplace photos added yet. Click &quot;+ Add Gallery Photo&quot; to upload images or choose from the Media Library.
            </p>
          )}

          <div className="hp-repeater-list">
            {images.map((item, idx) => (
              <div key={item.id || idx} className="hp-repeater-item">
                <div className="hp-repeater-top">
                  <strong>
                    Photo #{idx + 1}: {item.title || 'Untitled'}
                  </strong>
                  <div className="hp-repeater-actions">
                    <label className="hp-inline-check">
                      <input
                        type="checkbox"
                        checked={item.isActive !== false}
                        onChange={(e) => updateImage(idx, { isActive: e.target.checked })}
                      />
                      <span>Active</span>
                    </label>
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
                      Delete
                    </button>
                  </div>
                </div>

                <ImageUploadField
                  compact
                  label="Gallery Photograph"
                  defaultAspectRatio="16/9"
                  value={{
                    url: item.url,
                    publicId: item.publicId,
                    mobileUrl: item.mobileUrl,
                    mobilePublicId: item.mobilePublicId,
                    alt: item.alt || item.title,
                    focalPoint: item.focalPoint || 'center center',
                    aspectRatio: item.aspectRatio || '16/9'
                  }}
                  onChange={(media) =>
                    updateImage(idx, {
                      url: media.url,
                      publicId: media.publicId,
                      mobileUrl: media.mobileUrl,
                      mobilePublicId: media.mobilePublicId,
                      alt: media.alt,
                      focalPoint: media.focalPoint,
                      aspectRatio: media.aspectRatio
                    })
                  }
                />

                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>Photo Title</label>
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => updateImage(idx, { title: e.target.value })}
                      placeholder="e.g., Corporate Reception & Welcome Lounge"
                    />
                  </div>
                  <div className="admin-field">
                    <label>Category Tag</label>
                    <select
                      value={item.category || 'Workplace'}
                      onChange={(e) => updateImage(idx, { category: e.target.value })}
                    >
                      {GALLERY_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-field">
                  <label>Short Caption</label>
                  <input
                    type="text"
                    value={item.caption || ''}
                    onChange={(e) => updateImage(idx, { caption: e.target.value })}
                    placeholder="Concise caption displayed on hover / card footer"
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

