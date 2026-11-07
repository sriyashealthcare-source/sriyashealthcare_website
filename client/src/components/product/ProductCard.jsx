import React from 'react';
import { Link } from 'react-router-dom';
import { resolveAssetUrl } from '../../utils/session';

export default function ProductCard({ product }) {
  if (!product) return null;

  const primaryImageObj =
    (product.images || []).find(img => img.isPrimary) || (product.images || [])[0];
  const imageUrl = primaryImageObj ? resolveAssetUrl(primaryImageObj.url) : '';
  const targetSlug = product.slug || product.legacyId || product._id;
  const brandSlug = product.brand?.slug || '';
  const cardCatText = product.cardCategory || product.category?.name || '';

  return (
    <Link
      to={`/products/${encodeURIComponent(targetSlug)}`}
      state={{ fromBrand: brandSlug }}
      className="prod-card"
      aria-label={`View details for ${product.name}`}
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
        <div className="prod-card-cat">{cardCatText}</div>
        <div className="prod-card-name">{product.name}</div>
        {product.shortSpecification && (
          <div className="prod-card-spec">{product.shortSpecification}</div>
        )}
      </div>
    </Link>
  );
}

