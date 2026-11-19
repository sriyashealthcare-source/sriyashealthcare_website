import { useState, useEffect, useRef } from 'react';

/**
 * High-precision IntersectionObserver hook for scroll-triggered reveal animations.
 * Observes both the section container and individual children (.hp-reveal-child, etc.)
 * so that elements reveal progressively at the exact moment they enter the viewport.
 * Automatically disabled on prefers-reduced-motion, preview mode, or admin toggle.
 */
export function useRevealOnScroll({
  threshold = 0.12,
  rootMargin = '0px 0px -40px 0px',
  immediate = false,
  disabled = false
} = {}) {
  const sectionRef = useRef(null);
  const [isSectionVisible, setIsSectionVisible] = useState(() => immediate || disabled);

  useEffect(() => {
    if (immediate || disabled) {
      setIsSectionVisible(true);
      return undefined;
    }

    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsSectionVisible(true);
      return undefined;
    }

    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') {
      setIsSectionVisible(true);
      return undefined;
    }

    // 1. Observe the parent section
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsSectionVisible(true);
            section.classList.add('is-revealed');
            sectionObserver.unobserve(entry.target);
            break;
          }
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px 60px 0px' }
    );
    sectionObserver.observe(section);

    // 2. Observe each individual child element so cards/images further down animate
    // right in front of the visitor as they scroll down
    const childObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            childObserver.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    const children = section.querySelectorAll(
      '.hp-reveal-child, .hp-reveal-heading, .hp-reveal-text, .hp-reveal-media, .hp-converge-left, .hp-converge-right, .hp-reveal-stagger, .hp-stat-card, .hp-founder-card, .hp-wwd-card, .hp-wcu-card, .hp-workplace-card'
    );
    children.forEach((child) => childObserver.observe(child));

    return () => {
      sectionObserver.disconnect();
      childObserver.disconnect();
    };
  }, [immediate, disabled]);

  return [sectionRef, isSectionVisible];
}
