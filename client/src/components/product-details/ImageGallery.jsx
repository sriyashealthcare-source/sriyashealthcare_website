import React, { useState, useEffect } from 'react';
import { resolveAssetUrl } from '../../utils/session';

export default function ImageGallery({ images = [], productName = 'Product' }) {
  const validImages = (images || []).filter(img => img && img.url);
  const defaultIdx = Math.max(
    0,
    validImages.findIndex(img => img.isPrimary)
  );
  const [activeIndex, setActiveIndex] = useState(defaultIdx);

  useEffect(() => {
    const pIdx = validImages.findIndex(img => img.isPrimary);
    setActiveIndex(pIdx >= 0 ? pIdx : 0);
  }, [images]);

  const currentImage = validImages[activeIndex] || validImages[0];
  const currentUrl = currentImage ? resolveAssetUrl(currentImage.url) : '';

  return (
    <div>
      <div className="detail-img-box">
        {currentUrl ? (
          <img id="ud-img" src={currentUrl} alt={productName} />
        ) : (
          <span style={{ color: 'var(--text-mute)' }}>No product image available</span>
        )}
      </div>

      {validImages.length > 1 && (
        <div className="detail-img-gallery" id="ud-gallery" role="region" aria-label="Product Image Thumbnails">
          {validImages.map((img, idx) => {
            const thumbUrl = resolveAssetUrl(img.url);
            const isActive = idx === activeIndex;
            return (
              <div
                key={`${img.url}-${idx}`}
                className={`detail-thumb ${isActive ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`View image ${idx + 1} of ${validImages.length}`}
                onClick={() => setActiveIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveIndex(idx);
                  }
                }}
              >
                <img src={thumbUrl} alt={`${productName} thumbnail ${idx + 1}`} loading="lazy" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

