import { useEffect, useRef } from 'react';

/**
 * High-performance, GPU-accelerated vertical parallax for gallery images.
 * Restrained movement (max ±14px), scales image slightly (1.05) to prevent gaps.
 * Uses IntersectionObserver to attach scroll listeners ONLY when gallery is visible.
 * Automatically disabled on mobile (<768px), preview mode, reduced-motion, or admin toggle.
 */
export function useGalleryParallax({
  enabled = true,
  isPreview = false,
  forceMobile = false
} = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!enabled || isPreview || forceMobile) return undefined;
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return undefined;

    const isMobile = window.innerWidth <= 768;
    if (isMobile) return undefined;

    const container = containerRef.current;
    if (!container) return undefined;

    let rafId = null;
    let isIntersecting = false;

    // Enhanced speeds for alternating cards to create distinct, luxurious depth
    const speeds = [-0.07, 0.08, -0.06, 0.075, -0.065, 0.08];

    const updateParallax = () => {
      if (!isIntersecting || !container) return;
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight || 800;
      // Center of section relative to center of viewport
      const centerDelta = rect.top + rect.height / 2 - windowHeight / 2;

      const items = container.querySelectorAll('.hp-workplace-media img');
      items.forEach((img, idx) => {
        const speed = speeds[idx % speeds.length];
        const rawOffset = centerDelta * speed;
        // Bounded strictly between -28px and +28px for clearly noticeable multi-plane depth
        const clampedOffset = Math.max(-28, Math.min(28, Math.round(rawOffset * 10) / 10));
        img.style.setProperty('--parallax-y', `${clampedOffset}px`);
      });
      rafId = null;
    };

    const onScroll = () => {
      if (!rafId && isIntersecting) {
        rafId = window.requestAnimationFrame(updateParallax);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting) {
            updateParallax();
            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onScroll, { passive: true });
          } else {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (rafId) {
              window.cancelAnimationFrame(rafId);
              rafId = null;
            }
          }
        }
      },
      { threshold: 0, rootMargin: '100px 0px 100px 0px' }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [enabled, isPreview, forceMobile]);

  return containerRef;
}

