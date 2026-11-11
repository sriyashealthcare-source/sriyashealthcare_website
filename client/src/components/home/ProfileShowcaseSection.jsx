import React from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import ResponsiveMediaImage from './ResponsiveMediaImage';

function getInitials(name = '') {
  const parts = String(name)
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'SH';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfileShowcaseSection({
  id = 'leadership',
  section = {},
  variant = 'leadership',
  tinted = false,
  isPreview = false,
  forceMobile = false
}) {
  const [sectionRef, isVisible] = useRevealOnScroll({ immediate: isPreview });

  if (section.enabled === false) return null;

  const items = Array.isArray(section.items)
    ? [...section.items]
        .filter((item) => item && item.isActive !== false && item.name)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    : [];

  if (items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`hp-section ${tinted ? 'hp-section--tinted' : ''} hp-people-section hp-people--${variant} ${
        isVisible ? 'is-revealed' : ''
      }`}
      aria-labelledby={`${id}-heading`}
    >
      <div className="hp-container">
        <header className="hp-section-header hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
          {section.eyebrow && <span className="hp-eyebrow">{section.eyebrow}</span>}
          {section.heading && (
            <h2 id={`${id}-heading`} className="hp-heading">
              {section.heading}
            </h2>
          )}
          {section.subtitle && <p className="hp-section-subtitle">{section.subtitle}</p>}
        </header>

        <div
          className={`hp-founders-grid ${
            items.length === 1
              ? 'hp-founders-grid--single'
              : items.length === 2
                ? 'hp-founders-grid--two'
                : ''
          }`}
        >
          {items.map((person, idx) => (
            <article
              key={person.id || idx}
              className="hp-founder-card hp-reveal-child"
              style={{ '--reveal-delay': `${80 + idx * 70}ms` }}
            >
              <div className="hp-founder-portrait-wrap">
                <ResponsiveMediaImage
                  media={person.photo}
                  alt={person.photo?.alt || person.name}
                  className="hp-founder-portrait"
                  forceMobile={forceMobile}
                  fallback={
                    <div className="hp-founder-monogram" aria-hidden="true">
                      <span>{getInitials(person.name)}</span>
                    </div>
                  }
                />
              </div>

              <div className="hp-founder-details">
                <h3 className="hp-founder-name">{person.name}</h3>
                {person.designation && (
                  <p className="hp-founder-role">{person.designation}</p>
                )}
                {person.bio && <p className="hp-founder-bio">{person.bio}</p>}

                {(person.linkedinUrl || person.email) && (
                  <div className="hp-founder-links">
                    {person.linkedinUrl && (
                      <a
                        href={person.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hp-founder-link"
                        onClick={isPreview ? (e) => e.preventDefault() : undefined}
                      >
                        LinkedIn ↗
                      </a>
                    )}
                    {person.email && (
                      <a
                        href={`mailto:${person.email}`}
                        className="hp-founder-link"
                        onClick={isPreview ? (e) => e.preventDefault() : undefined}
                      >
                        Email
                      </a>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

