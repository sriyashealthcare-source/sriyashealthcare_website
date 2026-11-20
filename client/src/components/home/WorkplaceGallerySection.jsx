import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import ResponsiveMediaImage from './ResponsiveMediaImage';

const AUTO_ADVANCE_DELAY = 4500;

export default function WorkplaceGallerySection({
  workplace = {},
  animationSettings = {},
  isPreview = false,
  forceMobile = false
}) {
  const scrollRevealEnabled = animationSettings.scrollRevealEnabled !== false;
  const [sectionRef, isVisible] = useRevealOnScroll({
    immediate: isPreview || !scrollRevealEnabled,
    disabled: !scrollRevealEnabled
  });

  const rawImages = Array.isArray(workplace.images) ? workplace.images : [];
  const images = rawImages
    .filter((img) => img && img.isActive !== false && (img.url || img.mobileUrl))
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const total = images.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState('next');
  const [isPaused, setIsPaused] = useState(false);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setDirection('next');
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setDirection('prev');
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = useCallback((index) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 'next' : 'prev');
    setCurrentIndex(index);
  }, [currentIndex]);

  // Automatic Rotation with Visibility API & Hover Pause
  useEffect(() => {
    if (isPreview || total <= 1 || isPaused) return;

    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const timer = setInterval(() => {
      handleNext();
    }, AUTO_ADVANCE_DELAY);

    return () => clearInterval(timer);
  }, [isPreview, total, isPaused, handleNext]);

  // Page Visibility API Pause
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

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  // Mobile Touch Swipe Handlers
  const onTouchStart = (e) => {
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (touchStartRef.current === null || touchEndRef.current === null) return;
    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > 45;
    const isRightSwipe = distance < -45;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  if (workplace.enabled === false || total === 0) return null;

  const currentItem = images[currentIndex] || images[0];
  const slideNum = String(currentIndex + 1).padStart(2, '0');
  const totalNum = String(total).padStart(2, '0');

  const eyebrowText = workplace.eyebrow || 'OUR COMPANY IN ACTION';
  const headingText =
    workplace.heading || 'Building Relationships Across the Healthcare Community';
  const subtitleText =
    workplace.subtitle ||
    'Explore moments from our professional engagements, clinical interactions, manufacturer collaborations and healthcare initiatives.';

  return (
    <section
      ref={sectionRef}
      id="our-workplace"
      className={`hp-section hp-section--alt hp-carousel-section ${
        isVisible ? 'is-revealed' : ''
      }`}
      aria-roledescription="carousel"
      aria-label="Our Company in Action"
      onKeyDown={handleKeyDown}
      tabIndex="0"
    >
      <div className="hp-container">
        <header className="hp-section-header hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
          {eyebrowText && <span className="hp-eyebrow">{eyebrowText}</span>}
          {headingText && (
            <h2 id="workplace-heading" className="hp-heading hp-reveal-heading">
              {headingText}
            </h2>
          )}
          {subtitleText && (
            <p className="hp-section-subtitle hp-reveal-text">{subtitleText}</p>
          )}
        </header>

        <div
          className="hp-carousel hp-reveal-scale"
          style={{ '--reveal-delay': '80ms' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="hp-carousel-stage">
            <div className="hp-carousel-viewport">
              {images.map((item, idx) => {
                const isActive = idx === currentIndex;
                const isPrevious =
                  direction === 'next'
                    ? idx === (currentIndex - 1 + total) % total
                    : idx === (currentIndex + 1) % total;

                let slideClass = 'hp-carousel-slide';
                if (isActive) slideClass += ' is-active';
                else if (isPrevious) slideClass += ' is-leaving';

                return (
                  <div
                    key={item.id || idx}
                    className={slideClass}
                    aria-hidden={!isActive}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${idx + 1} of ${total}`}
                  >
                    <div className="hp-carousel-media-wrap">
                      <div className="hp-carousel-media">
                        <ResponsiveMediaImage
                          media={item}
                          alt={item.alt || item.title || item.caption || 'Sriyas Healthcare company in action'}
                          forceMobile={forceMobile}
                          className="hp-carousel-img"
                          fallback={
                            <div className="hp-media-fallback">
                              <span>Sriyas Healthcare Corporate Activity</span>
                            </div>
                          }
                        />
                      </div>
                      {item.category && (
                        <div className="hp-carousel-tag-badge">
                          <span>{item.category}</span>
                        </div>
                      )}
                    </div>

                    <div className="hp-carousel-content">
                      <div className="hp-carousel-text">
                        {item.title && <h3 className="hp-carousel-title">{item.title}</h3>}
                        {item.caption && <p className="hp-carousel-caption">{item.caption}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation and Indicator Bar */}
            <div className="hp-carousel-footer">
              <div className="hp-carousel-counter" aria-live="polite">
                <span className="hp-counter-current">{slideNum}</span>
                <span className="hp-counter-sep">/</span>
                <span className="hp-counter-total">{totalNum}</span>
              </div>

              <div className="hp-carousel-dots" role="tablist" aria-label="Slide indicators">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={idx === currentIndex}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`hp-carousel-dot ${idx === currentIndex ? 'is-active' : ''}`}
                    onClick={() => goToSlide(idx)}
                  />
                ))}
              </div>

              <div className="hp-carousel-arrows">
                <button
                  type="button"
                  className="hp-carousel-btn hp-carousel-btn--prev"
                  onClick={handlePrev}
                  aria-label="Previous image"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="hp-carousel-btn hp-carousel-btn--next"
                  onClick={handleNext}
                  aria-label="Next image"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
