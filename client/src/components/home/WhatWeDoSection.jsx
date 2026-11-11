import React from 'react';
import { resolveAssetUrl } from '../../utils/session';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import SmartActionLink from './SmartActionLink';

export default function WhatWeDoSection({ whatWeDo = {}, isPreview = false }) {
  const [sectionRef, isVisible] = useRevealOnScroll({ immediate: isPreview });

  if (whatWeDo.enabled === false) return null;

  const items = Array.isArray(whatWeDo.items)
    ? whatWeDo.items.filter((item) => item && item.isActive !== false && item.title)
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
          {items.map((item, idx) => (
            <article
              key={item.id || idx}
              className="hp-wwd-card hp-reveal-child"
              style={{ '--reveal-delay': `${80 + idx * 70}ms` }}
            >
              {item.image?.url ? (
                <div className="hp-wwd-media">
                  <img
                    src={resolveAssetUrl(item.image.url)}
                    alt={item.image.alt || item.title}
                    loading="lazy"
                  />
                  {item.icon && (
                    <span className="hp-wwd-floating-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                </div>
              ) : (
                <div className="hp-wwd-icon-banner" aria-hidden="true">
                  <span className="hp-wwd-icon-badge">{item.icon || '🩺'}</span>
                </div>
              )}

              <div className="hp-wwd-body">
                <span className="hp-card-index">0{idx + 1}</span>
                <h3 className="hp-card-title">{item.title}</h3>
                {item.description && <p className="hp-card-desc">{item.description}</p>}
                {item.linkUrl && (
                  <SmartActionLink
                    to={item.linkUrl}
                    isPreview={isPreview}
                    className="hp-inline-link"
                  >
                    <span>Explore Solution</span>
                    <span aria-hidden="true">→</span>
                  </SmartActionLink>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

