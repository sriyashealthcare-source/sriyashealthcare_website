import React, { useLayoutEffect, useEffect, useRef, useState, useCallback } from 'react';
import { resolveAssetUrl } from '../../utils/session';
import { useHomepageScroll } from '../../context/HomepageScrollContext';
import SmartActionLink from './SmartActionLink';

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export default function HeroMorphSection({ hero = {}, isPreview = false }) {
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

  const companyName = hero.companyName || 'SRIYAS';
  const companySubtitle = hero.companySubtitle || 'HEALTHCARE PVT LTD';
  const tagline = hero.tagline || 'Empowering Healthcare with Care and Innovation';
  const valuesText = hero.valuesText || 'CARE · TRUST · INNOVATION';
  const ctaText = hero.ctaText || 'Explore Sriyas';
  const ctaLink = hero.ctaLink || '#about-sriyas';
  const secondaryCtaText = hero.secondaryCtaText || 'Explore Products';
  const secondaryCtaLink = hero.secondaryCtaLink || '/products';

  const logoUrl = resolveAssetUrl(hero.logo?.url || '/assets/logos/sriyas-emblem.png');
  const logoAlt = hero.logo?.alt || 'Sriyas Healthcare Pvt Ltd Emblem';

  const useFixedMorph = !isPreview && isMorphEnabled;

  // Keep Navbar emblem synchronized if custom logo was configured in Admin Editor
  useEffect(() => {
    if (!isPreview) {
      setBrandMedia({ url: logoUrl, alt: logoAlt });
    }
  }, [isPreview, logoUrl, logoAlt, setBrandMedia]);

  const measureStartAnchors = useCallback(() => {
    if (!emblemPlaceholderRef.current || !titlePlaceholderRef.current) return null;
    const scrollY = window.scrollY || 0;
    const eRect = emblemPlaceholderRef.current.getBoundingClientRect();
    const tRect = titlePlaceholderRef.current.getBoundingClientRect();
    if (!eRect.width || !eRect.height || !tRect.width) return null;

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
    setStartRects(next);
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

    // Also re-measure cleanly after web fonts finish loading
    let cancelled = false;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) syncAll();
      });
    }

    window.addEventListener('resize', syncAll, { passive: true });
    return () => {
      cancelled = true;
      window.removeEventListener('resize', syncAll);
    };
  }, [useFixedMorph, companyName, companySubtitle, measureNavTargets, measureStartAnchors]);

  // Smooth rAF-driven scroll listener calculating exact morph progress 0..1
  useEffect(() => {
    if (!useFixedMorph) return undefined;

    let rafId = null;

    const updateProgress = () => {
      rafId = null;
      const y = window.scrollY || 0;
      const morphDist = Math.min(340, Math.max(220, window.innerHeight * 0.42));
      const next = Math.min(1, Math.max(0, y / morphDist));
      setScrollProgress((prev) => (Math.abs(prev - next) < 0.0015 ? prev : next));
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
  const eased = easeOutCubic(rawProgress);

  // Supportive hero copy fades swiftly at scroll start
  const copyFadeProgress = Math.min(1, rawProgress / 0.48);
  const copyOpacity = useFixedMorph ? Math.max(0, 1 - copyFadeProgress) : 1;
  const copyTranslateY = useFixedMorph ? copyFadeProgress * 18 : 0;

  // Ambient halo fades softly
  const auraOpacity = useFixedMorph ? Math.max(0, 1 - rawProgress * 1.35) : 1;

  // Determine transform styles for floating emblem + title when morphing
  const canAnimateMorph = Boolean(useFixedMorph && startRects && navTargetRects);
  const isEmblemDocked = useFixedMorph && rawProgress >= 0.985;

  let emblemStyle = {};
  let titleStyle = {};

  if (canAnimateMorph) {
    const sEmblem = startRects.emblem;
    const tEmblem = navTargetRects.img;
    const emblemScaleTarget = tEmblem.height / sEmblem.height;
    const emblemScale = 1 + (emblemScaleTarget - 1) * eased;
    const emblemDx = (tEmblem.left - sEmblem.left) * eased;
    const emblemDy = (tEmblem.top - sEmblem.top) * eased;

    emblemStyle = {
      position: 'fixed',
      left: `${sEmblem.left}px`,
      top: `${sEmblem.top}px`,
      width: `${sEmblem.width}px`,
      height: `${sEmblem.height}px`,
      transformOrigin: 'top left',
      transform: `translate3d(${emblemDx.toFixed(2)}px, ${emblemDy.toFixed(2)}px, 0) scale(${emblemScale.toFixed(4)})`,
      opacity: isEmblemDocked ? 0 : 1,
      pointerEvents: isEmblemDocked ? 'none' : 'auto',
      zIndex: 1002
    };

    const sTitle = startRects.title;
    const tTitle = navTargetRects.text;
    const titleScaleTarget = Math.min(0.6, Math.max(0.26, tTitle.height / sTitle.height));
    const titleScale = 1 + (titleScaleTarget - 1) * eased;
    const titleDx = (tTitle.left - sTitle.left) * eased;
    const titleDy = (tTitle.top - sTitle.top) * eased;

    // Cross-dissolve stacked title gracefully into horizontal navbar text at end of travel
    const titleOpacity =
      rawProgress <= 0.62 ? 1 : Math.max(0, 1 - (rawProgress - 0.62) / 0.28);

    titleStyle = {
      position: 'fixed',
      left: `${sTitle.left}px`,
      top: `${sTitle.top}px`,
      width: `${sTitle.width}px`,
      transformOrigin: 'top left',
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
      {/* Subtle Architectural Background Atmosphere */}
      <div className="hp-hero-backdrop" aria-hidden="true" style={{ opacity: auraOpacity }}>
        <div className="hp-hero-halo" />
        <div className="hp-hero-orbit hp-hero-orbit--outer" />
        <div className="hp-hero-orbit hp-hero-orbit--inner" />
        <div className="hp-hero-grid-texture" />
      </div>

      <div className="hp-hero-inner">
        {/* Resting Anchor Placeholders keep layout stability & provide exact 0-scroll geometry */}
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
                {companySubtitle && (
                  <p className="hp-hero-brand-sub">{companySubtitle}</p>
                )}
              </div>
            ) : (
              /* Invisible flow clone keeps height identical so subtitle/CTA never jump */
              <div className="hp-hero-title-stack" aria-hidden="true">
                <span className="hp-hero-brand-name">{companyName}</span>
                {companySubtitle && (
                  <span className="hp-hero-brand-sub">{companySubtitle}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fixed GPU Morph Elements (Rendered when Hero Morph is Active) */}
        {canAnimateMorph && (
          <>
            <img
              src={logoUrl}
              alt={logoAlt}
              className="hp-hero-emblem-img hp-hero-morph-emblem"
              style={emblemStyle}
              fetchPriority="high"
            />
            <div
              className="hp-hero-title-stack hp-hero-morph-title"
              style={titleStyle}
              aria-hidden={isEmblemDocked ? 'true' : undefined}
            >
              <h1 className="hp-hero-brand-name">{companyName}</h1>
              {companySubtitle && (
                <p className="hp-hero-brand-sub">{companySubtitle}</p>
              )}
            </div>
          </>
        )}

        {/* Supportive Storytelling Copy & Actions */}
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

