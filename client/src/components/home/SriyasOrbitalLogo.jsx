import React, { useState, useEffect } from 'react';

/**
 * SriyasOrbitalLogo
 *
 * Implements the Premium Sriyas Healthcare Two-Stage Gold Orbital Logo Animation:
 * 
 * 1. Colour Direction (Strictly Gold & Champagne — NO Black / Charcoal):
 *    - Primary metallic gold: #D4AF37
 *    - Rich gold: #C49A2C
 *    - Deep warm gold: #A9822C
 *    - Champagne gold: #E9D9A6
 *    - Very light champagne: #F4EBD2
 *    - Soft ivory reference: #FBF9F4
 *
 * 2. Stage Sequence (Deterministic 7-Stage State Machine):
 *    - Stage 1: Clean logo (400ms)
 *    - Stage 2: Inner gold orbit appears with subtle scale 96% -> 100% (600ms)
 *    - Stage 3: Inner 3D gold sphere completes exactly 1 full 360° revolution at constant angular velocity (3200ms)
 *    - Stage 4: Inner orbit fades out smoothly (500ms) -> Clean pause (400ms)
 *    - Stage 5: Outer gold orbit appears with subtle scale 96% -> 100% (600ms)
 *    - Stage 6: Outer 3D gold sphere completes exactly 1 full 360° revolution at constant angular velocity (4600ms)
 *    - Stage 7: Outer orbit fades out smoothly (500ms) -> Clean pause (400ms) -> Repeat
 *
 * 3. Geometry & Independence:
 *    - Inner orbit centered precisely on the S emblem.
 *    - Outer orbit centered precisely on the complete logo composition.
 *    - 100% mutually exclusive — both systems never appear or animate together.
 *    - Logo typography and emblem remain completely unrotated, unscaled, and undistorted.
 */

export function SriyasInnerOrbit({ stage, isVisible, isEntering, isRotating, isExiting }) {
  const classes = [
    'sriyas-orbital-inner-wrap',
    isVisible ? 'is-visible' : '',
    isEntering ? 'is-entering' : '',
    isRotating ? 'is-rotating' : '',
    isExiting ? 'is-exiting' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-hidden="true" data-orbit-system="inner" data-stage={stage}>
      <svg
        className="sriyas-orbital-inner-svg"
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Prominent metallic-gold gradient */}
          <linearGradient id="sriyas-gold-inner-prominent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C49A2C" />
            <stop offset="30%" stopColor="#D4AF37" />
            <stop offset="68%" stopColor="#A9822C" />
            <stop offset="100%" stopColor="#C49A2C" />
          </linearGradient>

          {/* Secondary delicate champagne-gold gradient */}
          <linearGradient id="sriyas-gold-inner-champagne" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E9D9A6" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#F4EBD2" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#E9D9A6" stopOpacity="0.6" />
          </linearGradient>

          {/* 3D Metallic-Gold Sphere with bright highlight, rich gold center and deep warm gold edge */}
          <radialGradient id="sriyas-gold-inner-sphere" cx="30%" cy="26%" r="72%">
            <stop offset="0%" stopColor="#FFFDF5" />
            <stop offset="22%" stopColor="#FDEAA8" />
            <stop offset="52%" stopColor="#D4AF37" />
            <stop offset="80%" stopColor="#C49A2C" />
            <stop offset="100%" stopColor="#8C6212" />
          </radialGradient>

          {/* Restrained warm-gold shadow */}
          <filter id="sriyas-inner-sphere-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2.0" floodColor="#A9822C" floodOpacity="0.5" />
          </filter>

          {/* Subtle gold radiance on the prominent orbit */}
          <filter id="sriyas-inner-path-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.0" floodColor="#D4AF37" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 1. Secondary delicate champagne circular path (Stationary, r = 48) */}
        <circle
          cx="80"
          cy="80"
          r="48"
          className="sriyas-orbit-path sriyas-orbit-path--secondary"
          stroke="url(#sriyas-gold-inner-champagne)"
          strokeWidth="1"
        />

        {/* 2. Prominent metallic-gold circular path (Primary orbit path, r = 60) */}
        <circle
          cx="80"
          cy="80"
          r="60"
          className="sriyas-orbit-path sriyas-orbit-path--prominent"
          stroke="url(#sriyas-gold-inner-prominent)"
          strokeWidth="1.8"
          filter="url(#sriyas-inner-path-glow)"
        />

        {/* 3. 3D Metallic-gold sphere travelling along the prominent path (r = 60) */}
        <g className={`sriyas-inner-ball-rotator ${isRotating ? 'is-spinning' : ''}`}>
          <circle
            cx="80"
            cy="20"
            r="5.2"
            fill="url(#sriyas-gold-inner-sphere)"
            filter="url(#sriyas-inner-sphere-shadow)"
          />
          {/* Specular highlight */}
          <circle
            cx="78.3"
            cy="18.3"
            r="1.5"
            fill="#FFFFFF"
            opacity="0.88"
          />
        </g>
      </svg>
    </div>
  );
}

