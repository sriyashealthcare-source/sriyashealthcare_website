import React, { useRef, useState } from 'react';
import { resolveAssetUrl } from '../../../utils/session';
import { homepageService } from '../../../services/homepageService';

export default function ImageUploadField({
  label = 'Image',
  value = { url: '', publicId: '', alt: '' },
  onChange,
  hint = 'Recommended: high-resolution JPG, PNG, or WEBP.',
  roundPreview = false,
  compact = false
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const currentUrl = value?.url || '';

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);
    try {
      const res = await homepageService.uploadImage(file);
      if (res?.image?.url) {
        onChange({
          url: res.image.url,
          publicId: res.image.publicId || '',
          alt: value?.alt || file.name.replace(/\.[^.]+$/, '')
        });
      }
    } catch (err) {
      setUploadError(
        err.response?.data?.message || 'Image upload failed. Please check your connection and file format.'
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    setUploadError('');
    onChange({ url: '', publicId: '', alt: '' });
  };

  return (
    <div className={`hp-upload-field ${compact ? 'hp-upload-field--compact' : ''}`}>
      {label && <label className="hp-field-label">{label}</label>}

      <div className="hp-upload-row">
        <div
          className={`hp-upload-thumb ${roundPreview ? 'hp-upload-thumb--round' : ''} ${
            !currentUrl ? 'is-empty' : ''
          }`}
        >
          {currentUrl ? (
            <img src={resolveAssetUrl(currentUrl)} alt={value?.alt || label} />
          ) : (
            <span className="hp-upload-placeholder-icon" aria-hidden="true">
              🖼️
            </span>
          )}
        </div>

        <div className="hp-upload-controls">
          <div className="hp-upload-buttons">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleFileChange}
              className="hp-hidden-file-input"
              disabled={uploading}
            />
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : currentUrl ? 'Replace Image' : 'Upload Image'}
            </button>

            {currentUrl && (
              <button
                type="button"
                className="adm-btn adm-btn-ghost adm-btn-sm"
                onClick={handleClear}
                disabled={uploading}
              >
                Remove
              </button>
            )}
          </div>

          {hint && <p className="hp-field-hint">{hint}</p>}

          {uploadError && (
            <p className="hp-field-error" role="alert">
              {uploadError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

