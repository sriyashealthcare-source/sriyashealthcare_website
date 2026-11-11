import React from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import ResponsiveMediaImage from './ResponsiveMediaImage';

export default function AboutSection({
  about = {},
  isPreview = false,
  forceMobile = false
}) {
  const [sectionRef, isVisible] = useRevealOnScroll({ immediate: isPreview });

  if (about.enabled === false) return null;

  const images = Array.isArray(about.images)
    ? [...about.images]
        .filter((img) => Boolean(img?.url || img?.mobileUrl))
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    : [];

  const preset = about.layoutPreset || 'split-collage';
  const primaryImg = images[0] || null;
  const secondaryImg = images[1] || null;
  const accentImgs = images.slice(2);

  return (
    <section
      ref={sectionRef}
      id="about-sriyas"
      className={`hp-section hp-about-section hp-about--${preset} ${isVisible ? 'is-revealed' : ''}`}
      aria-labelledby="about-heading"
    >
      <div className="hp-container">
        <div className={`hp-about-grid ${images.length === 0 ? 'hp-about-grid--no-media' : ''}`}>
          {/* Company Narrative Column */}
          <div className="hp-about-content hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
            {about.eyebrow && <span className="hp-eyebrow">{about.eyebrow}</span>}
            {about.heading && (
              <h2 id="about-heading" className="hp-heading">
                {about.heading}
              </h2>
            )}
            <div className="hp-gold-rule" aria-hidden="true" />

            {about.introduction && (
              <p className="hp-lead-paragraph">{about.introduction}</p>
            )}
            {about.supportingText && (
              <p className="hp-body-paragraph">{about.supportingText}</p>
            )}
            {about.hospitalCommitment && (
              <p className="hp-body-paragraph">{about.hospitalCommitment}</p>
            )}

            {(about.vision || about.mission) && (
              <div className="hp-purpose-cards">
                {about.vision && (
                  <article className="hp-purpose-card">
                    <span className="hp-purpose-label">Our Vision</span>
                    <p>{about.vision}</p>
                  </article>
                )}
                {about.mission && (
                  <article className="hp-purpose-card">
                    <span className="hp-purpose-label">Our Mission</span>
                    <p>{about.mission}</p>
                  </article>
                )}
              </div>
            )}
          </div>

          {/* Editorial Media Composition */}
          {images.length > 0 && (
            <div
              className={`hp-about-visuals hp-reveal-child ${
                images.length === 1 ? 'hp-about-visuals--single' : ''
              }`}
              style={{ '--reveal-delay': '120ms' }}
            >
              {primaryImg && (
                <figure className="hp-collage-frame hp-collage-frame--primary">
                  <div className="hp-collage-media">
                    <ResponsiveMediaImage
                      media={primaryImg}
                      alt={primaryImg.caption || 'Sriyas Healthcare corporate facility'}
                      forceMobile={forceMobile}
                    />
                  </div>
                  {primaryImg.caption && (
                    <figcaption className="hp-collage-caption">{primaryImg.caption}</figcaption>
                  )}
                </figure>
              )}

              {secondaryImg && (
                <figure className="hp-collage-frame hp-collage-frame--secondary">
                  <div className="hp-collage-media">
                    <ResponsiveMediaImage
                      media={secondaryImg}
                      alt={secondaryImg.caption || 'Sriyas Healthcare operations'}
                      forceMobile={forceMobile}
                    />
                  </div>
                  {secondaryImg.caption && (
                    <figcaption className="hp-collage-caption">{secondaryImg.caption}</figcaption>
                  )}
                </figure>
              )}

              {accentImgs.length > 0 && (
                <div className="hp-collage-accents">
                  {accentImgs.map((img) => (
                    <figure key={img.id} className="hp-collage-frame hp-collage-frame--accent">
                      <div className="hp-collage-media">
                        <ResponsiveMediaImage
                          media={img}
                          alt={img.caption || 'Sriyas Healthcare'}
                          forceMobile={forceMobile}
                        />
                      </div>
                      {img.caption && (
                        <figcaption className="hp-collage-caption">{img.caption}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}

              <div className="hp-collage-ornament" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
