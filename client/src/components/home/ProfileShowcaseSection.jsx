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

    let observer = null;
    let fallbackScrollListener = null;

    const checkVisibility = () => {
      if (!row) return;
      const rect = row.getBoundingClientRect();
      const currentVh = window.innerHeight || 800;
      const h = rect.height || 400;
      const enteredPx = currentVh - rect.top;

      // Trigger when ~18-22% of profile enters viewport
      if (enteredPx >= h * 0.18 && rect.bottom >= 60) {
        setIsRevealed(true);
      } else if (rect.top > currentVh * 0.94 || rect.bottom < 50) {
        // Reset when user scrolls back up above this profile OR scrolls down past it
        setIsRevealed(false);
      }
    };

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const rect = entry.boundingClientRect;
            const currentVh = window.innerHeight || 800;
            const h = rect.height || 400;
            const enteredPx = currentVh - rect.top;

            if (entry.isIntersecting && enteredPx >= h * 0.18 && rect.bottom >= 60) {
              setIsRevealed(true);
            } else if (rect.top > currentVh * 0.94 || rect.bottom < 50) {
              setIsRevealed(false);
            }
          }
        },
        {
          threshold: [0, 0.1, 0.18, 0.25, 0.4],
          rootMargin: '0px 0px -4% 0px'
        }
      );
      observer.observe(row);
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

function SpecialistTeamGrid({
  items,
  scrollRevealEnabled = true,
  isPreview = false,
  forceMobile = false
}) {
  const gridRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(() => isPreview || !scrollRevealEnabled);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    // Preview mode or disabled animations: reveal immediately
    if (isPreview || !scrollRevealEnabled) {
      setIsRevealed(true);
      return undefined;
    }

    // Direct anchor landing (#our-team)
    if (window.location.hash === '#our-team') {
      setIsRevealed(true);
    }

    const grid = gridRef.current;
    if (!grid) return undefined;
    const targetSection = grid.closest('section') || grid;

    let observer = null;
    let fallbackScrollListener = null;

    const checkVisibility = () => {
      if (!grid) return;
      const secRect = targetSection ? targetSection.getBoundingClientRect() : grid.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      const currentVh = window.innerHeight || 800;
      const secH = secRect.height || 400;
      const enteredPx = currentVh - secRect.top;

      // Trigger entrance when ~18% of section enters viewport OR grid top is comfortably visible
      if ((enteredPx >= secH * 0.18 && secRect.bottom >= 60) || (gridRect.top < currentVh * 0.88 && gridRect.bottom >= 60)) {
        setIsRevealed(true);
      } else if (secRect.top > currentVh * 0.94 || secRect.bottom < 50) {
        // Reset when user scrolls back UP above this section (secRect.top > 0.94*vh)
        // OR when user scrolls DOWN past this section (secRect.bottom < 50)
        setIsRevealed(false);
      }
    };

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        () => {
          checkVisibility();
        },
        {
          threshold: [0, 0.05, 0.1, 0.18, 0.25, 0.4],
          rootMargin: '0px 0px -4% 0px'
        }
      );
      observer.observe(targetSection);
    }

    // Scroll listener backup to guarantee trigger and bidirectional reset across varying scroll speeds
    fallbackScrollListener = () => {
      window.requestAnimationFrame(checkVisibility);
    };
    window.addEventListener('scroll', fallbackScrollListener, { passive: true });
    window.addEventListener('resize', fallbackScrollListener, { passive: true });

    // Initial check on mount
    checkVisibility();

    // Listen to hash change if navigated directly
    const handleHash = () => {
      if (window.location.hash === '#our-team') {
        setIsRevealed(true);
      }
    };
    window.addEventListener('hashchange', handleHash);

    return () => {
      if (observer) observer.disconnect();
      if (fallbackScrollListener) {
        window.removeEventListener('scroll', fallbackScrollListener);
        window.removeEventListener('resize', fallbackScrollListener);
      }
      window.removeEventListener('hashchange', handleHash);
    };
  }, [isPreview, scrollRevealEnabled]);

  const getDirectionClass = (idx) => {
    // Card 1 (idx 0 – ANUSREE R): From LEFT to RIGHT (translateX(-60px) -> 0)
    // Card 2 (idx 1 – SWETHA G): From BOTTOM to TOP (translateY(60px) -> 0)
    // Card 3 (idx 2 – RAHUL S): From RIGHT to LEFT (translateX(60px) -> 0)
    const mod = idx % 3;
    if (mod === 0) return 'hp-team-card--from-left';
    if (mod === 1) return 'hp-team-card--from-bottom';
    return 'hp-team-card--from-right';
  };

  const getStaggerDelay = (idx) => {
    // Refined subtle stagger: 0ms, 100ms, 150ms
    const delays = ['0ms', '100ms', '150ms'];
    return delays[idx % 3] || '0ms';
  };

  return (
    <div
      ref={gridRef}
      className={`hp-team-grid ${isRevealed ? 'is-revealed' : ''}`}
    >
      {items.map((person, idx) => (
        <article
          key={person.id || idx}
          className={`hp-team-card ${getDirectionClass(idx)} ${isRevealed ? 'is-revealed' : ''}`}
          style={{ '--team-delay': getStaggerDelay(idx) }}
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
      className={`hp-section ${tinted ? 'hp-section--tinted' : ''} hp-people-section hp-people--${variant} home-viewport-section ${isVisible ? 'is-revealed' : ''
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
          <SpecialistTeamGrid
            items={items}
            scrollRevealEnabled={scrollRevealEnabled}
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        )}
      </div>
    </section>
  );
}
