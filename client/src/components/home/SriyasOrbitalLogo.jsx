import React, { useState, useEffect } from 'react';

/**
 * SriyasOrbitalLogo
 *
 * Implements the Refined, Subtle, and Slow Sriyas Healthcare Two-Stage Gold Orbital Logo Animation:
 * 
 * 1. Palette & Opacity (Soft Gold & Champagne — NO Black / Charcoal):
 *    - Prominent orbit: 35–45% opacity, thin 1.1px stroke (#D4AF37 / #C8A64B).
 *    - Secondary orbit: 18–22% opacity, delicate 0.8px stroke (#E9D9A6 / #F4EBD2).
 *    - Sphere: Small polished 3D metallic-gold object with restrained warm-gold shadow (#A9822C).
 *
 * 2. Motion Quality & Timings (Slow, Graceful, Constant Angular Velocity):
 *    - Orbit fade-in: 1.0s (scale 97% -> 100%, opacity 0 -> 1)
 *    - Inner sphere revolution: 7.0s (linear constant angular velocity)
 *    - Inner orbit fade-out: 0.8s
 *    - Pause between orbits: 1.0s (clean logo state)
 *    - Outer orbit fade-in: 1.0s (scale 97% -> 100%, opacity 0 -> 1)
 *    - Outer sphere revolution: 9.0s (linear constant angular velocity)
 *    - Outer orbit fade-out: 0.8s
 *    - Pause before repeating: 1.6s (clean logo state) -> Loop
 *
 * 3. Spatial Protection & Bounding Box:
 *    - Inner orbit surrounds ONLY the central S emblem.
 *    - Outer orbit surrounds the complete logo lockup (Emblem + Title + PVT LTD).
 *    - Reduced, compact outer orbit diameter (380px desktop, 290px mobile).
 *    - Tagline, intro copy, and hero CTA buttons sit strictly outside and below the orbit path.
 *    - 100% mutually exclusive — both systems never appear or animate simultaneously.
 *    - Logo typography and emblem remain completely unscaled, unrotated, and stationary.
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
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Prominent soft metallic-gold gradient */}
          <linearGradient id="sriyas-gold-inner-prominent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C8A64B" />
            <stop offset="45%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#C8A64B" />
          </linearGradient>

          {/* Secondary delicate champagne-gold gradient */}
          <linearGradient id="sriyas-gold-inner-champagne" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E9D9A6" />
            <stop offset="50%" stopColor="#F4EBD2" />
            <stop offset="100%" stopColor="#E9D9A6" />
          </linearGradient>

          {/* 3D Metallic-Gold Sphere with soft highlight and warm edge */}
          <radialGradient id="sriyas-gold-inner-sphere" cx="30%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#FFFDF7" />
            <stop offset="25%" stopColor="#FBEFCB" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="85%" stopColor="#C8A64B" />
            <stop offset="100%" stopColor="#A9822C" />
          </radialGradient>

          {/* Restrained warm-gold shadow */}
          <filter id="sriyas-inner-sphere-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.5" floodColor="#A9822C" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* 1. Secondary delicate champagne circular path (Stationary, r = 44) */}
        <circle
          cx="70"
          cy="70"
          r="44"
          className="sriyas-orbit-path sriyas-orbit-path--secondary"
          stroke="url(#sriyas-gold-inner-champagne)"
          strokeWidth="0.8"
        />

        {/* 2. Prominent metallic-gold circular path (Primary orbit path, r = 54) */}
        <circle
          cx="70"
          cy="70"
          r="54"
          className="sriyas-orbit-path sriyas-orbit-path--prominent"
          stroke="url(#sriyas-gold-inner-prominent)"
          strokeWidth="1.1"
        />

        {/* 3. Small polished 3D metallic-gold sphere travelling along the prominent path (r = 54) */}
        <g className={`sriyas-inner-ball-rotator ${isRotating ? 'is-spinning' : ''}`}>
          <circle
            cx="70"
            cy="16"
            r="3.6"
            fill="url(#sriyas-gold-inner-sphere)"
            filter="url(#sriyas-inner-sphere-shadow)"
          />
          {/* Specular highlight glint */}
          <circle
            cx="68.8"
            cy="14.8"
            r="1.1"
            fill="#FFFFFF"
            opacity="0.85"
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
        viewBox="0 0 440 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Prominent soft metallic-gold gradient */}
          <linearGradient id="sriyas-gold-outer-prominent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C8A64B" />
            <stop offset="45%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#C8A64B" />
          </linearGradient>

          {/* Secondary delicate champagne-gold gradient */}
          <linearGradient id="sriyas-gold-outer-champagne" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E9D9A6" />
            <stop offset="50%" stopColor="#F4EBD2" />
            <stop offset="100%" stopColor="#E9D9A6" />
          </linearGradient>

          {/* 3D Metallic-Gold Sphere with soft highlight and warm edge */}
          <radialGradient id="sriyas-gold-outer-sphere" cx="30%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#FFFDF7" />
            <stop offset="25%" stopColor="#FBEFCB" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="85%" stopColor="#C8A64B" />
            <stop offset="100%" stopColor="#A9822C" />
          </radialGradient>

          {/* Restrained warm-gold shadow */}
          <filter id="sriyas-outer-sphere-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.4" stdDeviation="1.8" floodColor="#A9822C" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* 1. Prominent metallic-gold circular path (Primary orbit path, r = 190) */}
        <circle
          cx="220"
          cy="220"
          r="190"
          className="sriyas-orbit-path sriyas-orbit-path--prominent"
          stroke="url(#sriyas-gold-outer-prominent)"
          strokeWidth="1.2"
        />

        {/* 2. Secondary delicate champagne circular path (Stationary, r = 204) */}
        <circle
          cx="220"
          cy="220"
          r="204"
          className="sriyas-orbit-path sriyas-orbit-path--secondary"
          stroke="url(#sriyas-gold-outer-champagne)"
          strokeWidth="0.8"
        />

        {/* 3. Small polished 3D metallic-gold sphere travelling along the prominent path (r = 190) */}
        <g className={`sriyas-outer-ball-rotator ${isRotating ? 'is-spinning' : ''}`}>
          <circle
            cx="220"
            cy="30"
            r="4.4"
            fill="url(#sriyas-gold-outer-sphere)"
            filter="url(#sriyas-outer-sphere-shadow)"
          />
          {/* Specular highlight glint */}
          <circle
            cx="218.6"
            cy="28.6"
            r="1.3"
            fill="#FFFFFF"
            opacity="0.85"
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
  // 2: 'stage2-inner-appear' (1000ms) -> subtle scale 97% -> 100%
  // 3: 'stage3-inner-rev' (7000ms)    -> 1 slow 360° revolution at constant angular velocity
  // 4: 'stage4-inner-disappear' (800ms) -> fade out
  //    'stage4-pause' (1000ms)         -> clean logo pause
  // 5: 'stage5-outer-appear' (1000ms) -> subtle scale 97% -> 100%
  // 6: 'stage6-outer-rev' (9000ms)    -> 1 slow 360° revolution at constant angular velocity
  // 7: 'stage7-outer-disappear' (800ms) -> fade out
  //    'stage7-pause' (1600ms)        -> clean logo pause -> repeat
  const [stage, setStage] = useState('stage1-clean');

  useEffect(() => {
    let timer = null;

    switch (stage) {
      case 'stage1-clean':
        timer = setTimeout(() => setStage('stage2-inner-appear'), 400);
        break;

      case 'stage2-inner-appear':
        timer = setTimeout(() => setStage('stage3-inner-rev'), 1000);
        break;

      case 'stage3-inner-rev':
        // Inner sphere completes exactly 1 full 360° revolution over 7.0 seconds
        timer = setTimeout(() => setStage('stage4-inner-disappear'), 7000);
        break;

      case 'stage4-inner-disappear':
        // Inner orbit fades out over 0.8s
        timer = setTimeout(() => setStage('stage4-pause'), 800);
        break;

      case 'stage4-pause':
        // Clean logo pause (1.0s) between inner and outer orbit systems
        timer = setTimeout(() => setStage('stage5-outer-appear'), 1000);
        break;

      case 'stage5-outer-appear':
        timer = setTimeout(() => setStage('stage6-outer-rev'), 1000);
        break;

      case 'stage6-outer-rev':
        // Outer sphere completes exactly 1 full 360° revolution over 9.0 seconds
        timer = setTimeout(() => setStage('stage7-outer-disappear'), 9000);
        break;

      case 'stage7-outer-disappear':
        // Outer orbit fades out over 0.8s
        timer = setTimeout(() => setStage('stage7-pause'), 800);
        break;

      case 'stage7-pause':
        // Clean logo pause (1.6s) before repeating the sequence
        timer = setTimeout(() => setStage('stage2-inner-appear'), 1600);
        break;

      default:
        timer = setTimeout(() => setStage('stage1-clean'), 400);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [stage]);

  // Strict Mutual Exclusivity: Inner and Outer are NEVER visible or active simultaneously
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

      {/* Tagline gracefully positioned strictly below the logo composition and orbit path */}
      {showTagline && tagline && (
        <p className="hp-hero-tagline">{tagline}</p>
      )}
    </div>
  );
}
