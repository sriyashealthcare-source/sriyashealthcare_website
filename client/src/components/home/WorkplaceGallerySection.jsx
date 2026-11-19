import React from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import { useGalleryParallax } from '../../hooks/useGalleryParallax';
import ResponsiveMediaImage from './ResponsiveMediaImage';

export default function WorkplaceGallerySection({
  workplace = {},
  animationSettings = {},
  isPreview = false,
  forceMobile = false
}) {
  const scrollRevealEnabled = animationSettings.scrollRevealEnabled !== false;
  const galleryParallaxEnabled = animationSettings.galleryParallaxEnabled !== false;

  const [sectionRef, isVisible] = useRevealOnScroll({
    immediate: isPreview || !scrollRevealEnabled,
    disabled: !scrollRevealEnabled
  });

  const parallaxGridRef = useGalleryParallax({
    enabled: galleryParallaxEnabled,
    isPreview,
    forceMobile
  });

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
      className={`hp-section hp-section--tinted hp-workplace-section ${
        isVisible ? 'is-revealed' : ''
      }`}
      aria-labelledby="workplace-heading"
    >
      <div className="hp-container">
        <header className="hp-section-header hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
          {workplace.eyebrow && <span className="hp-eyebrow">{workplace.eyebrow}</span>}
          {workplace.heading && (
            <h2 id="workplace-heading" className="hp-heading hp-reveal-heading">
              {workplace.heading}
            </h2>
          )}
          {workplace.subtitle && (
            <p className="hp-section-subtitle hp-reveal-text">{workplace.subtitle}</p>
          )}
        </header>

        <div
          ref={parallaxGridRef}
          className={`hp-workplace-grid hp-workplace-grid--${layoutStyle}`}
        >
          {images.map((item, idx) => {
            const isFeatured = layoutStyle === 'editorial-collage' && idx === 0 && images.length >= 3;
            const motionClass = isFeatured
              ? 'hp-workplace-card--featured hp-reveal-scale'
              : idx % 2 === 1
                ? 'hp-converge-right'
                : 'hp-converge-left';

            return (
              <figure
                key={item.id || idx}
                className={`hp-workplace-card ${motionClass}`}
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
                  className="hp-parallax-img"
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
