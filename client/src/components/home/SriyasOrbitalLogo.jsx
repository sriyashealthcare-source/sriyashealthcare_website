import React, { useState, useEffect } from 'react';

/**
 * SriyasOrbitalLogo
 *
 * Implements the Sriyas Healthcare Two-Stage Gold Orbital Logo Animation
 * matching the 6-panel storyboard:
 * 
 * 1. Initial State (1.5s): Pristine clean logo pause (Emblem + Typography).
 * 2. Stage 1: Inner Circle (7.0s):
 *    - 0.8s smooth fade-in
 *    - 1 full 360° revolution (7.0s) around ONLY the central S emblem
 *    - Golden 3D sphere with luminous warm-gold halo
 *    - Secondary concentric champagne ring
 * 3. Inner Circle Disappears (0.8s): Smooth fade-out.
 *    - Inter-stage clean logo pause (1.0s).
 * 4. Stage 2: Outer Circle (9.0s):
 *    - 0.8s smooth fade-in
 *    - 1 full revolution (9.0s) enclosing Emblem + SRIYAS HEALTHCARE + PVT LTD
 *    - Carefully proportioned ellipse preventing vertical crowding
 *    - Bottom arc curves gracefully above the tagline
 *    - Golden 3D sphere with radiant celestial halo
 * 5. Outer Circle Disappears (0.8s): Smooth fade-out.
 * 6. Animation Repeats: Clean logo pause (2.0s) -> loops back to Stage 1.
 *
 * STRICT Brand Guidelines:
 * - Approved Palette ONLY: #D4AF37, #C8A64B, #C49A2C, #A9822C, #E9D9A6, #F4EBD2.
 * - Prominent orbit: 38–42% opacity. Secondary orbit: 18–22% opacity.
 * - Zero overlap with company name, PVT LTD, tagline, description, or CTA buttons.
 * - pointer-events: none; 100% mutually exclusive stages.
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

          {/* Luminous Warm-Gold Sphere Halo */}
          <radialGradient id="sriyas-gold-halo-inner" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#D4AF37" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#C8A64B" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#C8A64B" stopOpacity="0" />
          </radialGradient>

          {/* 3D Metallic-Gold Sphere with bright highlight and warm shadow */}
          <radialGradient id="sriyas-gold-inner-sphere" cx="30%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#FFFDF7" />
            <stop offset="25%" stopColor="#FBEFCB" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="85%" stopColor="#C8A64B" />
            <stop offset="100%" stopColor="#A9822C" />
          </radialGradient>

          {/* Restrained warm-gold drop shadow */}
          <filter id="sriyas-inner-sphere-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.4" stdDeviation="1.6" floodColor="#A9822C" floodOpacity="0.4" />
          </filter>

          {/* Soft Glow Filter */}
          <filter id="sriyas-inner-glow-blur" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
          </filter>
        </defs>

        {/* 1. Secondary delicate champagne circular path (Concentric outer ring, r = 72) */}
        <circle
          cx="80"
          cy="80"
          r="72"
          className="sriyas-orbit-path sriyas-orbit-path--secondary"
          stroke="url(#sriyas-gold-inner-champagne)"
          strokeWidth="0.8"
        />

        {/* 2. Prominent metallic-gold circular path (Primary orbit path, r = 60) */}
        <circle
          cx="80"
          cy="80"
          r="60"
          className="sriyas-orbit-path sriyas-orbit-path--prominent"
          stroke="url(#sriyas-gold-inner-prominent)"
          strokeWidth="1.15"
        />

        {/* 3. Golden Sphere with Luminous Glow travelling along prominent path (r = 60, center = 80,80) */}
        <g className={`sriyas-inner-ball-rotator ${isRotating ? 'is-spinning' : ''}`}>
          {/* Radiant Soft Halo */}
          <circle
            cx="80"
            cy="20"
            r="13"
            fill="url(#sriyas-gold-halo-inner)"
            filter="url(#sriyas-inner-glow-blur)"
          />
          {/* 3D Metallic-Gold Sphere (Desktop diameter ~10.4px) */}
          <circle
            cx="80"
            cy="20"
            r="5.2"
            fill="url(#sriyas-gold-inner-sphere)"
            filter="url(#sriyas-inner-sphere-shadow)"
          />
          {/* Specular Highlight Glint */}
          <circle
            cx="78.5"
            cy="18.5"
            r="1.5"
            fill="#FFFFFF"
            opacity="0.9"
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
        viewBox="0 0 600 320"
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

          {/* Luminous Warm-Gold Sphere Halo */}
          <radialGradient id="sriyas-gold-halo-outer" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#D4AF37" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#C8A64B" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#C8A64B" stopOpacity="0" />
          </radialGradient>

          {/* 3D Metallic-Gold Sphere with bright highlight and warm shadow */}
          <radialGradient id="sriyas-gold-outer-sphere" cx="30%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#FFFDF7" />
            <stop offset="25%" stopColor="#FBEFCB" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="85%" stopColor="#C8A64B" />
            <stop offset="100%" stopColor="#A9822C" />
          </radialGradient>

          {/* Restrained warm-gold drop shadow */}
          <filter id="sriyas-outer-sphere-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.6" stdDeviation="2.0" floodColor="#A9822C" floodOpacity="0.4" />
          </filter>

          {/* Soft Glow Filter */}
          <filter id="sriyas-outer-glow-blur" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3.8" result="blur" />
          </filter>
        </defs>

        {/* 1. Secondary delicate champagne elliptical path (Concentric outer ellipse: rx = 262, ry = 128) */}
        <path
          d="M 300, 32 a 262,128 0 1,0 0.01,0 Z"
          className="sriyas-orbit-path sriyas-orbit-path--secondary"
          stroke="url(#sriyas-gold-outer-champagne)"
          strokeWidth="0.8"
        />

        {/* 2. Prominent metallic-gold elliptical path (Primary orbit path: rx = 250, ry = 120) */}
        <path
          id="sriyas-outer-ellipse-track"
          d="M 300, 40 a 250,120 0 1,0 0.01,0 Z"
          className="sriyas-orbit-path sriyas-orbit-path--prominent"
          stroke="url(#sriyas-gold-outer-prominent)"
          strokeWidth="1.2"
        />

        {/* 3. Golden Sphere with Luminous Glow travelling along the prominent ellipse path */}
        <g className={`sriyas-outer-ball-rotator ${isRotating ? 'is-spinning' : ''}`}>
          {/* Radiant Celestial Halo */}
          <circle
            cx="0"
            cy="0"
            r="15"
            fill="url(#sriyas-gold-halo-outer)"
            filter="url(#sriyas-outer-glow-blur)"
          />
          {/* 3D Metallic-Gold Sphere (Desktop diameter ~11.2px) */}
          <circle
            cx="0"
            cy="0"
            r="5.6"
            fill="url(#sriyas-gold-outer-sphere)"
            filter="url(#sriyas-outer-sphere-shadow)"
          />
          {/* Specular Highlight Glint */}
          <circle
            cx="-1.6"
            cy="-1.6"
            r="1.6"
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
  // Deterministic 9-State State Machine matching the 6-panel storyboard:
  // 1: 'stage1-clean' (1500ms)          -> Initial State: Pristine clean logo resting pause
  // 2: 'stage2-inner-appear' (800ms)    -> Stage 1 Appear: Inner orbit fades in smoothly
  // 3: 'stage3-inner-rev' (7000ms)       -> Stage 1: Inner Circle (1 Full Revolution, constant angular velocity)
  // 4: 'stage4-inner-disappear' (800ms) -> Inner Circle Disappears: Smooth fade out
  //    'stage4-pause' (1000ms)          -> Inter-Stage Pause: Clean logo resting pause
  // 5: 'stage5-outer-appear' (800ms)    -> Stage 2 Appear: Outer orbit fades in smoothly
  // 6: 'stage6-outer-rev' (9000ms)       -> Stage 2: Outer Circle (1 Full Revolution, constant speed)
  // 7: 'stage7-outer-disappear' (800ms) -> Outer Circle Disappears: Smooth fade out
  //    'stage7-pause' (2000ms)          -> Animation Repeats: Clean logo resting pause -> loops to stage2
  const [stage, setStage] = useState('stage1-clean');

  useEffect(() => {
    let timer = null;

    switch (stage) {
      case 'stage1-clean':
        // Initial clean logo resting pause: 1.5s
        timer = setTimeout(() => setStage('stage2-inner-appear'), 1500);
        break;

      case 'stage2-inner-appear':
        // Inner orbit fade-in: 0.8s
        timer = setTimeout(() => setStage('stage3-inner-rev'), 800);
        break;

      case 'stage3-inner-rev':
        // Inner sphere completes exactly 1 full 360° revolution over 7.0s
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
        // Outer orbit fade-in: 0.8s
        timer = setTimeout(() => setStage('stage6-outer-rev'), 800);
        break;

      case 'stage6-outer-rev':
        // Outer sphere completes exactly 1 full revolution over 9.0s
        timer = setTimeout(() => setStage('stage7-outer-disappear'), 9000);
        break;

      case 'stage7-outer-disappear':
        // Outer orbit fades out over 0.8s
        timer = setTimeout(() => setStage('stage7-pause'), 800);
        break;

      case 'stage7-pause':
        // Clean logo pause (2.0s) before repeating the sequence
        timer = setTimeout(() => setStage('stage2-inner-appear'), 2000);
        break;

      default:
        timer = setTimeout(() => setStage('stage1-clean'), 1500);
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

      {/* Tagline gracefully positioned strictly below the logo composition and outer orbit path */}
      {showTagline && tagline && (
        <p className="hp-hero-tagline">{tagline}</p>
      )}
    </div>
  );
}
