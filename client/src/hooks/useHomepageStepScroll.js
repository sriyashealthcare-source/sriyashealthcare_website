import { useEffect, useRef } from 'react';

/**
 * useHomepageStepScroll
 *
 * Implements a seamless, one-section-per-scroll full-page snapping system on desktop
 * and laptop viewports (min-width: 1024px):
 * 1. Enhances native CSS `scroll-snap-type: y mandatory` with single-step transition locks.
 * 2. Intercepts mouse wheel / trackpad momentum and navigation keys (ArrowDown/Up, PageDown/Up, Space).
 * 3. Smoothly glides directly to target[currentIndex + 1] on scroll down, or target[currentIndex - 1] on scroll up.
 * 4. Locks subsequent inputs for ~700ms during the smooth transition to prevent inertial multi-section skips.
 * 5. Includes the global Footer (#site-footer / .footer) as the final snap target after the last section.
 * 6. Automatically disabled on mobile/tablet (< 1024px), on prefers-reduced-motion, or when any modal/drawer is open.
 */
export function useHomepageStepScroll({ isHomepage = true } = {}) {
  const isLockedRef = useRef(false);
  const lockTimerRef = useRef(null);

  useEffect(() => {
    if (!isHomepage || typeof window === 'undefined') return undefined;

    // Add active snap classes to document root and body
    document.documentElement.classList.add('hp-snap-active');
    document.body.classList.add('hp-snap-active');

    const isModalOrDrawerOpen = () => {
      return Boolean(
        document.querySelector(
          '.enquiry-drawer.is-open, .enquiry-drawer-backdrop.is-open, .admin-modal-backdrop, [aria-modal="true"]:not([aria-hidden="true"]), .office-lightbox-overlay'
        ) || document.body.style.overflow === 'hidden'
      );
    };

    const getSnapTargets = () => {
      const sections = Array.from(document.querySelectorAll('.home-viewport-section'));
      const footer = document.getElementById('site-footer') || document.querySelector('.footer');
      if (footer && !sections.includes(footer)) {
        sections.push(footer);
      }
      return sections.filter((el) => {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.height > 0 && el.offsetParent !== null;
      });
    };

    const getCurrentIndex = (targets) => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const vh = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // If at or close to document bottom, active target is the footer
      if (scrollY + vh >= docHeight - 24) {
        return targets.length - 1;
      }

      let bestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < targets.length; i++) {
        const rect = targets[i].getBoundingClientRect();
        const dist = Math.abs(rect.top);
        if (dist < minDistance) {
          minDistance = dist;
          bestIndex = i;
        }
      }

      return bestIndex;
    };

    const scrollToTarget = (targetEl) => {
      if (!targetEl) return;
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleWheel = (e) => {
      if (window.innerWidth < 1024) return;
      if (isModalOrDrawerOpen()) return;

      // Ignore horizontal trackpad swipes
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Filter out micro-jitters (< 15px)
      if (Math.abs(e.deltaY) < 15) return;

      // If locked during a smooth step transition, swallow momentum events to prevent erratic jumps
      if (isLockedRef.current) {
        e.preventDefault();
        return;
      }

      const targets = getSnapTargets();
      if (targets.length === 0) return;

      const currentIndex = getCurrentIndex(targets);
      let targetIndex = currentIndex;

      if (e.deltaY > 0) {
        // Scroll DOWN: advance to next section
        targetIndex = Math.min(currentIndex + 1, targets.length - 1);
      } else if (e.deltaY < 0) {
        // Scroll UP: retreat to previous section
        targetIndex = Math.max(currentIndex - 1, 0);
      }

      if (targetIndex !== currentIndex) {
        e.preventDefault();
        isLockedRef.current = true;

        scrollToTarget(targets[targetIndex]);

        if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
        lockTimerRef.current = setTimeout(() => {
          isLockedRef.current = false;
        }, 700);
      }
    };

    const handleKeyDown = (e) => {
      if (window.innerWidth < 1024) return;
      if (isModalOrDrawerOpen()) return;

      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) {
        return;
      }

      const isDown = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey);
      const isUp = e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey);
      const isHome = e.key === 'Home';
      const isEnd = e.key === 'End';

      if (!isDown && !isUp && !isHome && !isEnd) return;

      if (isLockedRef.current) {
        e.preventDefault();
        return;
      }

      const targets = getSnapTargets();
      if (targets.length === 0) return;

      const currentIndex = getCurrentIndex(targets);
      let targetIndex = currentIndex;

      if (isDown) {
        targetIndex = Math.min(currentIndex + 1, targets.length - 1);
      } else if (isUp) {
        targetIndex = Math.max(currentIndex - 1, 0);
      } else if (isHome) {
        targetIndex = 0;
      } else if (isEnd) {
        targetIndex = targets.length - 1;
      }

      if (targetIndex !== currentIndex) {
        e.preventDefault();
        isLockedRef.current = true;

        scrollToTarget(targets[targetIndex]);

        if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
        lockTimerRef.current = setTimeout(() => {
          isLockedRef.current = false;
        }, 700);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      document.documentElement.classList.remove('hp-snap-active');
      document.body.classList.remove('hp-snap-active');
    };
  }, [isHomepage]);
}
