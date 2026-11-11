import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import SmartActionLink from './SmartActionLink';

/**
 * Monitors genuine arrival at the bottom of the homepage and deliberate continued
 * downward scrolling to transition naturally into /products without timer redirects,
 * upward scroll misfires, or browser-Back traps.
 */
export default function ContinueToProductsTrigger({ isPreview = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  const sentinelRef = useRef(null);
  const reachedBottomAtRef = useRef(0);
  const isAtSentinelRef = useRef(false);
  const gestureScoreRef = useRef(0);
  const touchStartYRef = useRef(null);
  const triggeredRef = useRef(false);
  const backPopLockRef = useRef(false);
  const navTimerRef = useRef(null);

  const [sentinelVisible, setSentinelVisible] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [progressRatio, setProgressRatio] = useState(0);

  const isActiveRoute = !isPreview && location.pathname === '/';

  // Guard against instant bounce if user hit Browser Back from /products
  useEffect(() => {
    if (!isActiveRoute) return undefined;
    triggeredRef.current = false;
    gestureScoreRef.current = 0;
    setTransitioning(false);
    setProgressRatio(0);

    if (navigationType === 'POP') {
      backPopLockRef.current = true;
    } else {
      backPopLockRef.current = false;
    }

    return () => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
      }
    };
  }, [isActiveRoute, navigationType]);

  const triggerProductsTransition = useCallback(() => {
    if (!isActiveRoute || triggeredRef.current) return;
    triggeredRef.current = true;
    setProgressRatio(1);
    setTransitioning(true);

    navTimerRef.current = setTimeout(() => {
      navigate('/products');
    }, 380);
  }, [isActiveRoute, navigate]);

  const isNearPageBottom = useCallback(() => {
    const scrollBottom = window.innerHeight + window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    return scrollBottom >= docHeight - 80;
  }, []);

  // Track sentinel visibility via IntersectionObserver
  useEffect(() => {
    if (!isActiveRoute || !sentinelRef.current || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const visible = entry.isIntersecting;
          isAtSentinelRef.current = visible;
          setSentinelVisible(visible);

          if (visible) {
            if (!reachedBottomAtRef.current) {
              reachedBottomAtRef.current = Date.now();
            }
          } else {
            reachedBottomAtRef.current = 0;
            gestureScoreRef.current = 0;
            setProgressRatio(0);
            // User scrolled upward off sentinel -> unlock POP guard cleanly
            backPopLockRef.current = false;
          }
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isActiveRoute]);

  // Listen for deliberate downward continuation once visitor is resting at the genuine bottom
  useEffect(() => {
    if (!isActiveRoute) return undefined;

    let decayTimer = null;
    const WHEEL_THRESHOLD = 160;

    const resetProgressSoon = () => {
      if (decayTimer) clearTimeout(decayTimer);
      decayTimer = setTimeout(() => {
        if (!triggeredRef.current) {
          gestureScoreRef.current = 0;
          setProgressRatio(0);
        }
      }, 900);
    };

    const canAdvanceNow = () => {
      if (triggeredRef.current) return false;
      if (!isAtSentinelRef.current || !isNearPageBottom()) return false;
      // Require short viewing pause (550ms) so fast scrolling stops to show the CTA
      if (Date.now() - reachedBottomAtRef.current < 550) return false;
      if (backPopLockRef.current) return false;
      return true;
    };

    const handleWheel = (e) => {
      // Scrolling upwards resets intent and unlocks POP navigation lock
      if (e.deltaY < -4) {
        gestureScoreRef.current = 0;
        backPopLockRef.current = false;
        setProgressRatio(0);
        return;
      }

      if (e.deltaY <= 0 || !canAdvanceNow()) return;

      gestureScoreRef.current += Math.min(80, e.deltaY);
      setProgressRatio(Math.min(1, gestureScoreRef.current / WHEEL_THRESHOLD));

      if (gestureScoreRef.current >= WHEEL_THRESHOLD) {
        triggerProductsTransition();
      } else {
        resetProgressSoon();
      }
    };

    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (touchStartYRef.current === null || !e.touches || e.touches.length !== 1) return;
      const currentY = e.touches[0].clientY;
      const pullUpDelta = touchStartYRef.current - currentY; // > 0 means user drags up to scroll down

      if (pullUpDelta < -12) {
        gestureScoreRef.current = 0;
        backPopLockRef.current = false;
        setProgressRatio(0);
        return;
      }

      if (pullUpDelta > 16 && canAdvanceNow()) {
        const ratio = Math.min(1, pullUpDelta / 72);
        setProgressRatio(ratio);
        if (pullUpDelta >= 72) {
          touchStartYRef.current = null;
          triggerProductsTransition();
        } else {
          resetProgressSoon();
        }
      }
    };

    const handleTouchEnd = () => {
      touchStartYRef.current = null;
      if (!triggeredRef.current) {
        resetProgressSoon();
      }
    };

    const handleKeyDown = (e) => {
      if (!canAdvanceNow()) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        gestureScoreRef.current += 90;
        setProgressRatio(Math.min(1, gestureScoreRef.current / WHEEL_THRESHOLD));
        if (gestureScoreRef.current >= WHEEL_THRESHOLD) {
          triggerProductsTransition();
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        gestureScoreRef.current = 0;
        backPopLockRef.current = false;
        setProgressRatio(0);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (decayTimer) clearTimeout(decayTimer);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActiveRoute, isNearPageBottom, triggerProductsTransition]);

  return (
    <>
      <div
        ref={sentinelRef}
        id="hp-bottom-sentinel"
        className={`hp-continue-sentinel ${sentinelVisible ? 'is-active' : ''}`}
      >
        <div className="hp-container hp-continue-inner">
          <div className="hp-continue-copy">
            <span className="hp-eyebrow hp-eyebrow--light">Continue Exploring</span>
            <p>
              Keep scrolling down to explore our Global Partners &amp; Product Catalogue, or tap below anytime.
            </p>
            <div className="hp-continue-bar-track" aria-hidden="true">
              <div
                className="hp-continue-bar-fill"
                style={{ transform: `scaleX(${Math.max(0.06, progressRatio)})` }}
              />
            </div>
          </div>

          <SmartActionLink
            to="/products"
            isPreview={isPreview}
            className="hp-btn-gold hp-continue-btn"
          >
            <span>Explore Products</span>
            <span aria-hidden="true">→</span>
          </SmartActionLink>
        </div>
      </div>

      {!isPreview && transitioning && (
        <div className="hp-route-curtain" role="status" aria-live="polite">
          <div className="hp-route-curtain-card">
            <img src="/assets/logos/sriyas-emblem.png" alt="Sriyas Healthcare" />
            <span>Opening Our Partners &amp; Product Catalogue...</span>
          </div>
        </div>
      )}
    </>
  );
}

