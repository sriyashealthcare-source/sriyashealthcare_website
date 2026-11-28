import React from 'react';

/**
 * SriyasOrbitalLogo
 *
 * Implements the Sriyas Healthcare Premium Two-Stage Alternating Orbital Animation:
 * 
 * 1. Synchronized 12-Second Timeline (Clockwise, Infinite - 6 Storyboard Stages, 30% Slower Dot Speed):
 *    - Stage 1: Initial State (0.0s - 0.4s, 0% - 3.3%)
 *      * Logo emblem stands clean and pristine.
 *    - Stage 2: Inner Ring Active (0.4s - 5.4s, 3.3% - 45.0%)
 *      * 3.3% - 8.3% (0.4s - 1.0s): Smooth fade-in (opacity 0 -> 1, scale 0.96 -> 1)
 *      * 0% - 44.8% (0.0s - 5.38s): Luminous gold dot completes exactly ONE 360° clockwise revolution (R = 90px, ~5.38s, 30% slower)
 *      * 40.0% - 45.0% (4.8s - 5.4s): Smooth fade-out (opacity 1 -> 0, scale 1 -> 0.97)
 *    - Stage 3: Inner Ring Disappears (5.4s - 6.4s, 45.0% - 53.3%)
 *      * Clean breathing pause; inner ring completely invisible.
 *    - Stage 4: Outer Ring Active (6.4s - 11.4s, 53.3% - 95.0%)
 *      * 53.3% - 58.3% (6.4s - 7.0s): Smooth fade-in (opacity 0 -> 1, scale 0.96 -> 1)
 *      * 50.0% - 94.8% (6.0s - 11.38s): Luminous gold dot completes exactly ONE 360° clockwise revolution (R = 220px, ~5.38s, 30% slower)
 *      * 90.0% - 95.0% (10.8s - 11.4s): Smooth fade-out (opacity 1 -> 0, scale 1 -> 0.97)
 *    - Stage 5: Outer Ring Disappears (11.4s - 12.0s, 95.0% - 100.0%)
 *      * Clean breathing pause; outer ring completely invisible.
 *    - Stage 6: Animation Repeats (seamless infinite loop back to Stage 1 at 0s).
 * 
 * 2. Strict Mutual Exclusivity:
 *    - Only ONE ring is ever visible at any given moment.
 *    - Zero overlap between stages, even during fade transitions.
 * 
 * 3. Shared Geometric Origin:
 *    - Both rings are perfectly concentric, centered at (230, 230) on the central S-lotus emblem.
 * 
 * 4. Geometry:
 *    - Inner Ring: Diameter 180px desktop, 140px mobile (1px champagne-gold, rgba(197, 160, 89, 0.25)).
 *      Dot: 4px x 4px, #D4AF37, subtle glow.
 *    - Outer Ring: Diameter 440px desktop, 300px mobile (1px champagne-gold, rgba(197, 160, 89, 0.22)).
 *      Dot: 4.5px x 4.5px, #D4AF37, soft restrained glow.
 *      Spans approximately from the first R in SRIYAS to the R in HEALTHCARE.
 * 
 * 5. Critical Typography Protection:
 *    - SVG feathered mask (#sriyas-outer-typography-mask) protects SRIYAS HEALTHCARE,
 *      PVT LTD, and the tagline.
 *    - Outer circular stroke and dot naturally dissolve behind the typography zone,
 *      ensuring zero letters are ever cut through or obscured.
 */
