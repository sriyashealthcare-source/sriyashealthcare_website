import React, { useEffect, useRef, useState, useCallback } from 'react';
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

function LeadershipEditorialRow({
  person,
  index,
  scrollRevealEnabled = true,
  isPreview = false,
  forceMobile = false
}) {
  const rowRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(() => isPreview || !scrollRevealEnabled);

  // Even index = Row 1 (Text on LEFT, Photo on RIGHT)
  // Odd index = Row 2 (Photo on LEFT, Text on RIGHT)
  const isEven = index % 2 === 0;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    // In preview or disabled animations: reveal immediately
    if (isPreview || !scrollRevealEnabled) {
      setIsRevealed(true);
      return undefined;
    }

    const row = rowRef.current;
    if (!row) return undefined;

    // If user loaded or refreshed page already scrolled down to this section, reveal immediately
    const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    if (currentScrollY > 150) {
      const vh = window.innerHeight || 800;
      const initialRect = row.getBoundingClientRect();
      const initialHeight = initialRect.height || 400;
      if (initialRect.top <= vh - initialHeight * 0.20 && initialRect.bottom >= 0) {
        setIsRevealed(true);
        return undefined;
      }
    }

    let observer = null;
    let fallbackScrollListener = null;

    const triggerReveal = () => {
      setIsRevealed(true);
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (fallbackScrollListener) {
        window.removeEventListener('scroll', fallbackScrollListener);
        fallbackScrollListener = null;
      }
    };

    // Independent IntersectionObserver for each leadership row:
    // Triggers when approximately 20-25% of the profile enters the viewport
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const rect = entry.boundingClientRect;
            const currentVh = window.innerHeight || 800;
            const enteredPx = currentVh - rect.top;
            const h = rect.height || 400;
            if (entry.isIntersecting && (entry.intersectionRatio >= 0.20 || enteredPx >= h * 0.20)) {
              triggerReveal();
              break;
            }
          }
        },
        {
          threshold: [0.1, 0.15, 0.2, 0.25],
          rootMargin: '0px 0px -4% 0px'
        }
      );
      observer.observe(row);
    }

    // Scroll listener backup to guarantee trigger across varying scroll speeds
    fallbackScrollListener = () => {
      if (!row) return;
      const rect = row.getBoundingClientRect();
      const currentVh = window.innerHeight || 800;
      const h = rect.height || 400;
      if (rect.top <= currentVh - h * 0.20 && rect.bottom >= 0) {
        triggerReveal();
      }
    };
    window.addEventListener('scroll', fallbackScrollListener, { passive: true });

    return () => {
      if (observer) observer.disconnect();
      if (fallbackScrollListener) window.removeEventListener('scroll', fallbackScrollListener);
    };
  }, [isPreview, scrollRevealEnabled]);

  const textContent = (
    <div className="hp-leadership-content">
      <h3 className="hp-leadership-name">{person.name}</h3>
      {person.designation && (
        <p className="hp-leadership-role">{person.designation}</p>
      )}
      <div className="hp-leadership-rule" aria-hidden="true" />
      {person.bio && <p className="hp-leadership-bio">{person.bio}</p>}

      {person.email && (
        <a
          href={`mailto:${person.email}`}
          className="hp-leadership-email-btn"
          onClick={isPreview ? (e) => e.preventDefault() : undefined}
          aria-label={`Email ${person.name} at ${person.email}`}
        >
          <span className="hp-leadership-email-icon" aria-hidden="true">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </span>
          <span>Contact via Email</span>
        </a>
      )}
    </div>
  );

  const photoContent = (
    <div className="hp-leadership-photo-wrap">
      <div className="hp-leadership-photo-inner">
        <ResponsiveMediaImage
          media={person.photo}
          alt={person.photo?.alt || person.name}
          className="hp-leadership-portrait"
          forceMobile={forceMobile}
          fallback={
            <div className="hp-leadership-monogram" aria-hidden="true">
              <span>{getInitials(person.name)}</span>
            </div>
          }
        />
      </div>
    </div>
  );

  return (
    <article
      ref={rowRef}
      className={`hp-leadership-row ${isEven ? 'hp-leadership-row--even' : 'hp-leadership-row--odd hp-leadership-row--reversed'} ${isRevealed ? 'is-revealed' : ''}`}
    >
      {isEven ? (
        <>
          {textContent}
          {photoContent}
        </>
      ) : (
        <>
          {photoContent}
          {textContent}
        </>
      )}
    </article>
  );
}

