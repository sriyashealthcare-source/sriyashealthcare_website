import { useState, useEffect, useRef } from 'react';

/**
 * Universal, high-reliability IntersectionObserver hook for scroll-triggered reveals.
 * Engineered for cross-device consistency across:
 * - High-DPI scaling (125%, 150%, 175%) and compact laptop displays (768p / 550px viewport).
 * - Variable refresh rates (60Hz, 120Hz, ProMotion) and trackpad vs wheel scroll events.
 * - Dynamic asynchronous API data mounting (React DOM hydration & API response updates).
 * - System accessibility settings (prefers-reduced-motion) and battery-saver throttling.
 * - Failsafe guarantee: elements NEVER remain permanently invisible (opacity: 0).
 */
export function useRevealOnScroll({
  threshold = 0.02,
  rootMargin = '0px 0px 60px 0px',
  immediate = false,
  disabled = false
} = {}) {
  const sectionRef = useRef(null);
  const [isSectionVisible, setIsSectionVisible] = useState(() => immediate || disabled);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const revealAllChildren = (container) => {
      if (!container) return;
      const revealTargets = container.querySelectorAll(
        '.hp-reveal-child, .hp-reveal-heading, .hp-reveal-text, .hp-reveal-media, ' +
        '.hp-reveal-scale, .hp-carousel, .hp-wwd-showcase, .hp-converge-left, ' +
        '.hp-converge-right, .hp-reveal-stagger, .hp-stat-card, .hp-founder-card, ' +
        '.hp-wwd-card, .hp-wcu-card, .hp-workplace-card, .hp-value-item, .hp-purpose-card'
      );
      revealTargets.forEach((el) => {
        el.classList.add('is-revealed');
      });
    };

    // Case 1: Immediate, disabled, or server-side rendering
    if (immediate || disabled || typeof window === 'undefined') {
      setIsSectionVisible(true);
      section.classList.add('is-revealed');
      revealAllChildren(section);
      return undefined;
    }

    // Case 2: Accessibility / Battery Saver (prefers-reduced-motion)
    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mediaQuery && mediaQuery.matches) {
      setIsSectionVisible(true);
      section.classList.add('is-revealed');
      revealAllChildren(section);
      return undefined;
    }

    // Case 3: No IntersectionObserver support in older browser
    if (typeof IntersectionObserver === 'undefined') {
      setIsSectionVisible(true);
      section.classList.add('is-revealed');
      revealAllChildren(section);
      return undefined;
    }

    // Check if section is already in or near viewport at mount time
    const initialRect = section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 800;
    if (initialRect.top < vh + 100 && initialRect.bottom > -100) {
      setIsSectionVisible(true);
      section.classList.add('is-revealed');
    }

    let isSectionRevealed = false;
    let fallbackTimer = null;

    // 1. Observe parent section container with relaxed thresholds
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.top < vh + 80) {
            isSectionRevealed = true;
            setIsSectionVisible(true);
            section.classList.add('is-revealed');
            sectionObserver.unobserve(entry.target);

            // Failsafe cascade: once section is in view, ensure all children reveal
            // within 450ms even if child-level observer didn't fire due to rapid scroll
            if (fallbackTimer) clearTimeout(fallbackTimer);
            fallbackTimer = setTimeout(() => {
              revealAllChildren(section);
            }, 450);
            break;
          }
        }
      },
      { threshold: 0.01, rootMargin: '0px 0px 80px 0px' }
    );
    sectionObserver.observe(section);

    // 2. Child-level observer for progressive micro-stagger
    const observedChildren = new WeakSet();
    const childObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.top < vh + 40) {
            entry.target.classList.add('is-revealed');
            childObserver.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.01, rootMargin: '0px 0px 40px 0px' }
    );

    const observeNewChildren = () => {
      if (!section) return;
      const childTargets = section.querySelectorAll(
        '.hp-reveal-child, .hp-reveal-heading, .hp-reveal-text, .hp-reveal-media, ' +
        '.hp-reveal-scale, .hp-carousel, .hp-wwd-showcase, .hp-converge-left, ' +
        '.hp-converge-right, .hp-reveal-stagger, .hp-stat-card, .hp-founder-card, ' +
        '.hp-wwd-card, .hp-wcu-card, .hp-workplace-card, .hp-value-item, .hp-purpose-card'
      );
      childTargets.forEach((child) => {
        if (!observedChildren.has(child)) {
          observedChildren.add(child);
          if (isSectionRevealed) {
            // If parent section is already revealed, reveal child directly
            child.classList.add('is-revealed');
          } else {
            childObserver.observe(child);
          }
        }
      });
    };

    observeNewChildren();

    // 3. MutationObserver to catch asynchronous DOM updates (e.g. after API data resolves)
    let mutationObserver = null;
    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(() => {
        observeNewChildren();
      });
      mutationObserver.observe(section, { childList: true, subtree: true });
    }

    // 4. Absolute Failsafe Guarantee Timer:
    // If for any reason (browser tab throttled in background, scaling glitch, scroll restoration),
    // after 1200ms ensure content is never stuck at opacity: 0
    const absoluteSafetyTimeout = setTimeout(() => {
      const rect = section.getBoundingClientRect();
      if (rect.top < vh * 1.5) {
        setIsSectionVisible(true);
        section.classList.add('is-revealed');
        revealAllChildren(section);
      }
    }, 1200);

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      clearTimeout(absoluteSafetyTimeout);
      sectionObserver.disconnect();
      childObserver.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
    };
  }, [immediate, disabled]);

  return [sectionRef, isSectionVisible];
}
