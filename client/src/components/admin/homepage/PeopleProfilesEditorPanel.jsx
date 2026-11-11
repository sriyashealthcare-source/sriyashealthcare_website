import React from 'react';
import ImageUploadField from './ImageUploadField';

export default function PeopleProfilesEditorPanel({
  sectionData = {},
  onChange,
  panelTitle,
  panelDescription,
  itemLabel = 'Profile',
  defaultDesignation = '',
  defaultPlaceholderPhoto = '/assets/placeholders/portrait-leadership-placeholder.svg'
}) {
  const updateField = (key, value) => {
    onChange({ ...sectionData, [key]: value });
  };

  const items = Array.isArray(sectionData.items) ? sectionData.items : [];

  const updateItem = (index, patch) => {
    const next = items.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
    updateField('items', next);
  };

  const addItem = () => {
    const next = [
      ...items,
      {
        id: `${itemLabel.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        name: `New ${itemLabel}`,
        designation: defaultDesignation,
        bio: '',
        photo: {
          url: defaultPlaceholderPhoto,
          publicId: '',
          mobileUrl: '',
          mobilePublicId: '',
          alt: `${itemLabel} portrait`,
          focalPoint: 'center top',
          aspectRatio: '1/1'
        },
        linkedinUrl: '',
        email: '',
        displayOrder: items.length + 1,
        isActive: true
      }
    ];
    updateField('items', next);
  };

  const moveItem = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    updateField(
      'items',
      next.map((item, idx) => ({ ...item, displayOrder: idx + 1 }))
    );
  };

  const removeItem = (index) => {
    const next = items
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    updateField('items', next);
  };

  return (
    <div className="admin-card hp-editor-panel">
      <div className="admin-card-header">
        <div>
          <h3>{panelTitle}</h3>
          <p className="hp-panel-desc">{panelDescription}</p>
        </div>

        <label className="hp-checkbox-pill">
          <input
            type="checkbox"
            checked={sectionData.enabled !== false}
            onChange={(e) => updateField('enabled', e.target.checked)}
          />
          <span>Section Visible</span>
        </label>
      </div>

      <div className="hp-form-stack">
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Section Eyebrow</label>
            <input
              type="text"
              value={sectionData.eyebrow || ''}
              onChange={(e) => updateField('eyebrow', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label>Section Heading</label>
            <input
              type="text"
              value={sectionData.heading || ''}
              onChange={(e) => updateField('heading', e.target.value)}
            />
          </div>
        </div>

        <div className="admin-field">
          <label>Section Subtitle</label>
          <textarea
            rows={2}
            value={sectionData.subtitle || ''}
            onChange={(e) => updateField('subtitle', e.target.value)}
          />
        </div>

        <div className="hp-subcollection">
          <div className="hp-subcollection-header">
            <h4>
              {itemLabel} Profiles ({items.length})
            </h4>
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={addItem}
            >
              + Add {itemLabel}
            </button>
          </div>

          {items.length === 0 && (
            <p className="hp-empty-note">
              No profiles added yet. Add portraits and bios below, or disable Section Visible above until ready.
            </p>
          )}

          <div className="hp-repeater-list">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="hp-repeater-item">
                <div className="hp-repeater-top">
                  <strong>
                    {itemLabel} #{idx + 1}: {item.name || 'Unnamed'}
                  </strong>
                  <div className="hp-repeater-actions">
                    <label className="hp-inline-check">
                      <input
                        type="checkbox"
                        checked={item.isActive !== false}
                        onChange={(e) => updateItem(idx, { isActive: e.target.checked })}
                      />
                      <span>Active</span>
                    </label>
                    <button
                      type="button"
                      className="adm-btn adm-btn-ghost adm-btn-sm"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="adm-btn adm-btn-ghost adm-btn-sm"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="adm-btn adm-btn-danger adm-btn-sm"
                      onClick={() => removeItem(idx)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <ImageUploadField
                  compact
                  roundPreview
                  label="Portrait Photo"
                  defaultAspectRatio="1/1"
                  value={item.photo}
                  onChange={(media) => updateItem(idx, { photo: media })}
                  hint="Tip: Select 'Top Center' focal point so heads and faces stay perfectly framed across all screen sizes."
                />

                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={item.name || ''}
                      onChange={(e) => updateItem(idx, { name: e.target.value })}
                    />
                  </div>
                  <div className="admin-field">
                    <label>Role / Designation</label>
                    <input
                      type="text"
                      value={item.designation || ''}
                      onChange={(e) => updateItem(idx, { designation: e.target.value })}
                      placeholder={defaultDesignation || 'Title or Department'}
                    />
                  </div>
                </div>

                <div className="admin-field">
                  <label>Short Biography</label>
                  <textarea
                    rows={3}
                    value={item.bio || ''}
                    onChange={(e) => updateItem(idx, { bio: e.target.value })}
                    placeholder="Concise introduction highlighting responsibilities and experience."
                  />
                </div>

                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>Email (optional)</label>
                    <input
                      type="email"
                      value={item.email || ''}
                      onChange={(e) => updateItem(idx, { email: e.target.value })}
                      placeholder="name@sriyashealthcare.com"
                    />
                  </div>
                  <div className="admin-field">
                    <label>LinkedIn URL (optional)</label>
                    <input
                      type="url"
                      value={item.linkedinUrl || ''}
                      onChange={(e) => updateItem(idx, { linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                    />
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

