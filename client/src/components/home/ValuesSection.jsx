import React from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import ResponsiveMediaImage from './ResponsiveMediaImage';

export default function ValuesSection({
  values = {},
  animationSettings = {},
  isPreview = false,
  forceMobile = false
}) {
  const scrollRevealEnabled = animationSettings.scrollRevealEnabled !== false;
  const [sectionRef, isVisible] = useRevealOnScroll({
    immediate: isPreview || !scrollRevealEnabled,
    disabled: !scrollRevealEnabled
  });

  if (values.enabled === false) return null;

  const items = Array.isArray(values.items)
    ? [...values.items]
        .filter((item) => item && item.isActive !== false && item.title)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    : [];

  if (items.length === 0) return null;

  const hasFeatureImage = Boolean(values.featureImage?.url || values.featureImage?.mobileUrl);

  const eyebrowText = values.eyebrow || 'OUR VALUES & COMMITMENT';
  const headingText = values.heading || 'Why Healthcare Institutions Choose Sriyas';
  const subtitleText =
    values.subtitle ||
    'Every institutional interaction is rooted in our founding pillars of Care, Trust, and Innovation, supported by disciplined healthcare logistics.';

  return (
    <section
      ref={sectionRef}
      id="why-choose-sriyas"
      className={`hp-section hp-values-section home-viewport-section ${isVisible ? 'is-revealed' : ''}`}
      aria-labelledby="values-heading"
    >
      <div className="hp-container">
        <div
          className={`hp-values-layout ${
            hasFeatureImage ? 'hp-values-layout--with-media' : ''
          }`}
        >
          {/* Values Intro & Feature Image — Signature Left Entrance */}
          <div className="hp-values-intro hp-converge-left" style={{ '--reveal-delay': '0ms' }}>
            {eyebrowText && <span className="hp-eyebrow">{eyebrowText}</span>}
            {headingText && (
              <h2 id="values-heading" className="hp-heading hp-reveal-heading">
                {headingText}
              </h2>
            )}
            <div className="hp-gold-rule" aria-hidden="true" />
            {subtitleText && (
              <p className="hp-section-subtitle hp-section-subtitle--left hp-reveal-text">
                {subtitleText}
              </p>
            )}

            {hasFeatureImage && (
              <figure className="hp-values-feature-frame hp-reveal-media">
                <ResponsiveMediaImage
                  media={values.featureImage}
                  alt={values.featureImage?.alt || 'Sriyas Healthcare clinical education and values in practice'}
                  forceMobile={forceMobile}
                  className="hp-values-feature-img"
                />
                <figcaption className="hp-values-feature-caption">
                  Clinical Training & Professional Practice
                </figcaption>
              </figure>
            )}
          </div>

          {/* Values Interactive Editorial Sequence — Signature Right Entrance */}
          <div className="hp-values-sequence hp-converge-right" style={{ '--reveal-delay': '80ms' }}>
            {items.map((item, idx) => (
              <article
                key={item.id || idx}
                className="hp-value-item hp-reveal-child"
                style={{ '--reveal-delay': `${80 + idx * 70}ms` }}
              >
                <div className="hp-value-numeral-col">
                  <span className="hp-value-numeral">0{idx + 1}</span>
                  <div className="hp-value-line" aria-hidden="true" />
                </div>
                <div className="hp-value-content-col">
                  <div className="hp-value-header">
                    <h3 className="hp-value-title">{item.title}</h3>
                    <span className="hp-value-icon" aria-hidden="true">
                      {item.icon || '✦'}
                    </span>
                  </div>
                  {item.description && (
                    <p className="hp-value-description">{item.description}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
