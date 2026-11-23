import React from 'react';

/**
 * HeroConcentricRings
 *
 * Provides a very subtle warm ivory & champagne ambient highlight
 * centered behind the golden 'S' logo emblem, keeping the hero background
 * clean, spacious, bright, and completely uncluttered.
 *
 * All excess concentric rings, dots, and dashed outlines have been removed
 * to eliminate background clutter, establishing a minimalist luxury healthcare aesthetic.
 */
export default function HeroConcentricRings() {
  return (
    <div
      className="hp-hero-concentric-container"
      aria-hidden="true"
      data-testid="hero-concentric-rings"
    >
      <div className="hp-concentric-outer-wrapper">
        {/* Subtle, restrained ambient highlight directly behind emblem */}
        <div className="hp-concentric-ambient-glow" />
      </div>
    </div>
  );
}
