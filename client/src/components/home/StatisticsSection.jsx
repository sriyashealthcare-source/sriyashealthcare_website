import React, { useState, useEffect, useRef } from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';

/**
 * Natural cubic ease-out curve for smooth deceleration: f(t) = 1 - (1 - t)^3
 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function StatCard({ item, shouldAnimate, forceStatic = false, delayMs = 0 }) {
  const targetValue = Number(item.value) || 0;
  const decimals = Math.max(0, Math.min(3, Number(item.decimals) || 0));
  const [displayValue, setDisplayValue] = useState(() => (forceStatic ? targetValue : 0));
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (forceStatic) {
      setDisplayValue(targetValue);
      return undefined;
    }

    if (!shouldAnimate || hasAnimatedRef.current) {
      if (hasAnimatedRef.current) setDisplayValue(targetValue);
      return undefined;
    }

    hasAnimatedRef.current = true;
    let startTimestamp = null;
    let rafId = null;
    const duration = 1600; // 1.6s natural count

    const timer = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min(1, Math.max(0, (timestamp - startTimestamp) / duration));
        const eased = easeOutCubic(progress);
        const current = eased * targetValue;

        if (progress >= 1) {
          setDisplayValue(targetValue);
        } else {
          setDisplayValue(current);
          rafId = window.requestAnimationFrame(step);
        }
      };
      rafId = window.requestAnimationFrame(step);
    }, delayMs);

    return () => {
      clearTimeout(timer);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [shouldAnimate, targetValue, decimals, forceStatic, delayMs]);

  const formattedNumber =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.round(displayValue).toLocaleString('en-IN');

  return (
    <article
      className="hp-stat-card hp-reveal-child"
      style={{ '--reveal-delay': `${delayMs}ms` }}
    >
      <div className="hp-stat-metric-wrap">
        {item.prefix && <span className="hp-stat-affix hp-stat-prefix">{item.prefix}</span>}
        <span className="hp-stat-number">{formattedNumber}</span>
        {item.suffix && <span className="hp-stat-affix hp-stat-suffix">{item.suffix}</span>}
      </div>
      <h3 className="hp-stat-title">{item.title}</h3>
      {item.description && <p className="hp-stat-desc">{item.description}</p>}
    </article>
  );
}

export default function StatisticsSection({
  statistics = {},
  animationSettings = {},
  isPreview = false,
  forceMobile = false
}) {
  const scrollRevealEnabled = animationSettings.scrollRevealEnabled !== false;
  const counterAnimationEnabled = animationSettings.counterAnimationEnabled !== false;

  const [sectionRef, isVisible] = useRevealOnScroll({
    immediate: isPreview || !scrollRevealEnabled,
    disabled: !scrollRevealEnabled
  });

  if (statistics.enabled === false) return null;

  const items = Array.isArray(statistics.items)
    ? [...statistics.items]
        .filter((it) => it && it.isActive !== false && it.title && Number.isFinite(Number(it.value)))
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    : [];

  // When no verified statistics exist:
  // On live website -> return null (hidden).
  // In Admin Preview -> show helpful empty state placeholder.
  if (items.length === 0) {
    if (isPreview) {
      return (
        <section className="hp-section hp-stats-section hp-stats-section--empty-preview">
          <div className="hp-container">
            <div className="hp-stats-empty-box">
              <span className="hp-eyebrow">Statistics Section (Preview Mode)</span>
              <h3>No Verified Statistics Entered Yet</h3>
              <p>
                This section is currently hidden from public visitors. To display company metrics,
                open <strong>Admin Dashboard → Website Management → Statistics Editor</strong> to enter and verify metrics.
              </p>
            </div>
          </div>
        </section>
      );
    }
    return null;
  }

  const forceStatic =
    isPreview ||
    !counterAnimationEnabled ||
    (typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  return (
    <section
      ref={sectionRef}
      id="company-statistics"
      className={`hp-section hp-stats-section ${isVisible ? 'is-revealed' : ''}`}
      aria-labelledby="stats-heading"
    >
      <div className="hp-container">
        {(statistics.eyebrow || statistics.heading || statistics.subtitle) && (
          <header className="hp-section-header hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
            {statistics.eyebrow && <span className="hp-eyebrow">{statistics.eyebrow}</span>}
            {statistics.heading && (
              <h2 id="stats-heading" className="hp-heading">
                {statistics.heading}
              </h2>
            )}
            {statistics.subtitle && <p className="hp-section-subtitle">{statistics.subtitle}</p>}
          </header>
        )}

        <div
          className={`hp-stats-grid ${
            items.length === 1
              ? 'hp-stats-grid--1'
              : items.length === 2
                ? 'hp-stats-grid--2'
                : items.length === 3
                  ? 'hp-stats-grid--3'
                  : 'hp-stats-grid--4'
          }`}
        >
          {items.map((stat, idx) => (
            <StatCard
              key={stat.id || idx}
              item={stat}
              shouldAnimate={isVisible}
              forceStatic={forceStatic}
              delayMs={60 + idx * 75}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

