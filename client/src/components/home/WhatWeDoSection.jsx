import React from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import ResponsiveMediaImage from './ResponsiveMediaImage';

export default function WhatWeDoSection({
  whatWeDo = {},
  isPreview = false,
  forceMobile = false
}) {
  const [sectionRef, isVisible] = useRevealOnScroll({ immediate: isPreview });

  if (whatWeDo.enabled === false) return null;

  const items = Array.isArray(whatWeDo.items)
    ? [...whatWeDo.items]
        .filter((item) => item && item.isActive !== false && item.title)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    : [];

  if (items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="what-we-do"
      className={`hp-section hp-section--tinted hp-wwd-section ${isVisible ? 'is-revealed' : ''}`}
      aria-labelledby="wwd-heading"
    >
      <div className="hp-container">
        <header className="hp-section-header hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
          {whatWeDo.eyebrow && <span className="hp-eyebrow">{whatWeDo.eyebrow}</span>}
          {whatWeDo.heading && (
            <h2 id="wwd-heading" className="hp-heading">
              {whatWeDo.heading}
            </h2>
          )}
          {whatWeDo.subtitle && <p className="hp-section-subtitle">{whatWeDo.subtitle}</p>}
        </header>

        <div className="hp-wwd-grid">
          {items.map((item, idx) => {
            const hasMedia = Boolean(item.image?.url || item.image?.mobileUrl);
            return (
              <article
                key={item.id || idx}
                className="hp-wwd-card hp-reveal-child"
                style={{ '--reveal-delay': `${70 + idx * 65}ms` }}
              >
                {hasMedia ? (
                  <div className="hp-wwd-media">
                    <ResponsiveMediaImage
                      media={item.image}
                      alt={item.image?.alt || item.title}
                      forceMobile={forceMobile}
                      fallback={
                        <div className="hp-wwd-icon-banner">
                          <span className="hp-wwd-icon-badge">{item.icon || '🩺'}</span>
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <div className="hp-wwd-icon-banner" aria-hidden="true">
                    <span className="hp-wwd-icon-badge">{item.icon || '🩺'}</span>
                    <span className="hp-card-index">0{idx + 1}</span>
                  </div>
                )}

                <div className="hp-wwd-body">
                  {hasMedia && <span className="hp-card-index">0{idx + 1}</span>}
                  <h3 className="hp-card-title">{item.title}</h3>
                  {item.description && <p className="hp-card-desc">{item.description}</p>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