export function SriyasOuterOrbit({ style }) {
  return (
    <div
      className="sriyas-outer-orbital-wrap"
      aria-hidden="true"
      data-testid="sriyas-outer-orbital"
      style={style}
    >
      <svg
        className="sriyas-outer-stage-svg"
        viewBox="0 0 880 880"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Luminous Warm-Gold Glow for Outer Orbital Dot */}
          <radialGradient id="sriyas-outer-dot-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.75" />
            <stop offset="45%" stopColor="#D4AF37" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </radialGradient>

          {/* Typography Protection Mask for Outer Ring & Outer Dot:
              White (#FFFFFF) = Fully visible in top & bottom clear zones.
              Smooth gradient = Becomes light when touching words.
              Black (#000000) = Disappears over the words area so it never cuts any letters. */}
          <linearGradient id="sriyas-outer-mask-linear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="18%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#404040" />
            <stop offset="30%" stopColor="#000000" />
            <stop offset="73%" stopColor="#000000" />
            <stop offset="78%" stopColor="#404040" />
            <stop offset="85%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          <mask id="sriyas-outer-typography-mask">
            <rect x="0" y="0" width="880" height="880" fill="url(#sriyas-outer-mask-linear)" />
          </mask>
        </defs>

        {/* 
          STAGE 2: OUTER RING (50% - 100% of 12s timeline)
          - Diameter: 860px (r = 430px), centered at (440, 440) on the hero screen center
          - 1px champagne-gold border: rgba(197, 160, 89, 0.22)
          - Luminous orbital dot (4.5px x 4.5px) revolving 360deg clockwise from 50% to 94.8%
          - Protected by feathered typography mask: smoothly dissolves behind text & reappears past letters
          - Completely finished and invisible at 100%
        */}
        <g className="sriyas-stage-outer-group" mask="url(#sriyas-outer-typography-mask)">
          <circle
            cx="440"
            cy="440"
            r="430"
            className="sriyas-outer-ring-circle"
          />
          <g className="sriyas-outer-dot-rotator">
            {/* Subtle outer glow */}
            <circle cx="440" cy="10" r="6" fill="url(#sriyas-outer-dot-glow)" />
            {/* Crisp 4.5px dot */}
            <circle cx="440" cy="10" r="2.25" fill="#D4AF37" />
            {/* Specular glint */}
            <circle cx="439.3" cy="9.3" r="0.75" fill="#FFFFFF" opacity="0.95" />
          </g>
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
  return (
    <div
      className="hp-hero-brand-lockup-wrapper"
      data-testid="sriyas-orbital-logo"
    >
      <div className="hp-hero-lockup-flow">
        <div className="hp-hero-emblem-wrap">
          {/* Synchronized Two-Stage Alternating Orbital System */}
          <div
            className="sriyas-two-stage-orbital-wrap"
            aria-hidden="true"
            data-testid="sriyas-two-stage-orbital"
          >
            <svg
              className="sriyas-two-stage-svg"
              viewBox="0 0 460 460"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Luminous Warm-Gold Glow for Orbital Dots */}
                <radialGradient id="sriyas-dot-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.75" />
                  <stop offset="45%" stopColor="#D4AF37" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* 
                STAGE 1: INNER RING (0% - 50% of 12s timeline)
                - Diameter: 96px (r = 48px), centered dead-center at (237, 230) on the gold 'S' emblem
                - 1px champagne-gold border: rgba(197, 160, 89, 0.25)
                - Luminous orbital dot (4px x 4px) revolving 360deg clockwise from 0% to 44.8%
                - Revolved tightly and cleanly around ONLY the logo emblem without touching other things
                - Generous clear margin above "SRIYAS HEALTHCARE" lettering
                - Completely finished and invisible at 50%
              */}
              <g className="sriyas-stage-inner-group">
                <circle
                  cx="237"
                  cy="230"
                  r="48"
                  className="sriyas-inner-ring-circle"
                />
                <g className="sriyas-inner-dot-rotator">
                  {/* Subtle outer glow */}
                  <circle cx="237" cy="182" r="5" fill="url(#sriyas-dot-glow)" />
                  {/* Crisp 4px dot */}
                  <circle cx="237" cy="182" r="2" fill="#D4AF37" />
                  {/* Specular glint */}
                  <circle cx="236.4" cy="181.4" r="0.6" fill="#FFFFFF" opacity="0.9" />
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

      {showTagline && tagline && (
        <p className="hp-hero-tagline">{tagline}</p>
      )}
    </div>
  );
}
