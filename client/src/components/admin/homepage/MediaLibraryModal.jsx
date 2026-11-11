import React, { useEffect, useMemo, useRef, useState } from 'react';
import { homepageService } from '../../../services/homepageService';
import { resolveAssetUrl } from '../../../utils/session';

const SOURCE_LABELS = {
  cloudinary: 'Cloudinary',
  'local-upload': 'Local Upload',
  placeholder: 'Placeholder',
  'site-asset': 'Site Asset'
};

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  targetLabel = 'Desktop Image'
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const fetchLibrary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await homepageService.getMediaLibrary();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load media library. Check your backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    fetchLibrary();
    const handleKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
      if (!q) return true;
      const hay = `${item.label || ''} ${item.publicId || ''} ${item.url || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, sourceFilter]);

  if (!isOpen) return null;

  return (
    <div
      className="hp-media-lib-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Choose Image from Media Library"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="hp-media-lib-modal">
        <header className="hp-media-lib-header">
          <div>
            <h3>Media Library Picker</h3>
            <p>
              Select an existing Cloudinary upload or website asset for{' '}
              <strong>{targetLabel}</strong>.
            </p>
          </div>
          <div className="hp-media-lib-header-actions">
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={fetchLibrary}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              type="button"
              className="adm-btn adm-btn-ghost adm-btn-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </header>

        <div className="hp-media-lib-filters">
          <input
            type="search"
            className="hp-media-lib-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filename or asset ID..."
            aria-label="Search media library"
          />

          <div className="hp-media-lib-chips" role="group" aria-label="Filter by source">
            {[
              { id: 'all', label: 'All Assets' },
              { id: 'cloudinary', label: 'Cloudinary' },
              { id: 'placeholder', label: 'Placeholders' },
              { id: 'site-asset', label: 'Site Assets' }
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={`hp-lib-chip ${sourceFilter === chip.id ? 'is-active' : ''}`}
                onClick={() => setSourceFilter(chip.id)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hp-media-lib-body">
          {loading ? (
            <div className="hp-media-lib-state">
              <div className="spinner" />
              <p>Loading uploaded &amp; library assets...</p>
            </div>
          ) : error ? (
            <div className="hp-media-lib-state">
              <p className="hp-field-error">{error}</p>
              <button
                type="button"
                className="adm-btn adm-btn-secondary adm-btn-sm"
                onClick={fetchLibrary}
              >
                Retry
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="hp-media-lib-state">
              <p>No matching assets found. Upload a new image or clear your filter.</p>
            </div>
          ) : (
            <div className="hp-media-lib-grid">
              {filteredItems.map((asset) => {
                const name =
                  asset.label ||
                  (asset.publicId ? asset.publicId.split('/').pop() : '') ||
                  (asset.url ? asset.url.split('/').pop() : 'Asset');
                return (
                  <button
                    key={`${asset.publicId || asset.url}`}
                    type="button"
                    className="hp-media-lib-card"
                    onClick={() => {
                      onSelect({
                        url: asset.url,
                        publicId: asset.publicId || '',
                        suggestedAlt: name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
                      });
                      onClose();
                    }}
                  >
                    <div className="hp-media-lib-thumb">
                      <img src={resolveAssetUrl(asset.url)} alt={name} loading="lazy" />
                      <span className="hp-media-source-tag">
                        {SOURCE_LABELS[asset.source] || 'Asset'}
                      </span>
                    </div>
                    <div className="hp-media-lib-meta">
                      <span className="hp-media-lib-name" title={name}>
                        {name}
                      </span>
                      {asset.width > 0 && asset.height > 0 && (
                        <small>
                          {asset.width} × {asset.height}
                        </small>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

