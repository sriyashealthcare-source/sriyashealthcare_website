import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import ResponsiveMediaImage from './ResponsiveMediaImage';

const CAPABILITY_INTERVAL = 5500;

export const DEFAULT_CAPABILITIES = [
  {
    id: 'wwd-distribution',
    title: 'Specialized Surgical & Medical Distribution',
    shortTitle: 'Surgical Distribution',
    description:
      'Providing streamlined institutional supply and dependable fulfillment for operating theatres, surgical wards, and trauma centers across healthcare networks.',
    icon: '🏥',
    tag: 'Institutional Supply',
    image: {
      url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106727/sriyas-healthcare/general/file_cwsk2o.jpg',
      publicId: 'sriyas-healthcare/general/file_cwsk2o',
      alt: 'Specialized surgical distribution and operating room supply'
    }
  },
  {
    id: 'wwd-partnerships',
    title: 'Global Manufacturer Representation',
    shortTitle: 'Global Alliances',
    description:
      'Direct authorized distributor partnerships with leading international brands ensuring authentic provenance, warranty backing, and official clinical documentation.',
    icon: '🤝',
    tag: 'Authorized Sourcing',
    image: {
      url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107209/sriyas-healthcare/general/file_tzsxap.jpg',
      publicId: 'sriyas-healthcare/general/file_tzsxap',
      alt: 'Authorized manufacturer representation and healthcare alliances'
    }
  },
  {
    id: 'wwd-surgical-closure',
    title: 'Surgical Closure & Advanced Wound Care',
    shortTitle: 'Wound Care & Sutures',
    description:
      'Comprehensive supply of barbed sutures, non-absorbable/absorbable sutures, topical microbial sealants, and antimicrobial dressings for surgical specialties.',
    icon: '🩺',
    tag: 'Clinical Specialty',
    image: {
      url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107290/sriyas-healthcare/general/file_lbhsyb.jpg',
      publicId: 'sriyas-healthcare/general/file_lbhsyb',
      alt: 'Surgical closure technologies and advanced wound care'
    }
  },
  {
    id: 'wwd-hernia-biomaterials',
    title: 'Hernia Repair & Biomaterials Solutions',
    shortTitle: 'Hernia Biomaterials',
    description:
      'Supplying innovative biosynthetic meshes, IPOM hernia solutions, and laparoscopic fixation devices for general and gastrointestinal surgeons.',
    icon: '🔬',
    tag: 'Advanced Biosurgery',
    image: {
      url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107405/sriyas-healthcare/general/file_i8s4ch.jpg',
      publicId: 'sriyas-healthcare/general/file_i8s4ch',
      alt: 'Hernia repair and biomaterials solutions'
    }
  },
  {
    id: 'wwd-hospital-dispatch',
    title: 'Hospital Procurement & Emergency Dispatch',
    shortTitle: 'Emergency Dispatch',
    description:
      'Dedicated account coordination providing responsive quotation turnaround, batch traceability, and rapid emergency dispatch for acute clinical requirements.',
    icon: '🚚',
    tag: 'Logistics Excellence',
    image: {
      url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107100/sriyas-healthcare/general/file_xpe7i6.jpg',
      publicId: 'sriyas-healthcare/general/file_xpe7i6',
      alt: 'Hospital procurement coordination and clinical dispatch'
    }
  }
];

