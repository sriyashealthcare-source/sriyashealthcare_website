import React, { useRef, useState } from 'react';
import { resolveAssetUrl } from '../../../utils/session';
import { homepageService } from '../../../services/homepageService';
import MediaLibraryModal from './MediaLibraryModal';

const FOCAL_POINT_OPTIONS = [
  { value: 'center center', label: 'Center (Balanced)' },
  { value: 'center top', label: 'Top Center (Portraits / Heads)' },
  { value: 'center bottom', label: 'Bottom Center' },
  { value: 'left center', label: 'Left Focus' },
  { value: 'right center', label: 'Right Focus' }
];

const ASPECT_RATIO_OPTIONS = [
  { value: 'auto', label: 'Auto (Layout Default)' },
  { value: '16/9', label: '16:9 Widescreen' },
  { value: '4/3', label: '4:3 Editorial Card' },
  { value: '3/2', label: '3:2 Classic Photo' },
  { value: '1/1', label: '1:1 Square' },
  { value: '3/4', label: '3:4 Vertical Portrait' }
];

function normalizeMedia(value, defaultAspectRatio = 'auto') {
  return {
    url: value?.url || '',
    publicId: value?.publicId || '',
    mobileUrl: value?.mobileUrl || '',
    mobilePublicId: value?.mobilePublicId || '',
    alt: value?.alt || '',
    focalPoint: value?.focalPoint || 'center center',
    aspectRatio: value?.aspectRatio || defaultAspectRatio
  };
}

export default function ImageUploadField({
  label = 'Image',
  value,
  onChange,
  hint = 'Recommended: high-resolution JPG, PNG, or WEBP.',
  roundPreview = false,
  compact = false,
  allowMobileVariant = true,
  showPresentationControls = true,
  defaultAspectRatio = 'auto'
}) {
  const fileInputRef = useRef(null);
  const [variant, setVariant] = useState('desktop');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);

  const media = normalizeMedia(value, defaultAspectRatio);
  const activeIsMobile = allowMobileVariant && variant === 'mobile';
  const activeUrl = activeIsMobile ? media.mobileUrl : media.url;

  const commit = (patch) => {
    onChange({ ...media, ...patch });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);
    try {
      const res = await homepageService.uploadImage(file);
      if (res?.image?.url) {
        if (activeIsMobile) {
          commit({
            mobileUrl: res.image.url,
            mobilePublicId: res.image.publicId || ''
          });
        } else {
          commit({
            url: res.image.url,
            publicId: res.image.publicId || '',
            alt: media.alt || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
          });
        }
      }
    } catch (err) {
      setUploadError(
        err.response?.data?.message ||
          'Image upload failed. Please check your connection and file format.'
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectFromLibrary = (selected) => {
    setUploadError('');
    if (activeIsMobile) {
      commit({
        mobileUrl: selected.url,
        mobilePublicId: selected.publicId || ''
      });
    } else {
      commit({
        url: selected.url,
        publicId: selected.publicId || '',
        alt: media.alt || selected.suggestedAlt || ''
      });
    }
  };

  const handleClearActive = () => {
    setUploadError('');
    if (activeIsMobile) {
      commit({ mobileUrl: '', mobilePublicId: '' });
    } else {
      commit({ url: '', publicId: '' });
    }
  };

  return (
    <div className={`hp-upload-field ${compact ? 'hp-upload-field--compact' : ''}`}>
      <div className="hp-upload-label-row">
        {label ? <label className="hp-field-label">{label}</label> : <span />}
        {allowMobileVariant && (
          <div className="hp-upload-subtabs" role="tablist" aria-label="Device image variant">
            <button
              type="button"
              role="tab"
              aria-selected={!activeIsMobile}
              className={`hp-upload-subtab ${!activeIsMobile ? 'is-active' : ''}`}
              onClick={() => setVariant('desktop')}
            >
              Desktop {media.url ? '●' : ''}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeIsMobile}
              className={`hp-upload-subtab ${activeIsMobile ? 'is-active' : ''}`}
              onClick={() => setVariant('mobile')}
            >
              Mobile {media.mobileUrl ? '●' : '(Auto)'}
            </button>
          </div>
        )}
      </div>

      <div className="hp-upload-row">
        <div
          className={`hp-upload-thumb ${roundPreview ? 'hp-upload-thumb--round' : ''} ${
            !activeUrl ? 'is-empty' : ''
          }`}
        >
          {activeUrl ? (
            <img
              src={resolveAssetUrl(activeUrl)}
              alt={media.alt || label || 'Uploaded preview'}
              style={{ objectPosition: media.focalPoint || 'center center' }}
            />
          ) : (
            <span className="hp-upload-placeholder-icon" aria-hidden="true">
              {activeIsMobile ? '📱' : '🖼️'}
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
              {uploading
                ? 'Uploading...'
                : activeUrl
                  ? `Replace ${activeIsMobile ? 'Mobile' : 'Image'}`
                  : `Upload ${activeIsMobile ? 'Mobile' : 'Image'}`}
            </button>

            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={() => setLibraryOpen(true)}
              disabled={uploading}
            >
              Choose from Library
            </button>

            {activeUrl && (
              <button
                type="button"
                className="adm-btn adm-btn-ghost adm-btn-sm"
                onClick={handleClearActive}
                disabled={uploading}
              >
                {activeIsMobile ? 'Reset to Auto' : 'Remove'}
              </button>
            )}
          </div>

          {activeIsMobile && !media.mobileUrl && (
            <p className="hp-field-hint">
              Currently mirrors the Desktop image on mobile screens. Upload a portrait crop only if needed.
            </p>
          )}

          {hint && (!activeIsMobile || media.mobileUrl) && (
            <p className="hp-field-hint">{hint}</p>
          )}

          {uploadError && (
            <p className="hp-field-error" role="alert">
              {uploadError}
            </p>
          )}
        </div>
      </div>

      {showPresentationControls && (
        <div className="hp-focal-grid">
          <div className="admin-field">
            <label>Alt Description (Accessibility)</label>
            <input
              type="text"
              value={media.alt}
              onChange={(e) => commit({ alt: e.target.value })}
              placeholder="Concise description of the image"
            />
          </div>

          <div className="admin-field">
            <label>Focal Point</label>
            <select
              value={media.focalPoint}
              onChange={(e) => commit({ focalPoint: e.target.value })}
            >
              {FOCAL_POINT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label>Aspect Ratio</label>
            <select
              value={media.aspectRatio}
              onChange={(e) => commit({ aspectRatio: e.target.value })}
            >
              {ASPECT_RATIO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <MediaLibraryModal
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={handleSelectFromLibrary}
        targetLabel={
          label
            ? `${label} (${activeIsMobile ? 'Mobile Crop' : 'Desktop'})`
            : activeIsMobile
              ? 'Mobile Crop'
              : 'Desktop Image'
        }
      />
    </div>
  );
}
