import React from 'react';
import ImageUploadField from './ImageUploadField';

export default function FoundersEditorPanel({ founders, onChange }) {
  const updateField = (key, value) => {
    onChange({ ...founders, [key]: value });
  };

  const items = Array.isArray(founders.items) ? founders.items : [];

  const updateItem = (index, patch) => {
    const next = items.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
    updateField('items', next);
  };

  const addFounder = () => {
    const next = [
      ...items,
      {
        id: `founder-${Date.now()}`,
        name: '',
        designation: '',
        bio: '',
        photo: { url: '', publicId: '', alt: '' },
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
          <h3>Founders &amp; Leadership</h3>
          <p className="hp-panel-desc">
            Add real founder and executive leadership portraits, designations, and biographies. No placeholder profiles appear on the live site until you add at least one active person here.
          </p>
        </div>

        <label className="hp-checkbox-pill">
          <input
            type="checkbox"
            checked={founders.enabled !== false}
            onChange={(e) => updateField('enabled', e.target.checked)}
          />
          <span>Section Visible</span>
        </label>
      </div>

      <div className="hp-form-stack">
        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="founders-eyebrow">Section Eyebrow</label>
            <input
              id="founders-eyebrow"
              type="text"
              value={founders.eyebrow || ''}
              onChange={(e) => updateField('eyebrow', e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="founders-heading">Section Heading</label>
            <input
              id="founders-heading"
              type="text"
              value={founders.heading || ''}
              onChange={(e) => updateField('heading', e.target.value)}
            />
          </div>
        </div>

        <div className="admin-field">
          <label htmlFor="founders-subtitle">Section Subtitle</label>
          <textarea
            id="founders-subtitle"
            rows={2}
            value={founders.subtitle || ''}
            onChange={(e) => updateField('subtitle', e.target.value)}
          />
        </div>

        <div className="hp-subcollection">
          <div className="hp-subcollection-header">
            <h4>Leadership Profiles ({items.length})</h4>
            <button
              type="button"
              className="adm-btn adm-btn-primary adm-btn-sm"
              onClick={addFounder}
            >
              + Add Founder / Leader
            </button>
          </div>

          {items.length === 0 && (
            <div className="hp-empty-note">
              <strong>Public section hidden until populated:</strong> To maintain integrity, Sriyas Healthcare never renders stock photos or synthetic names. Click &ldquo;+ Add Founder / Leader&rdquo; above when ready to publish leadership profiles.
            </div>
          )}

          <div className="hp-repeater-list">
            {items.map((person, idx) => (
              <div key={person.id || idx} className="hp-repeater-item">
                <div className="hp-repeater-top">
                  <strong>
                    Leader #{idx + 1}: {person.name || 'New Profile (Name required to display)'}
                  </strong>
                  <div className="hp-repeater-actions">
                    <label className="hp-inline-check">
                      <input
                        type="checkbox"
                        checked={person.isActive !== false}
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
                      Remove
                    </button>
                  </div>
                </div>

                <ImageUploadField
                  compact
                  roundPreview
                  label="Portrait Photo (optional — displays gold monogram initials if blank)"
                  value={person.photo}
                  onChange={(media) => updateItem(idx, { photo: media })}
                  hint="Square headshot crop recommended."
                />

                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={person.name || ''}
                      onChange={(e) => updateItem(idx, { name: e.target.value })}
                      placeholder="e.g., Founder / Managing Director name"
                    />
                  </div>
                  <div className="admin-field">
                    <label>Designation / Role</label>
                    <input
                      type="text"
                      value={person.designation || ''}
                      onChange={(e) => updateItem(idx, { designation: e.target.value })}
                      placeholder="e.g., Founder &amp; Managing Director"
                    />
                  </div>
                </div>

                <div className="admin-field">
                  <label>Short Biography / Leadership Message</label>
                  <textarea
                    rows={3}
                    value={person.bio || ''}
                    onChange={(e) => updateItem(idx, { bio: e.target.value })}
                    placeholder="Concise background or leadership perspective..."
                  />
                </div>

                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>LinkedIn URL (optional)</label>
                    <input
                      type="url"
                      value={person.linkedinUrl || ''}
                      onChange={(e) => updateItem(idx, { linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="admin-field">
                    <label>Email Address (optional)</label>
                    <input
                      type="email"
                      value={person.email || ''}
                      onChange={(e) => updateItem(idx, { email: e.target.value })}
                      placeholder="name@sriyashealthcare.com"
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

