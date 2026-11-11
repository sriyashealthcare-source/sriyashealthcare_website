import React from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import ResponsiveMediaImage from './ResponsiveMediaImage';

export default function ValuesSection({
  values = {},
  isPreview = false,
  forceMobile = false
}) {
  const [sectionRef, isVisible] = useRevealOnScroll({ immediate: isPreview });

  if (values.enabled === false) return null;

  const items = Array.isArray(values.items)
    ? [...values.items]
        .filter((item) => item && item.isActive !== false && item.title)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    : [];

  if (items.length === 0) return null;

  const hasFeatureImage = Boolean(values.featureImage?.url || values.featureImage?.mobileUrl);

  return (
    <section
      ref={sectionRef}
      id="why-choose-sriyas"
      className={`hp-section hp-values-section ${isVisible ? 'is-revealed' : ''}`}
      aria-labelledby="values-heading"
    >
      <div className="hp-container">
        <div
          className={`hp-values-layout ${
            hasFeatureImage ? 'hp-values-layout--with-media' : ''
          }`}
        >
          <div className="hp-values-intro hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
            {values.eyebrow && <span className="hp-eyebrow">{values.eyebrow}</span>}
            {values.heading && (
              <h2 id="values-heading" className="hp-heading">
                {values.heading}
              </h2>
            )}
            <div className="hp-gold-rule" aria-hidden="true" />
            {values.subtitle && (
              <p className="hp-section-subtitle hp-section-subtitle--left">
                {values.subtitle}
              </p>
            )}

            {hasFeatureImage && (
              <div className="hp-values-feature-frame">
                <ResponsiveMediaImage
                  media={values.featureImage}
                  alt={values.featureImage?.alt || 'Sriyas Healthcare values and operations'}
                  forceMobile={forceMobile}
                />
              </div>
            )}
          </div>

          <div className="hp-wcu-grid">
            {items.map((item, idx) => (
              <article
                key={item.id || idx}
                className="hp-wcu-card hp-reveal-child"
                style={{ '--reveal-delay': `${70 + idx * 60}ms` }}
              >
                <div className="hp-wcu-top">
                  <span className="hp-wcu-numeral">0{idx + 1}</span>
                  <span className="hp-wcu-icon" aria-hidden="true">
                    {item.icon || '✦'}
                  </span>
                </div>
                <h3 className="hp-wcu-title">{item.title}</h3>
                {item.description && <p className="hp-wcu-desc">{item.description}</p>}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