export default function WhatWeDoSection({
  whatWeDo = {},
  animationSettings = {},
  isPreview = false,
  forceMobile = false
}) {
  const scrollRevealEnabled = animationSettings.scrollRevealEnabled !== false;
  const [sectionRef, isVisible] = useRevealOnScroll({
    immediate: isPreview || !scrollRevealEnabled,
    disabled: !scrollRevealEnabled
  });

  const rawItems = Array.isArray(whatWeDo.items) && whatWeDo.items.length > 0
    ? whatWeDo.items
    : DEFAULT_CAPABILITIES;

  const validItems = rawItems
    .filter((item) => item && item.isActive !== false && item.title)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const items = validItems.length >= 5
    ? validItems.slice(0, 5)
    : [
        ...validItems,
        ...DEFAULT_CAPABILITIES.filter(
          (def) => !validItems.some((v) => v.id === def.id || v.title === def.title)
        )
      ].slice(0, 5);

  const total = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Preload next capability image to prevent blank frames during auto-advance
  useEffect(() => {
    if (typeof window === 'undefined' || !items || items.length <= 1) return;
    const nextItem = items[(activeIndex + 1) % items.length];
    const url = nextItem?.image?.url || nextItem?.image?.mobileUrl;
    if (url) {
      const preloadImg = new Image();
      preloadImg.src = url;
    }
  }, [activeIndex, items]);

  // Automatic Progression every ~5.5s, paused on hover/touch or when tab hidden
  useEffect(() => {
    if (isPreview || total <= 1 || isPaused) return undefined;

    const timer = setInterval(() => {
      handleNext();
    }, CAPABILITY_INTERVAL);

    return () => clearInterval(timer);
  }, [isPreview, total, isPaused, handleNext]);

  // Page visibility API listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Touch Swipe Handlers for mobile
  const onTouchStart = (e) => {
    setIsPaused(true);
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    setIsPaused(false);
    if (touchStartRef.current === null || touchEndRef.current === null) return;
    const distance = touchStartRef.current - touchEndRef.current;
    if (distance > 45) {
      handleNext();
    } else if (distance < -45) {
      handlePrev();
    }
  };

  if (whatWeDo.enabled === false || total === 0) return null;

  const currentItem = items[activeIndex] || items[0];
  const activeNumeral = String(activeIndex + 1).padStart(2, '0');
  const totalNumeral = String(total).padStart(2, '0');

  const eyebrowText = whatWeDo.eyebrow || 'WHAT WE DO';
  const headingText =
    whatWeDo.heading || 'Focused Capabilities in Surgical & Medical Supply';
  const subtitleText =
    whatWeDo.subtitle ||
    'Connecting healthcare institutions with specialised surgical products, clinical support and dependable distribution.';

  return (
    <section
      ref={sectionRef}
      id="what-we-do"
      className={`hp-section hp-section--tinted hp-wwd-showcase-section home-viewport-section ${isVisible ? 'is-revealed' : ''}`}
      aria-labelledby="wwd-heading"
    >
      <div className="hp-container">
        {/* Section Header with Staggered Editorial Reveal */}
        <header className="hp-section-header hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
          {eyebrowText && <span className="hp-eyebrow">{eyebrowText}</span>}
          {headingText && (
            <h2 id="wwd-heading" className="hp-heading hp-reveal-heading">
              {headingText}
            </h2>
          )}
          {subtitleText && (
            <p className="hp-section-subtitle hp-reveal-text">{subtitleText}</p>
          )}
        </header>

        {/* Asymmetrical Editorial Capabilities Showcase */}
        <div
          className="hp-wwd-showcase hp-wwd-showcase--asymmetric hp-reveal-scale"
          style={{ '--reveal-delay': '80ms' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="hp-wwd-grid-layout">
            {/* Left Dominant Column: Featured Capability Spotlight Stage */}
            <div className="hp-wwd-featured-stage hp-converge-left" style={{ '--reveal-delay': '60ms' }}>
              {/* Large Integrated Cinematic Photograph */}
              <div className="hp-wwd-photo-container hp-reveal-media">
                {items.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <figure
                      key={item.id || idx}
                      className={`hp-wwd-photo-frame ${isActive ? 'is-active' : ''}`}
                      aria-hidden={!isActive}
                    >
                      <div className="hp-wwd-media">
                        <ResponsiveMediaImage
                          media={item.image || DEFAULT_CAPABILITIES[idx]?.image}
                          alt={item.image?.alt || item.title}
                          forceMobile={forceMobile}
                          className="hp-wwd-img"
                        />
                      </div>
                      <div className="hp-wwd-photo-badge">
                        <span>{item.tag || DEFAULT_CAPABILITIES[idx]?.tag || 'Clinical Service'}</span>
                      </div>
                    </figure>
                  );
                })}
              </div>

              {/* Narrative Content Card Below Photo */}
              <div className="hp-wwd-featured-body">
                <div className="hp-wwd-badge-row">
                  <span className="hp-wwd-numeral">{activeNumeral}</span>
                  <span className="hp-wwd-slash">/</span>
                  <span className="hp-wwd-total">{totalNumeral}</span>
                  <span className="hp-wwd-tag">
                    {currentItem.tag || DEFAULT_CAPABILITIES[activeIndex]?.tag || 'Clinical Service'}
                  </span>
                </div>

                <h3 className="hp-wwd-active-title">{currentItem.title}</h3>

                <div className="hp-gold-rule hp-wwd-rule" aria-hidden="true" />

                <p className="hp-wwd-active-desc">{currentItem.description}</p>

                <div className="hp-wwd-actions">
                  <Link
                    to="/products"
                    className="hp-wwd-cta-link"
                    aria-label={`Explore products related to ${currentItem.title}`}
                  >
                    <span>Explore Related Products</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>

                  <div className="hp-wwd-step-nav" aria-label="Capability navigation">
                    <button
                      type="button"
                      className="hp-wwd-nav-arrow"
                      onClick={handlePrev}
                      aria-label="Previous capability"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="hp-wwd-nav-arrow"
                      onClick={handleNext}
                      aria-label="Next capability"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Integrated Progress Indicator Bar at Base */}
                <div className="hp-wwd-stage-progress-track" aria-hidden="true">
                  <div
                    className={`hp-wwd-stage-progress-fill hp-wwd-tab-progress ${!isPaused ? 'is-animating' : ''}`}
                    style={{ animationDuration: `${CAPABILITY_INTERVAL}ms` }}
                    key={activeIndex}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Asymmetric Interactive Capability Index Rail */}
            <nav
              className="hp-wwd-rail hp-converge-right"
              style={{ '--reveal-delay': '120ms' }}
              role="tablist"
              aria-label="Sriyas Healthcare Core Capabilities"
            >
              {items.map((item, idx) => {
                const isActive = idx === activeIndex;
                const itemNum = String(idx + 1).padStart(2, '0');
                const tag = item.tag || DEFAULT_CAPABILITIES[idx]?.tag || 'Clinical Service';

                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`capability-panel-${idx}`}
                    id={`capability-tab-${idx}`}
                    className={`hp-wwd-rail-item hp-wwd-tab ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveIndex(idx)}
                    style={{ '--item-stagger': `${idx * 60}ms` }}
                  >
                    <div className="hp-wwd-rail-num-wrap">
                      <span className="hp-wwd-rail-num hp-wwd-tab-num">{itemNum}</span>
                      <div className="hp-wwd-rail-accent-bar" aria-hidden="true" />
                    </div>

                    <div className="hp-wwd-rail-content">
                      <span className="hp-wwd-rail-tag">{tag}</span>
                      <h4 className="hp-wwd-rail-title hp-wwd-tab-title">{item.title}</h4>
                      <p className="hp-wwd-rail-desc">{item.description}</p>
                    </div>

                    <div className="hp-wwd-rail-arrow" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
