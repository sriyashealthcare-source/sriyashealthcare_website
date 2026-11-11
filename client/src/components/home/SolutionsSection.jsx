import React from 'react';
import { resolveAssetUrl } from '../../utils/session';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import SmartActionLink from './SmartActionLink';

export default function SolutionsSection({
  productCategories = {},
  resolvedCategories = [],
  isPreview = false
}) {
  const [sectionRef, isVisible] = useRevealOnScroll({ immediate: isPreview });

  if (productCategories.enabled === false) return null;

  const categories = Array.isArray(resolvedCategories) ? resolvedCategories : [];
  if (categories.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="healthcare-solutions"
      className={`hp-section hp-section--tinted hp-solutions-section ${isVisible ? 'is-revealed' : ''}`}
      aria-labelledby="solutions-heading"
    >
      <div className="hp-container">
        <div className="hp-section-split-header hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
          <div>
            {productCategories.eyebrow && (
              <span className="hp-eyebrow">{productCategories.eyebrow}</span>
            )}
            {productCategories.heading && (
              <h2 id="solutions-heading" className="hp-heading">
                {productCategories.heading}
              </h2>
            )}
            {productCategories.subtitle && (
              <p className="hp-section-subtitle hp-section-subtitle--left">
                {productCategories.subtitle}
              </p>
            )}
          </div>

          {productCategories.ctaText && (
            <SmartActionLink
              to={productCategories.ctaLink || '/products'}
              isPreview={isPreview}
              className="hp-btn-outline"
            >
              <span>{productCategories.ctaText}</span>
              <span aria-hidden="true">→</span>
            </SmartActionLink>
          )}
        </div>

        <div className="hp-solutions-grid">
          {categories.map((cat, idx) => {
            const brandSlug = cat.brand?.slug;
            const targetUrl = brandSlug
              ? `/products/${encodeURIComponent(brandSlug)}?category=${encodeURIComponent(cat.slug || cat._id)}`
              : '/products';

            return (
              <SmartActionLink
                key={cat._id || cat.slug || idx}
                to={targetUrl}
                isPreview={isPreview}
                className="hp-solution-card hp-reveal-child"
                ariaLabel={`Explore ${cat.name}`}
              >
                <div
                  className="hp-solution-visual"
                  style={{
                    background: cat.heroGradient || 'linear-gradient(135deg, #1b2a38, #2d4c63)',
                    '--reveal-delay': `${60 + idx * 55}ms`
                  }}
                >
                  {cat.heroImage?.url && (
                    <img
                      src={resolveAssetUrl(cat.heroImage.url)}
                      alt={cat.name}
                      loading="lazy"
                    />
                  )}
                  <div className="hp-solution-scrim" aria-hidden="true" />
                  {cat.brand?.name && (
                    <span className="hp-solution-brand-pill">{cat.brand.name}</span>
                  )}
                </div>

                <div className="hp-solution-body">
                  <h3 className="hp-solution-title">{cat.name}</h3>
                  {cat.description && (
                    <p className="hp-solution-desc">{cat.description}</p>
                  )}
                  <div className="hp-solution-meta">
                    <span className="hp-solution-action">
                      View Category <span aria-hidden="true">→</span>
                    </span>
                    {Number(cat.productCount) > 0 && (
                      <span className="hp-solution-count">
                        {cat.productCount} {cat.productCount === 1 ? 'Product' : 'Products'}
                      </span>
                    )}
                  </div>
                </div>
              </SmartActionLink>
            );
          })}
        </div>
      </div>
    </section>
  );
}

