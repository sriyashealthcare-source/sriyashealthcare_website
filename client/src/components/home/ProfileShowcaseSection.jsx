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
  scrollRevealEnabled,
  isPreview,
  forceMobile
}) {
  const rowRef = useRef(null);
  const textColRef = useRef(null);
  const photoColRef = useRef(null);

  // Even index = Row 1 (Text on LEFT, Photo on RIGHT)
  // Odd index = Row 2 (Photo on LEFT, Text on RIGHT)
  const isEven = index % 2 === 0;
  const textIsLeft = isEven;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    // In preview or disabled animations: display in fully settled state immediately
    if (isPreview || scrollRevealEnabled === false) {
      if (textColRef.current) {
        textColRef.current.style.transform = 'translate3d(0, 0, 0) scale(1)';
        textColRef.current.style.opacity = '1';
      }
      if (photoColRef.current) {
        photoColRef.current.style.transform = 'translate3d(0, 0, 0) scale(1)';
        photoColRef.current.style.opacity = '1';
      }
      if (rowRef.current) {
        rowRef.current.classList.add('is-revealed', 'is-settled');
      }
      return undefined;
    }

    let rafId = null;

    const updateConvergence = () => {
      rafId = null;
      const row = rowRef.current;
      const textEl = textColRef.current;
      const photoEl = photoColRef.current;
      if (!row || !textEl || !photoEl) return;

      const rect = row.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const isMobile = window.innerWidth <= 768;

      // Start convergence when approximately 15-20% of the profile enters the viewport
      const rowHeight = rect.height || 420;
      const startThreshold = vh - Math.min(110, Math.round(rowHeight * 0.18));

      // Complete when profile reaches its natural reading position (~36-40% from top of viewport)
      const endThreshold = Math.round(vh * 0.38);

      let rawProgress = (startThreshold - rect.top) / (startThreshold - endThreshold);
      let progress = Math.min(1, Math.max(0, rawProgress));

      // Smooth cubic easing for natural motion and gentle spring-like settling
      const eased = 1 - Math.pow(1 - progress, 3);

      // Snap to exact settled dock once within 4% of completion or at/above natural reading position
      const isSettled = progress >= 0.96 || rect.top <= endThreshold;

      const maxDisp = isMobile ? 42 : 115;
      const currentDisp = isSettled ? 0 : maxDisp * (1 - eased);
      const scale = isSettled ? 1 : 0.96 + 0.04 * eased;
      const opacity = isSettled ? 1 : Math.min(1, progress * 1.35);

      // Symmetrical convergence:
      // Left element travels from -currentDisp to 0 (LEFT to RIGHT towards center)
      // Right element travels from +currentDisp to 0 (RIGHT to LEFT towards center)
      const leftX = -currentDisp;
      const rightX = currentDisp;

      const textX = textIsLeft ? leftX : rightX;
      const photoX = textIsLeft ? rightX : leftX;

      textEl.style.transform = `translate3d(${textX.toFixed(2)}px, 0, 0) scale(${scale.toFixed(4)})`;
      textEl.style.opacity = opacity.toFixed(3);

      photoEl.style.transform = `translate3d(${photoX.toFixed(2)}px, 0, 0) scale(${scale.toFixed(4)})`;
      photoEl.style.opacity = opacity.toFixed(3);

      // Trigger coordinated group stagger on child text elements (name -> role -> rule -> bio -> email)
      if (progress > 0.04) {
        if (!row.classList.contains('is-revealed')) {
          row.classList.add('is-revealed');
        }
      } else if (progress <= 0 && rect.top > vh) {
        // If user scrolled completely back up above the section
        if (row.classList.contains('is-revealed')) {
          row.classList.remove('is-revealed');
        }
      }

      if (isSettled) {
        row.classList.add('is-settled');
      } else {
        row.classList.remove('is-settled');
      }
    };

    const onScroll = () => {
      if (rafId == null) {
        rafId = window.requestAnimationFrame(updateConvergence);
      }
    };

    // Initial measurement
    updateConvergence();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Failsafe guarantee: ensure content never remains permanently invisible if user already scrolled past
    const safetyTimeout = setTimeout(() => {
      if (rowRef.current) {
        updateConvergence();
      }
    }, 1000);

    const absoluteTimeout = setTimeout(() => {
      if (rowRef.current && !rowRef.current.classList.contains('is-settled')) {
        const rect = rowRef.current.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        const endThreshold = Math.round(vh * 0.38);
        if (rect.top <= endThreshold) {
          if (textColRef.current) {
            textColRef.current.style.transform = 'translate3d(0, 0, 0) scale(1)';
            textColRef.current.style.opacity = '1';
          }
          if (photoColRef.current) {
            photoColRef.current.style.transform = 'translate3d(0, 0, 0) scale(1)';
            photoColRef.current.style.opacity = '1';
          }
          rowRef.current.classList.add('is-revealed', 'is-settled');
        }
      }
    }, 2000);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      clearTimeout(safetyTimeout);
      clearTimeout(absoluteTimeout);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isEven, textIsLeft, isPreview, scrollRevealEnabled]);

  const textContent = (
    <div
      ref={textColRef}
      className={`hp-leadership-content ${textIsLeft ? 'hp-leadership-content--left' : 'hp-leadership-content--right'}`}
    >
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
    <div
      ref={photoColRef}
      className={`hp-leadership-photo-wrap ${textIsLeft ? 'hp-leadership-photo--right' : 'hp-leadership-photo--left'}`}
    >
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
      className={`hp-leadership-row ${!isEven ? 'hp-leadership-row--reversed hp-leadership-row--odd' : 'hp-leadership-row--even'}`}
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
