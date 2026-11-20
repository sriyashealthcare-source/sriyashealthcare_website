import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import ResponsiveMediaImage from './ResponsiveMediaImage';

const AUTO_ADVANCE_DELAY = 4000;

export const EIGHT_WORKPLACE_IMAGES_FALLBACK = [
  {
    id: 'wp-global-delegation',
    url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106414/sriyas-healthcare/general/file_dmyw9r.jpg',
    publicId: 'sriyas-healthcare/general/file_dmyw9r',
    mobileUrl: '',
    mobilePublicId: '',
    alt: 'Sriyas Healthcare leadership and global manufacturer partners delegation',
    title: 'Global Manufacturer Alliances & Corporate Delegation',
    caption: 'Sriyas Healthcare leadership and team alongside international medical technology partners and clinical delegates.',
    category: 'Partnerships',
    focalPoint: 'center center',
    aspectRatio: '16/9',
    displayOrder: 1,
    isActive: true
  },
  {
    id: 'wp-live-surgery-cme',
    url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107290/sriyas-healthcare/general/file_lbhsyb.jpg',
    publicId: 'sriyas-healthcare/general/file_lbhsyb',
    mobileUrl: '',
    mobilePublicId: '',
    alt: 'Live surgical demonstration at FALS Hernia Chennai',
    title: 'Live Surgical Demonstrations & Clinical Workshops',
    caption: 'Supporting faculty demonstrations at prestigious clinical forums including FALS Hernia Chennai, MGM Healthcare, and IAGES.',
    category: 'Surgical Education',
    focalPoint: 'center center',
    aspectRatio: '16/9',
    displayOrder: 2,
    isActive: true
  },
  {
    id: 'wp-medical-expo-booth',
    url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107307/sriyas-healthcare/general/file_a7kn4f.jpg',
    publicId: 'sriyas-healthcare/general/file_a7kn4f',
    mobileUrl: '',
    mobilePublicId: '',
    alt: 'Sriyas Healthcare executive team at healthcare industry exhibition',
    title: 'National Healthcare Expos & Manufacturer Alliances',
    caption: 'Sriyas Healthcare executive team representing partner portfolios (Advanced Medical Solutions, Karl Storz Endoskope) at national medical congresses.',
    category: 'Industry Expos',
    focalPoint: 'center center',
    aspectRatio: '16/9',
    displayOrder: 3,
    isActive: true
  },
  {
    id: 'wp-hernia-symposium',
    url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107405/sriyas-healthcare/general/file_i8s4ch.jpg',
    publicId: 'sriyas-healthcare/general/file_i8s4ch',
    mobileUrl: '',
    mobilePublicId: '',
    alt: 'Surgeon CME presentation on IPOM mesh solutions',
    title: 'Surgeon CME & Hernia Solutions Symposium',
    caption: 'Conducting procedure perspectives and clinical CME sessions on IPOM mesh solutions and tissue reinforcement technologies.',
    category: 'Clinical CME',
    focalPoint: 'center center',
    aspectRatio: '16/9',
    displayOrder: 4,
    isActive: true
  },
  {
    id: 'wp-hospital-presentation',
    url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107100/sriyas-healthcare/general/file_xpe7i6.jpg',
    publicId: 'sriyas-healthcare/general/file_xpe7i6',
    mobileUrl: '',
    mobilePublicId: '',
    alt: 'Clinical training presentation at KMCH Department of General Surgery',
    title: 'Hospital Clinical Presentations & Surgeon Engagement',
    caption: 'Presenting surgical skin adhesives and wound closure solutions to surgical residents and faculty at leading hospitals including KMCH Department of General Surgery.',
    category: 'Hospital Training',
    focalPoint: 'center center',
    aspectRatio: '16/9',
    displayOrder: 5,
    isActive: true
  },
  {
    id: 'wp-surgical-liaison',
    url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106727/sriyas-healthcare/general/file_cwsk2o.jpg',
    publicId: 'sriyas-healthcare/general/file_cwsk2o',
    mobileUrl: '',
    mobilePublicId: '',
    alt: 'Operating room clinical liaison and surgical device delivery',
    title: 'Operating Room Clinical Liaison & Surgical Device Support',
    caption: 'Direct on-site clinical liaison providing emergency surgical stock availability and procedural device support outside the operating suite.',
    category: 'OR Support',
    focalPoint: 'center center',
    aspectRatio: '16/9',
    displayOrder: 6,
    isActive: true
  },
  {
    id: 'wp-hospital-corridor',
    url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107356/sriyas-healthcare/general/file_vncy1o.jpg',
    publicId: 'sriyas-healthcare/general/file_vncy1o',
    mobileUrl: '',
    mobilePublicId: '',
    alt: 'Hospital sterile scrub suite coordination and surgical support',
    title: 'Hospital Clinical Presence & Surgical Support',
    caption: 'Continuous sterile suite coordination and surgical consumable fulfillment across leading specialty hospital surgical departments.',
    category: 'Clinical Support',
    focalPoint: 'center center',
    aspectRatio: '16/9',
    displayOrder: 7,
    isActive: true
  },
  {
    id: 'wp-clinical-training',
    url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106936/sriyas-healthcare/general/file_zgmlxn.jpg',
    publicId: 'sriyas-healthcare/general/file_zgmlxn',
    mobileUrl: '',
    mobilePublicId: '',
    alt: 'Clinical education and surgical solutions training',
    title: 'Clinical Education & Surgical Solutions Training',
    caption: 'Interactive procedural workshops and biosurgical product familiarization for surgical teams, resident faculties, and clinical specialists.',
    category: 'Surgical Training',
    focalPoint: 'center center',
    aspectRatio: '16/9',
    displayOrder: 8,
    isActive: true
  }
];

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

  const rawImages = Array.isArray(workplace.images) && workplace.images.length > 0
    ? workplace.images
    : EIGHT_WORKPLACE_IMAGES_FALLBACK;

  const validImages = rawImages
    .filter((img) => img && img.isActive !== false && (img.url || img.mobileUrl))
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Ensure exactly 8 images by merging fallbacks if count is less than 8
  const images = validImages.length >= 8
    ? validImages.slice(0, 8)
    : [
        ...validImages,
        ...EIGHT_WORKPLACE_IMAGES_FALLBACK.filter(
          (fallback) => !validImages.some((v) => v.id === fallback.id || v.publicId === fallback.publicId)
        )
      ].slice(0, 8);

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

  // Automatic Rotation every 4000ms with Visibility API & Hover/Touch Pause
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

  // Page Visibility API Pause: pauses when browser tab is inactive, resumes when active
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

  // Keyboard navigation for accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  // Mobile Touch Swipe Handlers
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

            {/* Navigation and Indicator Bar — 8 Dots with Active Pill in Gold, No Arrows */}
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

              <div className="hp-carousel-caption-hint" aria-hidden="true">
                <span className="hp-carousel-hint-text">Auto-rotating showcase</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
