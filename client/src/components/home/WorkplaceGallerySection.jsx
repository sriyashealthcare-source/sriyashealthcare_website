import React from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import ResponsiveMediaImage from './ResponsiveMediaImage';

export default function WorkplaceGallerySection({
  workplace = {},
  isPreview = false,
  forceMobile = false
}) {
  const [sectionRef, isVisible] = useRevealOnScroll({ immediate: isPreview });

  if (workplace.enabled === false) return null;

  const images = Array.isArray(workplace.images)
    ? [...workplace.images]
        .filter((img) => img && img.isActive !== false && (img.url || img.mobileUrl))
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    : [];

  if (images.length === 0) return null;

  const layoutStyle = workplace.layoutStyle || 'editorial-collage';

  return (
    <section
      ref={sectionRef}
      id="our-workplace"
      className={`hp-section hp-section--tinted hp-workplace-section ${isVisible ? 'is-revealed' : ''}`}
      aria-labelledby="workplace-heading"
    >
      <div className="hp-container">
        <header className="hp-section-header hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
          {workplace.eyebrow && <span className="hp-eyebrow">{workplace.eyebrow}</span>}
          {workplace.heading && (
            <h2 id="workplace-heading" className="hp-heading">
              {workplace.heading}
            </h2>
          )}
          {workplace.subtitle && <p className="hp-section-subtitle">{workplace.subtitle}</p>}
        </header>

        <div className={`hp-workplace-grid hp-workplace-grid--${layoutStyle}`}>
          {images.map((item, idx) => (
            <figure
              key={item.id || idx}
              className={`hp-workplace-card hp-reveal-child ${
                layoutStyle === 'editorial-collage' && idx === 0 && images.length >= 3
                  ? 'hp-workplace-card--featured'
                  : ''
              }`}
              style={{
                '--reveal-delay': `${80 + idx * 80}ms`,
                '--float-delay': `${idx * 0.6}s`
              }}
            >
              <div className="hp-workplace-media">
                <ResponsiveMediaImage
                  media={item}
                  alt={item.alt || item.title || item.caption || 'Sriyas Healthcare workplace'}
                  forceMobile={forceMobile}
                  fallback={
                    <div className="hp-media-fallback">
                      <span>Office &amp; Workplace Visual</span>
                    </div>
                  }
                />
                {item.category && (
                  <span className="hp-workplace-tag">{item.category}</span>
                )}
              </div>

              {(item.title || item.caption) && (
                <figcaption className="hp-workplace-caption-box">
                  {item.title && <h3>{item.title}</h3>}
                  {item.caption && <p>{item.caption}</p>}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

