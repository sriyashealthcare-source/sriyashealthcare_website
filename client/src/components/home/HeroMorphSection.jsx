import React, { useLayoutEffect, useEffect, useRef, useState, useCallback } from 'react';
import { resolveAssetUrl } from '../../utils/session';
import { useHomepageScroll } from '../../context/HomepageScrollContext';
import SmartActionLink from './SmartActionLink';
import ResponsiveMediaImage from './ResponsiveMediaImage';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
  const titlePlaceholderRef = useRef(null);

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
  const secondaryCtaText = hero.secondaryCtaText || 'Explore Products';
  const secondaryCtaLink = hero.secondaryCtaLink || '/products';

  const logoUrl = resolveAssetUrl(hero.logo?.url || '/assets/logos/sriyas-emblem.png');
  const logoAlt = hero.logo?.alt || 'Sriyas Healthcare Pvt Ltd Emblem';

  const useFixedMorph = !isPreview && isMorphEnabled;

  // Keep docked Navbar brand synchronized seamlessly with Hero configuration
  useEffect(() => {
    if (!isPreview) {
      setBrandMedia({
        url: logoUrl,
        alt: logoAlt,
        companyName,
        companySubtitle
      });
    }
  }, [isPreview, logoUrl, logoAlt, companyName, companySubtitle, setBrandMedia]);

  const measureStartAnchors = useCallback(() => {
    if (!emblemPlaceholderRef.current || !titlePlaceholderRef.current) return null;
    const scrollY = window.scrollY || 0;
    const eRect = emblemPlaceholderRef.current.getBoundingClientRect();
    const tRect = titlePlaceholderRef.current.getBoundingClientRect();
    if (!eRect.width || !eRect.height || !tRect.width || !tRect.height) return null;

    const next = {
      emblem: {
        left: eRect.left,
        top: eRect.top + scrollY,
        width: eRect.width,
        height: eRect.height
      },
      title: {
        left: tRect.left,
        top: tRect.top + scrollY,
        width: tRect.width,
        height: tRect.height
      }
    };

    setStartRects((prev) => {
      if (
        prev &&
        Math.abs(prev.emblem.left - next.emblem.left) < 0.5 &&
        Math.abs(prev.emblem.top - next.emblem.top) < 0.5 &&
        Math.abs(prev.emblem.width - next.emblem.width) < 0.5 &&
        Math.abs(prev.emblem.height - next.emblem.height) < 0.5 &&
        Math.abs(prev.title.left - next.title.left) < 0.5 &&
        Math.abs(prev.title.top - next.title.top) < 0.5 &&
        Math.abs(prev.title.width - next.title.width) < 0.5 &&
        Math.abs(prev.title.height - next.title.height) < 0.5
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

    // Ensure geometry updates when custom fonts finish loading or window/lockup resizes
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
      if (titlePlaceholderRef.current) ro.observe(titlePlaceholderRef.current);
    }

    window.addEventListener('resize', syncAll, { passive: true });
    return () => {
      cancelled = true;
      if (ro) ro.disconnect();
      window.removeEventListener('resize', syncAll);
    };
  }, [useFixedMorph, companyName, companySubtitle, measureNavTargets, measureStartAnchors]);

  // Continuous rAF scroll listener consistent across desktop, laptop, tablet, and mobile
  useEffect(() => {
    if (!useFixedMorph) return undefined;

    let rafId = null;

    const updateProgress = () => {
      rafId = null;
      const y = window.scrollY || 0;
      const morphDist = Math.min(320, Math.max(180, window.innerHeight * 0.36));
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
  const eased = easeInOutCubic(rawProgress);

  // Supportive copy fades smoothly upward cleanly ahead of docking
  const copyFadeProgress = Math.min(1, rawProgress / 0.45);
  const copyOpacity = useFixedMorph ? Math.max(0, 1 - copyFadeProgress) : 1;
  const copyTranslateY = useFixedMorph ? copyFadeProgress * -16 : 0;
  const auraOpacity = useFixedMorph ? Math.max(0, 1 - rawProgress * 1.25) : 1;

  const canAnimateMorph = Boolean(useFixedMorph && startRects && navTargetRects);
  const isEmblemDocked = useFixedMorph && rawProgress >= 0.992;

  let emblemStyle = {};
  let titleStyle = {};

  if (canAnimateMorph) {
    // Emblem moves continuously center-to-center into exact navbar emblem rect
    const sEmblem = startRects.emblem;
    const tEmblem = navTargetRects.img;
    const sCenterX = sEmblem.left + sEmblem.width / 2;
    const sCenterY = sEmblem.top + sEmblem.height / 2;
    const tCenterX = tEmblem.left + tEmblem.width / 2;
    const tCenterY = tEmblem.top + tEmblem.height / 2;

    const emblemDx = (tCenterX - sCenterX) * eased;
    const emblemDy = (tCenterY - sCenterY) * eased;
    const emblemScaleTarget = Math.min(
      tEmblem.width / sEmblem.width,
      tEmblem.height / sEmblem.height
    );
    const emblemScale = 1 + (emblemScaleTarget - 1) * eased;

    emblemStyle = {
      position: 'fixed',
      left: `${sEmblem.left}px`,
      top: `${sEmblem.top}px`,
      width: `${sEmblem.width}px`,
      height: `${sEmblem.height}px`,
      transformOrigin: 'center center',
      transform: `translate3d(${emblemDx.toFixed(2)}px, ${emblemDy.toFixed(2)}px, 0) scale(${emblemScale.toFixed(4)})`,
      opacity: isEmblemDocked ? 0 : 1,
      pointerEvents: isEmblemDocked ? 'none' : 'auto',
      zIndex: 1002
    };

    // Title block travels center-to-center directly onto navbar text column,
    // staying opaque until docked alignment (0.86 -> 1.0)
    const sTitle = startRects.title;
    const tTitle = navTargetRects.text;
    const sTitleCx = sTitle.left + sTitle.width / 2;
    const sTitleCy = sTitle.top + sTitle.height / 2;
    const tTitleCx = tTitle.left + tTitle.width / 2;
    const tTitleCy = tTitle.top + tTitle.height / 2;

    const titleDx = (tTitleCx - sTitleCx) * eased;
    const titleDy = (tTitleCy - sTitleCy) * eased;
    const titleScaleTarget = Math.min(
      0.72,
      Math.max(0.24, Math.min(tTitle.width / sTitle.width, tTitle.height / sTitle.height))
    );
    const titleScale = 1 + (titleScaleTarget - 1) * eased;

    const titleOpacity =
      rawProgress <= 0.86 ? 1 : Math.max(0, 1 - (rawProgress - 0.86) / 0.14);

    titleStyle = {
      position: 'fixed',
      left: `${sTitle.left}px`,
      top: `${sTitle.top}px`,
      width: `${sTitle.width}px`,
      height: `${sTitle.height}px`,
      transformOrigin: 'center center',
      transform: `translate3d(${titleDx.toFixed(2)}px, ${titleDy.toFixed(2)}px, 0) scale(${titleScale.toFixed(4)})`,
      opacity: titleOpacity,
      pointerEvents: titleOpacity < 0.08 ? 'none' : 'auto',
      zIndex: 1001
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
        {/* Centered Resting Anchor Slot Preserving Flow Height at Zero Shift */}
        <div className="hp-hero-lockup-flow">
          <div
            ref={emblemPlaceholderRef}
            className={`hp-hero-emblem-slot ${canAnimateMorph ? 'is-measured' : ''}`}
          >
            {!canAnimateMorph && (
              <img
                src={logoUrl}
                alt={logoAlt}
                className="hp-hero-emblem-img"
                onLoad={measureStartAnchors}
                fetchPriority="high"
              />
            )}
          </div>

          <div
            ref={titlePlaceholderRef}
            className={`hp-hero-title-slot ${canAnimateMorph ? 'is-measured' : ''}`}
          >
            {!canAnimateMorph ? (
              <div className="hp-hero-title-stack">
                <h1 className="hp-hero-brand-name">{companyName}</h1>
                {companySubtitle && <p className="hp-hero-brand-sub">{companySubtitle}</p>}
              </div>
            ) : (
              <div className="hp-hero-title-stack" aria-hidden="true">
                <span className="hp-hero-brand-name">{companyName}</span>
                {companySubtitle && <span className="hp-hero-brand-sub">{companySubtitle}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Continuous Fixed GPU-Composited Travelling Brand Unit */}
        {canAnimateMorph && (
          <>
            <img
              src={logoUrl}
              alt={logoAlt}
              className="hp-hero-emblem-img hp-hero-morph-emblem"
              style={emblemStyle}
              onLoad={measureStartAnchors}
              fetchPriority="high"
            />
            <div
              className="hp-hero-title-stack hp-hero-morph-title"
              style={titleStyle}
              aria-hidden={isEmblemDocked ? 'true' : undefined}
            >
              <h1 className="hp-hero-brand-name">{companyName}</h1>
              {companySubtitle && <p className="hp-hero-brand-sub">{companySubtitle}</p>}
            </div>
          </>
        )}

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

      {/* Subtle Scroll Cue */}
      {!isPreview && (
        <a
          href="#about-sriyas"
          className="hp-hero-scroll-cue"
          aria-label="Scroll to explore Sriyas Healthcare"
          style={{ opacity: auraOpacity }}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('about-sriyas')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span className="hp-scroll-cue-label">Scroll to explore</span>
          <span className="hp-scroll-cue-line" />
        </a>
      )}
    </section>
  );
}
