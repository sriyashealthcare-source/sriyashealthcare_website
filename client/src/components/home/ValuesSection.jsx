import React, { useEffect, useRef, useState } from 'react';
import ResponsiveMediaImage from './ResponsiveMediaImage';

export default function ValuesSection({
  values = {},
  animationSettings = {},
  isPreview = false,
  forceMobile = false
}) {
  const scrollRevealEnabled = animationSettings.scrollRevealEnabled !== false;
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(() => isPreview || !scrollRevealEnabled);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    // In preview or disabled animations: reveal immediately
    if (isPreview || !scrollRevealEnabled) {
      setIsVisible(true);
      return undefined;
    }

    const section = sectionRef.current;
    if (!section) return undefined;

    let observer = null;
    let fallbackScrollListener = null;

    const checkVisibility = () => {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const currentVh = window.innerHeight || 800;
      const secH = rect.height || 400;
      const enteredPx = currentVh - rect.top;

      // Trigger entrance when ~15% of section enters viewport OR section is substantially in view
      if ((enteredPx >= secH * 0.15 && rect.bottom >= 60) || (rect.top < currentVh * 0.85 && rect.bottom >= 60)) {
        setIsVisible(true);
      } else if (rect.top > currentVh * 0.95 || rect.bottom < 50) {
        // Reset when user scrolls back UP above this section OR scrolls DOWN past this section
        setIsVisible(false);
      }
    };

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            // Replay every time: trigger on enter, reset on exit
            if (entry.isIntersecting && (entry.intersectionRatio >= 0.15 || entry.boundingClientRect.top < (window.innerHeight || 800) * 0.85)) {
              setIsVisible(true);
            } else if (!entry.isIntersecting) {
              setIsVisible(false);
            }
          }
        },
        {
          threshold: [0, 0.15, 0.3],
          rootMargin: '0px 0px -2% 0px'
        }
      );
      observer.observe(section);
    }

    // Scroll listener backup to guarantee trigger and bidirectional reset across varying scroll speeds
    fallbackScrollListener = () => {
      window.requestAnimationFrame(checkVisibility);
    };
    window.addEventListener('scroll', fallbackScrollListener, { passive: true });
    window.addEventListener('resize', fallbackScrollListener, { passive: true });

    // Initial check on mount
    checkVisibility();

    return () => {
      if (observer) observer.disconnect();
      if (fallbackScrollListener) {
        window.removeEventListener('scroll', fallbackScrollListener);
        window.removeEventListener('resize', fallbackScrollListener);
      }
    };
  }, [isPreview, scrollRevealEnabled]);

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
          className={`hp-values-layout ${hasFeatureImage ? 'hp-values-layout--with-media' : ''
            }`}
        >
          {/* Values Intro & Feature Image — Signature Left Entrance */}
          <div className="hp-values-intro">
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
              <figure className="hp-values-feature-frame">
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
          <div className="hp-values-sequence">
            {items.map((item, idx) => (
              <article
                key={item.id || idx}
                className="hp-value-item"
                style={{
                  '--value-index': idx,
                  '--value-delay': `${(0.2 + idx * 0.5).toFixed(1)}s`
                }}
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
