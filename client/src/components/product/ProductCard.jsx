import React from 'react';
import { Link } from 'react-router-dom';
import { resolveAssetUrl } from '../../utils/session';

export default function ProductCard({ product, partnerSlug }) {
  if (!product) return null;

  const primaryImageObj =
    (product.images || []).find(img => img.isPrimary) || (product.images || [])[0];
  const imageUrl = primaryImageObj ? resolveAssetUrl(primaryImageObj.url) : '';
  const targetSlug = product.slug || product.legacyId || product._id;
  const effectiveBrandSlug =
    partnerSlug ||
    product.brand?.slug ||
    (typeof product.brand === 'string' ? product.brand : '');

  const productPath = effectiveBrandSlug
    ? `/products/${encodeURIComponent(effectiveBrandSlug)}/${encodeURIComponent(targetSlug)}`
    : `/products/${encodeURIComponent(targetSlug)}`;

  const cardCatText = product.cardCategory || product.category?.name || '';

  return (
    <Link
      to={productPath}
      state={{ fromBrand: effectiveBrandSlug }}
      className="prod-card"
      aria-label={`View clinical details for ${product.name}`}
    >
      <div
        className="prod-card-img"
        style={product.cardBg ? { background: product.cardBg } : undefined}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <span style={{ color: 'var(--text-mute)', fontSize: '0.8rem' }}>No Image</span>
        )}
      </div>
      <div className="prod-card-body">
        {cardCatText && <div className="prod-card-cat">{cardCatText}</div>}
        <div className="prod-card-name">{product.name}</div>
        {product.shortSpecification && (
          <div className="prod-card-spec">{product.shortSpecification}</div>
        )}
        <div className="prod-card-action">
          <span>View Details</span>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
