import React, { useState, useEffect } from 'react';

/**
 * SriyasOrbitalLogo
 *
 * Implements the Sriyas Healthcare Two-Stage Orbital Logo Animation:
 * 1. Inner Orbital System:
 *    - Surrounds ONLY the central golden S emblem.
 *    - One prominent dark circular path (r = 64).
 *    - One smaller, lighter circular path (r = 50).
 *    - One small polished golden ball with radial glow travelling around the dark circular path.
 *    - Golden ball completes EXACTLY ONE 360-degree revolution (3.0s), then fades out smoothly (0.4s).
 *    - Confined strictly to the emblem; never touches or covers 'SRIYAS HEALTHCARE' or 'PVT LTD'.
 *
 * 2. Outer Orbital System:
 *    - Surrounds the COMPLETE logo lockup (S emblem, 'SRIYAS HEALTHCARE', 'PVT LTD', and Tagline).
 *    - One prominent dark circular path (r = 380).
 *    - One larger, lighter circular path (r = 408).
 *    - One small polished golden ball with radial glow travelling around the dark circular path.
 *    - Golden ball completes EXACTLY ONE 360-degree revolution (4.0s), then fades out smoothly (0.4s).
 *    - Large enough to encompass the entire logo with generous clearance; never overlaps lettering.
 *
 * 3. Exact Repeating Two-Stage Sequence:
 *    STAGE 1 (Inner 1 Rev) -> FADE OUT -> GAP -> STAGE 2 (Outer 1 Rev) -> FADE OUT -> GAP -> REPEAT
 *    Only ONE orbital system is visible at a time.
 *    Zero rotation or distortion applied to the original logo.
 *    Fully GPU-composited for buttery smooth 60/120fps performance.
 */

export function SriyasInnerOrbit({ isVisible, isFading }) {
  const classes = [
    'sriyas-orbital-inner-wrap',
    isVisible ? 'is-visible' : '',
    isFading ? 'is-fading' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-hidden="true" data-orbit-system="inner">
      <svg
        className="sriyas-orbital-inner-svg"
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="sriyas-inner-gold-ball" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFF9E6" />
            <stop offset="35%" stopColor="#F5CE58" />
            <stop offset="75%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#946C18" />
          </radialGradient>

          <filter id="sriyas-inner-ball-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Smaller, lighter circular path (Subtle & Stationary) */}
        <circle
          cx="80"
          cy="80"
          r="50"
          className="sriyas-orbit-path sriyas-orbit-path--inner-light"
        />

        {/* 2. Prominent dark circular path (Primary orbit path for the golden ball) */}
        <circle
          cx="80"
          cy="80"
          r="64"
          className="sriyas-orbit-path sriyas-orbit-path--inner-dark"
        />

        {/* 3. Golden ball travelling along the prominent dark circular path (r = 64) */}
        <g className="sriyas-inner-ball-rotator">
          <circle
            cx="80"
            cy={80 - 64}
            r="5"
            fill="url(#sriyas-inner-gold-ball)"
            filter="url(#sriyas-inner-ball-glow)"
          />
          <circle
            cx={80 - 1.5}
            cy={80 - 64 - 1.5}
            r="1.6"
            fill="#FFFFFF"
            opacity="0.85"
          />
        </g>
      </svg>
    </div>
  );
}

export function SriyasOuterOrbit({ isVisible, isFading }) {
  const classes = [
    'sriyas-orbital-outer-wrap',
    isVisible ? 'is-visible' : '',
    isFading ? 'is-fading' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-hidden="true" data-orbit-system="outer">
      <svg
        className="sriyas-orbital-outer-svg"
        viewBox="0 0 880 880"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="sriyas-outer-gold-ball" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFF9E6" />
            <stop offset="35%" stopColor="#F5CE58" />
            <stop offset="75%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#946C18" />
          </radialGradient>

          <filter id="sriyas-outer-ball-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Prominent dark circular path (Primary orbit path for the golden ball) */}
        <circle
          cx="440"
          cy="440"
          r="380"
          className="sriyas-orbit-path sriyas-orbit-path--outer-dark"
        />

        {/* 2. Larger, lighter circular path (Subtle & Stationary) */}
        <circle
          cx="440"
          cy="440"
          r="408"
          className="sriyas-orbit-path sriyas-orbit-path--outer-light"
        />

        {/* 3. Golden ball travelling along the prominent dark circular path (r = 380) */}
        <g className="sriyas-outer-ball-rotator">
          <circle
            cx="440"
            cy={440 - 380}
            r="6.8"
            fill="url(#sriyas-outer-gold-ball)"
            filter="url(#sriyas-outer-ball-glow)"
          />
          <circle
            cx={440 - 2}
            cy={440 - 380 - 2}
            r="2"
            fill="#FFFFFF"
            opacity="0.9"
          />
        </g>
      </svg>
    </div>
  );
}

