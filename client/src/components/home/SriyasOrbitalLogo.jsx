import React from 'react';

/**
 * SriyasOrbitalLogo
 *
 * Implements the Unified Three-Ring Gold Orbital System for Sriyas Healthcare:
 * 
 * 1. Primary Orbital Ring (r = 118px):
 *    - Thin champagne-gold stroke (0.95px, 36% opacity).
 *    - One small, refined golden satellite (4.8px) with subtle warm glow.
 *    - Smooth, continuous 60s linear revolution.
 * 
 * 2. Secondary Orbital Ring (r = 64px):
 *    - Delicate, subtle champagne-gold stroke (0.75px, 24% opacity).
 *    - Perfectly frames the central 'S' emblem with zero text intersection.
 * 
 * 3. Outer Accent Ring (r = 186px):
 *    - Faint, thin, ethereal champagne-gold stroke (0.65px, 14% opacity).
 *    - Adds spatial luxury and depth without visual clutter.
 * 
 * 4. Critical Typography Protection Mask:
 *    - SVG feathered mask (#sriyas-typography-feather-mask) over heading,
 *      subtitle, and tagline.
 *    - Ensures orbital strokes and the moving satellite naturally dissolve
 *      behind the typography zone with zero letter collisions.
 * 
 * Visual Hierarchy:
 * 1. Golden 'S' Emblem
 * 2. SRIYAS HEALTHCARE Company Name
 * 3. Tagline
 * 4. Supporting Intro & CTA Buttons
 * 5. Subtle, restrained orbital decoration
 */
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
  return (
    <div
      className="hp-hero-brand-lockup-wrapper"
      data-testid="sriyas-orbital-logo"
    >
      <div className="hp-hero-lockup-flow">
        <div className="hp-hero-emblem-wrap">
          {/* Unified Three-Ring Orbital System centered precisely on the emblem */}
          <div
            className="sriyas-orbital-system-wrap"
            aria-hidden="true"
            data-testid="sriyas-orbital-system"
          >
            <svg
              className="sriyas-orbital-svg"
              viewBox="0 0 600 600"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Primary Soft Metallic Champagne-Gold Gradient */}
                <linearGradient id="sriyas-gold-primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E4D1A0" />
                  <stop offset="50%" stopColor="#C8A64B" />
                  <stop offset="100%" stopColor="#E4D1A0" />
                </linearGradient>

                {/* Secondary Delicate Champagne-Gold Gradient */}
                <linearGradient id="sriyas-gold-secondary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E9D9A6" />
                  <stop offset="50%" stopColor="#F4EBD2" />
                  <stop offset="100%" stopColor="#E9D9A6" />
                </linearGradient>

                {/* Outer Accent Faint Gradient */}
                <linearGradient id="sriyas-gold-outer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E9D9A6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#C8A64B" stopOpacity="0.4" />
                </linearGradient>

                {/* Satellite Warm-Gold Luminous Halo (Small & subtle: r=6px, NO big blurry cloud) */}
                <radialGradient id="sriyas-satellite-halo-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.45" />
                  <stop offset="50%" stopColor="#C8A64B" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#C8A64B" stopOpacity="0" />
                </radialGradient>

                {/* 3D Metallic-Gold Satellite Sphere */}
                <radialGradient id="sriyas-satellite-sphere-grad" cx="30%" cy="28%" r="72%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="25%" stopColor="#FDF4DC" />
                  <stop offset="65%" stopColor="#D4AF37" />
                  <stop offset="85%" stopColor="#C8A64B" />
                  <stop offset="100%" stopColor="#A9822C" />
                </radialGradient>

                {/* Subtle warm shadow on satellite */}
                <filter id="sriyas-satellite-shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="1.0" stdDeviation="1.0" floodColor="#A9822C" floodOpacity="0.35" />
                </filter>

                {/* Mask Gaussian Blur for soft, feathered transition at typography boundary */}
                <filter id="sriyas-mask-feather-blur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" />
                </filter>

                {/*
                  CRITICAL TYPOGRAPHY MASK:
                  Protects SRIYAS HEALTHCARE, PVT LTD, and the tagline.
                  White (#FFFFFF) = Fully visible.
                  Black (#000000) = Completely transparent.
                  The feathered black rectangle covers the typography band,
                  ensuring orbital lines and moving satellite naturally disappear
                  behind the text with zero awkward breaks or overlapping strokes.
                */}
                <mask id="sriyas-typography-feather-mask">
                  {/* White base canvas */}
                  <rect x="0" y="0" width="600" height="600" fill="#FFFFFF" />

                  {/* Feathered Black Protection Mask over Heading, Subtitle & Tagline */}
                  <rect
                    x="25"
                    y="350"
                    width="550"
                    height="138"
                    rx="24"
                    fill="#000000"
                    filter="url(#sriyas-mask-feather-blur)"
                  />
                </mask>
              </defs>

              {/* 
                Masked Orbital Group:
                Strokes and the moving satellite naturally dissolve before reaching text.
              */}
              <g mask="url(#sriyas-typography-feather-mask)">
                {/* Ring B: Secondary Inner Orbital Ring (r = 64) */}
                <circle
                  cx="300"
                  cy="300"
                  r="64"
                  className="sriyas-orbit-ring sriyas-orbit-ring--secondary"
                  stroke="url(#sriyas-gold-secondary-grad)"
                />

                {/* Ring A: Primary Orbital Ring (r = 118) */}
                <circle
                  cx="300"
                  cy="300"
                  r="118"
                  className="sriyas-orbit-ring sriyas-orbit-ring--primary"
                  stroke="url(#sriyas-gold-primary-grad)"
                />

                {/* Ring C: Optional Outer Accent Ring (r = 186) */}
                <circle
                  cx="300"
                  cy="300"
                  r="186"
                  className="sriyas-orbit-ring sriyas-orbit-ring--outer"
                  stroke="url(#sriyas-gold-outer-grad)"
                />

                {/* Single Refined Golden Satellite on Primary Ring (r = 118, top is at cy = 182) */}
                <g className="sriyas-satellite-rotator">
                  {/* Subtle radiant halo */}
                  <circle
                    cx="300"
                    cy="182"
                    r="6.5"
                    fill="url(#sriyas-satellite-halo-grad)"
                  />
                  {/* 3D Metallic-Gold Sphere (Diameter ~4.8px) */}
                  <circle
                    cx="300"
                    cy="182"
                    r="2.4"
                    fill="url(#sriyas-satellite-sphere-grad)"
                    filter="url(#sriyas-satellite-shadow)"
                  />
                  {/* Specular pinpoint highlight */}
                  <circle
                    cx="299.2"
                    cy="181.2"
                    r="0.75"
                    fill="#FFFFFF"
                    opacity="0.95"
                  />
                </g>
              </g>
            </svg>
          </div>

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

      {/* Tagline positioned with typography priority */}
      {showTagline && tagline && (
        <p className="hp-hero-tagline">{tagline}</p>
      )}
    </div>
  );
}
