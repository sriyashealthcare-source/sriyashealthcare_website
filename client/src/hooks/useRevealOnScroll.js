import { useState, useEffect, useRef } from 'react';

/**
 * Lightweight IntersectionObserver hook for scroll-triggered reveal animations.
 * Respects prefers-reduced-motion and preview mode automatically.
 */
export function useRevealOnScroll({ threshold = 0.12, rootMargin = '0px 0px -40px 0px', immediate = false } = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(() => {
    if (immediate) return true;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (immediate || isVisible) {
      setIsVisible(true);
      return undefined;
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
            break;
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate, isVisible, threshold, rootMargin]);

  return [ref, isVisible];
}