export default function SriyasOrbitalLogo({
  logoUrl,
  logoAlt,
  companyName,
  companySubtitle,
  tagline,
  showTagline = true,
  emblemPlaceholderRef,
  canAnimateMorph,
  rawProgress,
  measureStartAnchors
}) {
  // Master Sequence Controller: 'inner' -> 'inner-fade' -> 'gap1' -> 'outer' -> 'outer-fade' -> 'gap2' -> repeat
  const [stage, setStage] = useState('inner');

  useEffect(() => {
    let timer = null;

    if (stage === 'inner') {
      // Inner golden ball completes 1 full revolution in 3.0s
      timer = setTimeout(() => {
        setStage('inner-fade');
      }, 3000);
    } else if (stage === 'inner-fade') {
      // Inner orbit fades out over 0.4s
      timer = setTimeout(() => {
        setStage('gap1');
      }, 400);
    } else if (stage === 'gap1') {
      // Clean logo state for 0.2s before Stage 2
      timer = setTimeout(() => {
        setStage('outer');
      }, 200);
    } else if (stage === 'outer') {
      // Outer golden ball completes 1 full revolution in 4.0s
      timer = setTimeout(() => {
        setStage('outer-fade');
      }, 4000);
    } else if (stage === 'outer-fade') {
      // Outer orbit fades out over 0.4s
      timer = setTimeout(() => {
        setStage('gap2');
      }, 400);
    } else if (stage === 'gap2') {
      // Clean logo state for 0.2s before repeating Stage 1
      timer = setTimeout(() => {
        setStage('inner');
      }, 200);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [stage]);

  const isInnerVisible = stage === 'inner' || stage === 'inner-fade';
  const isInnerFading = stage === 'inner-fade';
  const isOuterVisible = stage === 'outer' || stage === 'outer-fade';
  const isOuterFading = stage === 'outer-fade';

  return (
    <div
      className="hp-hero-brand-lockup-wrapper"
      data-testid="sriyas-orbital-logo"
      data-active-stage={stage}
    >
      {/* Outer Orbital System (Stage 2) - Surrounds the complete logo lockup */}
      <SriyasOuterOrbit isVisible={isOuterVisible} isFading={isOuterFading} />

      <div className="hp-hero-lockup-flow">
        <div className="hp-hero-emblem-wrap">
          {/* Inner Orbital System (Stage 1) - Surrounds ONLY the central S emblem */}
          <SriyasInnerOrbit isVisible={isInnerVisible} isFading={isInnerFading} />

          <div
            ref={emblemPlaceholderRef}
            className="hp-hero-emblem-slot"
          >
            <img
              src={logoUrl}
              alt={logoAlt}
              className="hp-hero-emblem-img"
              style={{ opacity: canAnimateMorph && rawProgress > 0.05 ? 0 : 1 }}
              onLoad={measureStartAnchors}
              onError={(e) => {
                if (e.currentTarget.src !== '/assets/logos/sriyas-emblem.png') {
                  e.currentTarget.src = '/assets/logos/sriyas-emblem.png';
                }
              }}
              fetchPriority="high"
            />
          </div>
        </div>

        <div className="hp-hero-title-slot">
          <div className="hp-hero-title-stack">
            <h1 className="hp-hero-brand-name">{companyName}</h1>
            {companySubtitle && <p className="hp-hero-brand-sub">{companySubtitle}</p>}
          </div>
        </div>
      </div>

      {/* Tagline inside the lockup wrapper so the outer orbit encompasses it with generous clearance */}
      {showTagline && tagline && (
        <p className="hp-hero-tagline">{tagline}</p>
      )}
    </div>
  );
}
