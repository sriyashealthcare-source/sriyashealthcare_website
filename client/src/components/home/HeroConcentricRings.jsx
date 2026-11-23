import React from 'react';

/**
 * HeroConcentricRings
 *
 * Implements the luxury clinical-wellness background concentric ring animation
 * for the Sriyas Healthcare Hero Section.
 *
 * Architecture & Features:
 * 1. 1:1 Pure Circular Geometry (aspect-ratio: 1 / 1) - Zero elliptical distortion.
 * 2. 5 Graduated Nested Rings radiating outward from behind the golden 'S' emblem:
 *    - Ring 1 (Halo): ~220px, 1px solid rgba(197, 160, 89, 0.22), warm inner glow
 *    - Ring 2 (Core): ~380px, 1px solid rgba(197, 160, 89, 0.16), Dot 1 (34s clockwise)
 *    - Ring 3 (Mid Primary): ~560px, 1px solid rgba(212, 175, 55, 0.12), Dot 2 (48s counter-clockwise from 135deg), dashed accent arc
 *    - Ring 4 (Mid Outer): ~760px, 1px solid rgba(212, 175, 55, 0.08), Dot 3 (62s clockwise from 250deg, opacity 0.65)
 *    - Ring 5 (Horizon): ~980px, 1px solid rgba(212, 175, 55, 0.045)
 * 3. Radial Edge Masking: Soft gradient dissolve preventing sharp clips.
 * 4. Choreographed Staggered Breathing Pulse (9s ease-in-out, staggered delays).
 * 5. Diffuse center ambient glow giving warm depth against cream background.
 * 6. GPU-composited transforms & opacity; reduced-motion friendly.
 */

export default function HeroConcentricRings() {
  return (
    <div
      className="hp-hero-concentric-container"
      aria-hidden="true"
      data-testid="hero-concentric-rings"
    >
      <div className="hp-concentric-outer-wrapper">
        {/* Soft, diffuse radial ambient glow at the center behind the emblem */}
        <div className="hp-concentric-ambient-glow" />

        {/* 1. Ring 1 (Innermost Halo) - ~220px */}
        <div className="hp-concentric-ring hp-concentric-ring--1">
          <div className="hp-concentric-ring-circle" />
        </div>

        {/* 2. Ring 2 (Inner Core) - ~380px with Dot 1 */}
        <div className="hp-concentric-ring hp-concentric-ring--2">
          <div className="hp-concentric-ring-circle" />
          <div className="hp-concentric-rotator hp-concentric-rotator--ring2">
            <span className="hp-concentric-dot hp-concentric-dot--1" />
          </div>
        </div>

        {/* 3. Ring 3 (Mid Primary) - ~560px with Dot 2 & Dashed Accent Arc */}
        <div className="hp-concentric-ring hp-concentric-ring--3">
          <div className="hp-concentric-ring-circle" />

          {/* Precision Horology Dashed Accent Arc Segment */}
          <div className="hp-concentric-dashed-wrapper">
            <svg
              className="hp-concentric-dashed-arc"
              viewBox="0 0 560 560"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="280"
                cy="280"
                r="279.5"
                stroke="#D4AF37"
                strokeWidth="1"
                strokeDasharray="40 260"
                strokeOpacity="0.22"
              />
            </svg>
          </div>

          {/* Dot 2: 48s linear infinite reverse (counter-clockwise from 135deg) */}
          <div className="hp-concentric-rotator hp-concentric-rotator--ring3">
            <span className="hp-concentric-dot hp-concentric-dot--2" />
          </div>
        </div>

        {/* 4. Ring 4 (Mid Outer) - ~760px with Dot 3 */}
        <div className="hp-concentric-ring hp-concentric-ring--4">
          <div className="hp-concentric-ring-circle" />
          {/* Dot 3: 62s linear infinite (clockwise from 250deg, opacity 0.65) */}
          <div className="hp-concentric-rotator hp-concentric-rotator--ring4">
            <span className="hp-concentric-dot hp-concentric-dot--3" />
          </div>
        </div>

        {/* 5. Ring 5 (Outermost Horizon) - ~980px */}
        <div className="hp-concentric-ring hp-concentric-ring--5">
          <div className="hp-concentric-ring-circle" />
        </div>
      </div>
    </div>
  );
}
