import React from 'react';
import { resolveAssetUrl } from '../../utils/session';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import SmartActionLink from './SmartActionLink';

export default function PartnersSection({
  partners = {},
  resolvedPartners = [],
  isPreview = false
}) {
  const [sectionRef, isVisible] = useRevealOnScroll({ immediate: isPreview });

  if (partners.enabled === false) return null;

  const brands = Array.isArray(resolvedPartners) ? resolvedPartners : [];
  if (brands.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="our-partners"
      className={`hp-section hp-partners-section ${isVisible ? 'is-revealed' : ''}`}
      aria-labelledby="partners-heading"
    >
      <div className="hp-container">
        <header className="hp-section-header hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
          {partners.eyebrow && <span className="hp-eyebrow">{partners.eyebrow}</span>}
          {partners.heading && (
            <h2 id="partners-heading" className="hp-heading">
              {partners.heading}
            </h2>
          )}
          {partners.subtitle && <p className="hp-section-subtitle">{partners.subtitle}</p>}
        </header>

        <div className="hp-partners-grid">
          {brands.map((brand, idx) => (
            <SmartActionLink
              key={brand._id || brand.slug || idx}
              to={`/products/${encodeURIComponent(brand.slug)}`}
              isPreview={isPreview}
              className="hp-partner-card hp-reveal-child"
              ariaLabel={`Explore ${brand.name} products`}
            >
              <div
                className="hp-partner-float-inner"
                style={{ '--float-delay': `${idx * 0.45}s`, '--reveal-delay': `${70 + idx * 65}ms` }}
              >
                <div className="hp-partner-logo-stage">
                  {brand.logoUrl ? (
                    <img
                      src={resolveAssetUrl(brand.logoUrl)}
                      alt={`${brand.name} logo`}
                      loading="lazy"
                    />
                  ) : (
                    <span className="hp-partner-fallback-icon" aria-hidden="true">
                      {brand.icon || '🔬'}
                    </span>
                  )}
                </div>

                <div className="hp-partner-info">
                  <h3 className="hp-partner-name">{brand.name}</h3>
                  {brand.description && (
                    <p className="hp-partner-desc">{brand.description}</p>
                  )}
                </div>

                <div className="hp-partner-footer">
                  {Number(brand.productCount) > 0 ? (
                    <span className="hp-partner-count">
                      {brand.productCount} {brand.productCount === 1 ? 'Product' : 'Products'}
                    </span>
                  ) : (
                    <span className="hp-partner-count">Authorized Partner</span>
                  )}
                  <span className="hp-partner-arrow" aria-hidden="true">→</span>
                </div>
              </div>
            </SmartActionLink>
          ))}
        </div>

        {partners.ctaText && (
          <div className="hp-section-cta-center hp-reveal-child" style={{ '--reveal-delay': '200ms' }}>
            <SmartActionLink
              to={partners.ctaLink || '/products'}
              isPreview={isPreview}
              className="hp-btn-gold"
            >
              <span>{partners.ctaText}</span>
              <span aria-hidden="true">→</span>
            </SmartActionLink>
          </div>
        )}
      </div>
    </section>
  );
}