export default function ProfileShowcaseSection({
  id = 'leadership',
  section = {},
  variant = 'leadership',
  tinted = false,
  animationSettings = {},
  isPreview = false,
  forceMobile = false
}) {
  const scrollRevealEnabled = animationSettings.scrollRevealEnabled !== false;
  const [sectionRef, isVisible] = useRevealOnScroll({
    immediate: isPreview || !scrollRevealEnabled,
    disabled: !scrollRevealEnabled
  });

  if (section.enabled === false) return null;

  const rawItems = Array.isArray(section.items) ? section.items : [];
  const items = rawItems
    .filter((item) => item && item.isActive !== false && item.name)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  if (items.length === 0) return null;

  const isLeadership = variant === 'leadership';

  const defaultEyebrow = isLeadership
    ? 'LEADERSHIP & GOVERNANCE'
    : 'OUR PEOPLE & CLINICAL SUPPORT';
  const defaultHeading = isLeadership
    ? 'Principled Leadership Committed to Healthcare Integrity'
    : 'Multidisciplinary Clinical & Institutional Support';
  const defaultSubtitle = isLeadership
    ? 'Our leadership brings together experience and commitment to building trusted relationships across the healthcare community.'
    : 'Meet the dedicated specialists providing on-ground operating room coordination and hospital inventory logistics.';

  const eyebrowText = section.eyebrow || defaultEyebrow;
  const headingText = section.heading || defaultHeading;
  const subtitleText = section.subtitle || defaultSubtitle;

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`hp-section ${tinted ? 'hp-section--tinted' : ''} hp-people-section hp-people--${variant} ${isVisible ? 'is-revealed' : ''
        }`}
      aria-labelledby={`${id}-heading`}
    >
      <div className="hp-container">
        <header className="hp-section-header hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
          {eyebrowText && <span className="hp-eyebrow">{eyebrowText}</span>}
          {headingText && (
            <h2 id={`${id}-heading`} className="hp-heading hp-reveal-heading">
              {headingText}
            </h2>
          )}
          {subtitleText && (
            <p className="hp-section-subtitle hp-reveal-text">{subtitleText}</p>
          )}
        </header>

        {isLeadership ? (
          <div className="hp-leadership-container">
            {items.map((person, idx) => (
              <LeadershipEditorialRow
                key={person.id || idx}
                person={person}
                index={idx}
                scrollRevealEnabled={scrollRevealEnabled}
                isPreview={isPreview}
                forceMobile={forceMobile}
              />
            ))}
          </div>
        ) : (
          <div className="hp-team-grid">
            {items.map((person, idx) => (
              <article
                key={person.id || idx}
                className="hp-team-card hp-reveal-child"
                style={{ '--reveal-delay': `${80 + idx * 80}ms` }}
              >
                <div className="hp-team-portrait-wrap">
                  <ResponsiveMediaImage
                    media={person.photo}
                    alt={person.photo?.alt || person.name}
                    className="hp-team-portrait"
                    forceMobile={forceMobile}
                    fallback={
                      <div className="hp-leadership-monogram" aria-hidden="true">
                        <span>{getInitials(person.name)}</span>
                      </div>
                    }
                  />
                </div>

                <h3 className="hp-team-name">{person.name}</h3>
                {person.designation && (
                  <p className="hp-team-role">{person.designation}</p>
                )}
                {person.bio && <p className="hp-team-bio">{person.bio}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
