import React from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';

export default function WhyChooseUsSection({ whyChooseUs = {}, isPreview = false }) {
  const [sectionRef, isVisible] = useRevealOnScroll({ immediate: isPreview });

  if (whyChooseUs.enabled === false) return null;

  const items = Array.isArray(whyChooseUs.items)
    ? whyChooseUs.items.filter((item) => item && item.isActive !== false && item.title)
    : [];

  if (items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="why-choose-sriyas"
      className={`hp-section hp-section--tinted hp-wcu-section ${isVisible ? 'is-revealed' : ''}`}
      aria-labelledby="wcu-heading"
    >
      <div className="hp-container">
        <header className="hp-section-header hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
          {whyChooseUs.eyebrow && <span className="hp-eyebrow">{whyChooseUs.eyebrow}</span>}
          {whyChooseUs.heading && (
            <h2 id="wcu-heading" className="hp-heading">
              {whyChooseUs.heading}
            </h2>
          )}
          {whyChooseUs.subtitle && <p className="hp-section-subtitle">{whyChooseUs.subtitle}</p>}
        </header>

        <div className="hp-wcu-grid">
          {items.map((item, idx) => (
            <article
              key={item.id || idx}
              className="hp-wcu-card hp-reveal-child"
              style={{ '--reveal-delay': `${80 + idx * 70}ms` }}
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
    </section>
  );
}