export function SriyasOuterOrbit({ stage, isVisible, isEntering, isRotating, isExiting }) {
  const classes = [
    'sriyas-orbital-outer-wrap',
    isVisible ? 'is-visible' : '',
    isEntering ? 'is-entering' : '',
    isRotating ? 'is-rotating' : '',
    isExiting ? 'is-exiting' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-hidden="true" data-orbit-system="outer" data-stage={stage}>
      <svg
        className="sriyas-orbital-outer-svg"
        viewBox="0 0 700 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Prominent metallic-gold gradient */}
          <linearGradient id="sriyas-gold-outer-prominent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C49A2C" />
            <stop offset="30%" stopColor="#D4AF37" />
            <stop offset="68%" stopColor="#A9822C" />
            <stop offset="100%" stopColor="#C49A2C" />
          </linearGradient>

          {/* Secondary delicate champagne-gold gradient */}
          <linearGradient id="sriyas-gold-outer-champagne" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E9D9A6" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#F4EBD2" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#E9D9A6" stopOpacity="0.6" />
          </linearGradient>

          {/* 3D Metallic-Gold Sphere with bright highlight, rich gold center and deep warm gold edge */}
          <radialGradient id="sriyas-gold-outer-sphere" cx="30%" cy="26%" r="72%">
            <stop offset="0%" stopColor="#FFFDF5" />
            <stop offset="22%" stopColor="#FDEAA8" />
            <stop offset="52%" stopColor="#D4AF37" />
            <stop offset="80%" stopColor="#C49A2C" />
            <stop offset="100%" stopColor="#8C6212" />
          </radialGradient>

          {/* Restrained warm-gold shadow */}
          <filter id="sriyas-outer-sphere-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2.0" stdDeviation="2.5" floodColor="#A9822C" floodOpacity="0.5" />
          </filter>

          {/* Subtle gold radiance on the prominent orbit */}
          <filter id="sriyas-outer-path-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#D4AF37" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 1. Prominent metallic-gold circular path (Primary orbit path, r = 305) */}
        <circle
          cx="350"
          cy="350"
          r="305"
          className="sriyas-orbit-path sriyas-orbit-path--prominent"
          stroke="url(#sriyas-gold-outer-prominent)"
          strokeWidth="1.8"
          filter="url(#sriyas-outer-path-glow)"
        />

        {/* 2. Secondary delicate champagne circular path (Stationary, r = 328) */}
        <circle
          cx="350"
          cy="350"
          r="328"
          className="sriyas-orbit-path sriyas-orbit-path--secondary"
          stroke="url(#sriyas-gold-outer-champagne)"
          strokeWidth="1"
        />

        {/* 3. Separate 3D Metallic-gold sphere travelling along the prominent path (r = 305) */}
        <g className={`sriyas-outer-ball-rotator ${isRotating ? 'is-spinning' : ''}`}>
          <circle
            cx="350"
            cy="45"
            r="7.2"
            fill="url(#sriyas-gold-outer-sphere)"
            filter="url(#sriyas-outer-sphere-shadow)"
          />
          {/* Specular highlight */}
          <circle
            cx="347.7"
            cy="42.7"
            r="2.1"
            fill="#FFFFFF"
            opacity="0.88"
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
  // Deterministic 7-Stage Animation State Machine:
  // 1: 'stage1-clean' (400ms)
  // 2: 'stage2-inner-appear' (600ms)
  // 3: 'stage3-inner-rev' (3200ms)
  // 4: 'stage4-inner-disappear' (500ms)
  //    'stage4-pause' (400ms)
  // 5: 'stage5-outer-appear' (600ms)
  // 6: 'stage6-outer-rev' (4600ms)
  // 7: 'stage7-outer-disappear' (500ms)
  //    'stage7-pause' (400ms) -> repeat
  const [stage, setStage] = useState('stage1-clean');

  useEffect(() => {
    let timer = null;

    switch (stage) {
      case 'stage1-clean':
        // Stage 1: Clean logo initial state
        timer = setTimeout(() => setStage('stage2-inner-appear'), 400);
        break;

      case 'stage2-inner-appear':
        // Stage 2: Inner gold orbit appears with subtle scale 96% -> 100%
        timer = setTimeout(() => setStage('stage3-inner-rev'), 600);
        break;

      case 'stage3-inner-rev':
        // Stage 3: Inner sphere completes exactly 1 full 360° revolution (3.2s)
        timer = setTimeout(() => setStage('stage4-inner-disappear'), 3200);
        break;

      case 'stage4-inner-disappear':
        // Stage 4: Inner orbit fades out smoothly
        timer = setTimeout(() => setStage('stage4-pause'), 500);
        break;

      case 'stage4-pause':
        // Clean logo pause between inner and outer stages
        timer = setTimeout(() => setStage('stage5-outer-appear'), 400);
        break;

      case 'stage5-outer-appear':
        // Stage 5: Outer gold orbit appears with subtle scale 96% -> 100%
        timer = setTimeout(() => setStage('stage6-outer-rev'), 600);
        break;

      case 'stage6-outer-rev':
        // Stage 6: Outer sphere completes exactly 1 full 360° revolution (4.6s)
        timer = setTimeout(() => setStage('stage7-outer-disappear'), 4600);
        break;

      case 'stage7-outer-disappear':
        // Stage 7: Outer orbit fades out smoothly
        timer = setTimeout(() => setStage('stage7-pause'), 500);
        break;

      case 'stage7-pause':
        // Clean logo pause before repeating sequence
        timer = setTimeout(() => setStage('stage2-inner-appear'), 400);
        break;

      default:
        timer = setTimeout(() => setStage('stage1-clean'), 400);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [stage]);

  // Mutual Exclusivity: Inner and Outer are NEVER visible or active simultaneously
  const isInnerVisible =
    stage === 'stage2-inner-appear' ||
    stage === 'stage3-inner-rev' ||
    stage === 'stage4-inner-disappear';

  const isInnerEntering = stage === 'stage2-inner-appear';
  const isInnerRotating = stage === 'stage3-inner-rev';
  const isInnerExiting = stage === 'stage4-inner-disappear';

  const isOuterVisible =
    stage === 'stage5-outer-appear' ||
    stage === 'stage6-outer-rev' ||
    stage === 'stage7-outer-disappear';

  const isOuterEntering = stage === 'stage5-outer-appear';
  const isOuterRotating = stage === 'stage6-outer-rev';
  const isOuterExiting = stage === 'stage7-outer-disappear';

  return (
    <div
      className="hp-hero-brand-lockup-wrapper"
      data-testid="sriyas-orbital-logo"
      data-stage={stage}
    >
      <div className="hp-hero-lockup-flow">
        {/* Outer Orbital System (Stages 5-7) — Centered precisely on the complete logo composition */}
        <SriyasOuterOrbit
          stage={stage}
          isVisible={isOuterVisible}
          isEntering={isOuterEntering}
          isRotating={isOuterRotating}
          isExiting={isOuterExiting}
        />

        <div className="hp-hero-emblem-wrap">
          {/* Inner Orbital System (Stages 2-4) — Centered precisely on the central S emblem */}
          <SriyasInnerOrbit
            stage={stage}
            isVisible={isInnerVisible}
            isEntering={isInnerEntering}
            isRotating={isInnerRotating}
            isExiting={isInnerExiting}
          />

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

      {/* Tagline gracefully positioned below the logo composition */}
      {showTagline && tagline && (
        <p className="hp-hero-tagline">{tagline}</p>
      )}
    </div>
  );
}
