import React from 'react';
import { resolveAssetUrl } from '../../utils/session';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SH';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function FoundersSection({ founders = {}, isPreview = false }) {
  const [sectionRef, isVisible] = useRevealOnScroll({ immediate: isPreview });

  if (founders.enabled === false) return null;

  const items = Array.isArray(founders.items)
    ? founders.items.filter((item) => item && item.isActive !== false && item.name)
    : [];

  // Never display empty/fabricated leadership placeholders on public website
  if (items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="founders"
      className={`hp-section hp-founders-section ${isVisible ? 'is-revealed' : ''}`}
      aria-labelledby="founders-heading"
    >
      <div className="hp-container">
        <header className="hp-section-header hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
          {founders.eyebrow && <span className="hp-eyebrow">{founders.eyebrow}</span>}
          {founders.heading && (
            <h2 id="founders-heading" className="hp-heading">
              {founders.heading}
            </h2>
          )}
          {founders.subtitle && <p className="hp-section-subtitle">{founders.subtitle}</p>}
        </header>

        <div
          className={`hp-founders-grid ${
            items.length === 1 ? 'hp-founders-grid--single' : items.length === 2 ? 'hp-founders-grid--two' : ''
          }`}
        >
          {items.map((person, idx) => (
            <article
              key={person.id || idx}
              className="hp-founder-card hp-reveal-child"
              style={{ '--reveal-delay': `${90 + idx * 80}ms` }}
            >
              <div className="hp-founder-portrait-wrap">
                {person.photo?.url ? (
                  <img
                    src={resolveAssetUrl(person.photo.url)}
                    alt={person.photo.alt || person.name}
                    className="hp-founder-portrait"
                    loading="lazy"
                  />
                ) : (
                  <div className="hp-founder-monogram" aria-hidden="true">
                    <span>{getInitials(person.name)}</span>
                  </div>
                )}
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

