import React, { useLayoutEffect, useEffect, useRef, useState, useCallback } from 'react';
import { resolveAssetUrl } from '../../utils/session';
import { SRIYAS_EMBLEM_URL } from '../../utils/cloudinaryAssets';
import { useHomepageScroll } from '../../context/HomepageScrollContext';
import SmartActionLink from './SmartActionLink';
import ResponsiveMediaImage from './ResponsiveMediaImage';

function easeOutQuad(t) {
  return t * (2 - t);
}

function getMorphDistance() {
  if (typeof window === 'undefined') return 300;
  const vh = window.innerHeight || 800;
  return Math.min(420, Math.max(220, Math.round(vh * 0.38)));
}

export default function HeroMorphSection({
  hero = {},
  isPreview = false,
  forceMobile = false
}) {
  const {
    isMorphEnabled,
    scrollProgress,
    setScrollProgress,
    navTargetRects,
    measureNavTargets,
    setBrandMedia
  } = useHomepageScroll();

  const emblemPlaceholderRef = useRef(null);
  const [startRects, setStartRects] = useState(null);

  const companyName = hero.companyName || 'SRIYAS HEALTHCARE';
  const companySubtitle = hero.companySubtitle || 'PVT LTD';
  const tagline = hero.tagline || 'Empowering Healthcare with Care and Innovation.';
  const supportingIntro =
    hero.supportingIntro ||
    'An authorized healthcare distributor headquartered in Chennai, supporting hospitals, surgeons, and clinical teams with trusted surgical and medical technologies.';
  const valuesText = hero.valuesText || 'CARE · TRUST · INNOVATION';
  const ctaText = hero.ctaText || 'Explore Sriyas';
  const ctaLink = hero.ctaLink || '#about-sriyas';
  const secondaryCtaText = hero.secondaryCtaText || 'View Products';
  const secondaryCtaLink = hero.secondaryCtaLink || '/products';

  const logoUrl = resolveAssetUrl(hero.logo?.url || SRIYAS_EMBLEM_URL);
  const logoAlt = hero.logo?.alt || 'Sriyas Healthcare Pvt Ltd Emblem';

  const useFixedMorph = !isPreview && isMorphEnabled;

  // Keep docked Navbar brand synchronized seamlessly with Hero configuration
  useEffect(() => {
    if (hero.enabled === false) {
      setScrollProgress(1);
      return;
    }
    if (!isPreview) {
      setBrandMedia({
        url: logoUrl,
        alt: logoAlt,
        companyName,
        companySubtitle
      });
    }
  }, [isPreview, hero.enabled, logoUrl, logoAlt, companyName, companySubtitle, setBrandMedia, setScrollProgress]);

  if (hero.enabled === false) return null;

  const measureStartAnchors = useCallback(() => {
    if (!emblemPlaceholderRef.current) return null;
    const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const currentScrollX = window.scrollX || document.documentElement.scrollLeft || 0;
    const eRect = emblemPlaceholderRef.current.getBoundingClientRect();
    if (!eRect.width || !eRect.height) return null;

    const pageTop = eRect.top + currentScrollY;
    const pageLeft = eRect.left + currentScrollX;

    const next = {
      emblem: {
        pageTop,
        pageLeft,
        width: eRect.width,
        height: eRect.height
      }
    };

    setStartRects((prev) => {
      if (
        prev &&
        Math.abs(prev.emblem.pageTop - next.emblem.pageTop) < 0.5 &&
        Math.abs(prev.emblem.pageLeft - next.emblem.pageLeft) < 0.5 &&
        Math.abs(prev.emblem.width - next.emblem.width) < 0.5 &&
        Math.abs(prev.emblem.height - next.emblem.height) < 0.5
      ) {
        return prev;
      }
      return next;
    });

    return next;
  }, []);

  useLayoutEffect(() => {
    if (!useFixedMorph) {
      setStartRects(null);
      return undefined;
    }

    const syncAll = () => {
      measureNavTargets();
      measureStartAnchors();
    };

    syncAll();

    let cancelled = false;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) syncAll();
      });
    }

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (!cancelled) syncAll();
      });
      if (emblemPlaceholderRef.current) ro.observe(emblemPlaceholderRef.current);
    }

    window.addEventListener('resize', syncAll, { passive: true });
    return () => {
      cancelled = true;
      if (ro) ro.disconnect();
      window.removeEventListener('resize', syncAll);
    };
  }, [useFixedMorph, measureNavTargets, measureStartAnchors]);

  // Continuous rAF scroll listener consistent across desktop, laptop, tablet, and mobile
  useEffect(() => {
    if (!useFixedMorph) return undefined;

    let rafId = null;

    const updateProgress = () => {
      rafId = null;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const morphDist = getMorphDistance();
      const next = Math.min(1, Math.max(0, y / morphDist));
      setScrollProgress((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
    };

    const onScroll = () => {
      if (rafId == null) {
        rafId = window.requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [useFixedMorph, setScrollProgress]);

  const rawProgress = useFixedMorph ? scrollProgress : 0;
  const eased = easeOutQuad(rawProgress);

  // Natural gentle fadeout as hero section scrolls past
  const currentScrollY = typeof window !== 'undefined' ? (window.scrollY || document.documentElement.scrollTop || 0) : 0;
  const currentScrollX = typeof window !== 'undefined' ? (window.scrollX || document.documentElement.scrollLeft || 0) : 0;
  const morphDist = getMorphDistance();
  const copyFadeProgress = Math.min(1, Math.max(0, (currentScrollY - 40) / (morphDist * 1.15)));
  const copyOpacity = useFixedMorph ? Math.max(0, 1 - copyFadeProgress) : 1;
  const copyTranslateY = useFixedMorph ? copyFadeProgress * -14 : 0;
  const auraOpacity = useFixedMorph ? Math.max(0, 1 - rawProgress * 1.2) : 1;

  const canAnimateMorph = Boolean(
    useFixedMorph &&
    startRects?.emblem &&
    navTargetRects?.img &&
    navTargetRects.img.width > 0 &&
    startRects.emblem.width > 0
  );

  const isEmblemDocked = useFixedMorph && rawProgress >= 0.985;

  let emblemStyle = {};

  if (canAnimateMorph) {
    const sEmblem = startRects.emblem;
    const tEmblem = navTargetRects.img;

    const startLeft = sEmblem.pageLeft;
    const startTop = sEmblem.pageTop;
    const startWidth = sEmblem.width;
    const startHeight = sEmblem.height;

    const sCenterX = startLeft + startWidth / 2;
    const sCenterY = startTop + startHeight / 2;

    const tCenterX = tEmblem.left + tEmblem.width / 2;
    const tCenterY = tEmblem.top + tEmblem.height / 2;

    const currentCenterX = sCenterX + (tCenterX - sCenterX) * eased;
    const currentCenterY = sCenterY + (tCenterY - sCenterY) * eased;

    const scaleTarget = tEmblem.width / startWidth;
    const currentScale = 1 + (scaleTarget - 1) * eased;

    const tx = currentCenterX - startWidth / 2;
    const ty = currentCenterY - startHeight / 2;

    const isSuppressedByMobileNav =
      typeof document !== 'undefined' &&
      document.body &&
      document.body.classList.contains('mobile-nav-open');

    emblemStyle = {
      position: 'fixed',
      left: 0,
      top: 0,
      width: `${startWidth}px`,
      height: `${startHeight}px`,
      transformOrigin: 'center center',
      transform: `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${currentScale.toFixed(4)})`,
      opacity: isEmblemDocked || isSuppressedByMobileNav ? 0 : 1,
      visibility: isSuppressedByMobileNav ? 'hidden' : 'visible',
      pointerEvents: 'none',
      zIndex: 1005,
      willChange: 'transform, opacity'
    };
  }

  return (
    <section
      className={`hp-hero-section ${isPreview ? 'hp-hero-section--preview' : ''}`}
      id="hero"
      aria-label="Sriyas Healthcare Introduction"
    >
      {/* Customizable Background Photography / Architectural Accent */}
      {hero.backgroundImage?.url && (
        <div
          className="hp-hero-custom-bg"
          aria-hidden="true"
          style={{ opacity: Math.min(0.28, auraOpacity * 0.28) }}
        >
          <ResponsiveMediaImage
            media={hero.backgroundImage}
            forceMobile={forceMobile}
            loading="eager"
          />
        </div>
      )}

      {/* Subtle Silk Ivory & Gold Atmosphere */}
      <div className="hp-hero-backdrop" aria-hidden="true" style={{ opacity: auraOpacity }}>
        <div className="hp-hero-halo" />
        <div className="hp-hero-orbit hp-hero-orbit--outer" />
        <div className="hp-hero-orbit hp-hero-orbit--inner" />
        <div className="hp-hero-grid-texture" />
      </div>

      <div className="hp-hero-inner">
        {/* Centered Resting Anchor Slot */}
        <div className="hp-hero-lockup-flow">
          <div
            ref={emblemPlaceholderRef}
            className="hp-hero-emblem-slot"
          >
            <img
              src={logoUrl}
              alt={logoAlt}
              className="hp-hero-emblem-img"
              style={{ opacity: canAnimateMorph ? 0 : 1 }}
              onLoad={measureStartAnchors}
              fetchPriority="high"
            />
          </div>

          <div className="hp-hero-title-slot">
            <div className="hp-hero-title-stack">
              <h1 className="hp-hero-brand-name">{companyName}</h1>
              {companySubtitle && <p className="hp-hero-brand-sub">{companySubtitle}</p>}
            </div>
          </div>
        </div>

        {/* Tagline, Supporting Company Introduction & Action Buttons */}
        <div
          className="hp-hero-copy"
          style={{
            opacity: copyOpacity,
            transform: `translate3d(0, ${copyTranslateY.toFixed(1)}px, 0)`,
            pointerEvents: copyOpacity < 0.12 ? 'none' : 'auto'
          }}
        >
          {hero.showTagline !== false && tagline && (
            <p className="hp-hero-tagline">{tagline}</p>
          )}

          {supportingIntro && (
            <p className="hp-hero-intro">{supportingIntro}</p>
          )}

          {hero.showValues !== false && valuesText && (
            <p className="hp-hero-values">
              <span className="hp-hero-values-rule" aria-hidden="true" />
              <span>{valuesText}</span>
              <span className="hp-hero-values-rule" aria-hidden="true" />
            </p>
          )}

          <div className="hp-hero-actions">
            <SmartActionLink
              to={ctaLink}
              isPreview={isPreview}
              className="hp-btn-gold"
              id="hero-primary-cta"
            >
              <span>{ctaText}</span>
              <span className="hp-btn-arrow" aria-hidden="true">↓</span>
            </SmartActionLink>

            {hero.showSecondaryCta !== false && secondaryCtaText && (
              <SmartActionLink
                to={secondaryCtaLink}
                isPreview={isPreview}
                className="hp-btn-outline"
                id="hero-secondary-cta"
              >
                <span>{secondaryCtaText}</span>
                <span className="hp-btn-arrow" aria-hidden="true">→</span>
              </SmartActionLink>
            )}
          </div>
        </div>
      </div>

      {/* Continuous Fixed GPU-Composited Travelling Emblem */}
      {canAnimateMorph && (
        <div
          className="hp-hero-morph-traveler"
          style={emblemStyle}
          aria-hidden={isEmblemDocked ? 'true' : undefined}
        >
          <img
            src={logoUrl}
            alt={logoAlt}
            className="hp-hero-emblem-img"
            fetchPriority="high"
          />
        </div>
      )}
    </section>
  );
}
