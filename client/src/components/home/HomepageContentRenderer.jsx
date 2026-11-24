import React from 'react';
import HeroMorphSection from './HeroMorphSection';
import AboutSection from './AboutSection';
import StatisticsSection from './StatisticsSection';
import WorkplaceGallerySection from './WorkplaceGallerySection';
import ProfileShowcaseSection from './ProfileShowcaseSection';
import WhatWeDoSection from './WhatWeDoSection';
import ValuesSection from './ValuesSection';
import CtaSection from './CtaSection';
import ContinueToProductsTrigger from './ContinueToProductsTrigger';

const DEFAULT_ORDER = [
  'hero',
  'about',
  'statistics',
  'workplace',
  'leadership',
  'team',
  'whatWeDo',
  'values',
  'callToAction'
];

/**
 * SRIYAS HEALTHCARE HOMEPAGE ARCHITECTURE:
 * On desktop and laptop viewports (min-width: 1024px), every section rendered by this
 * component utilizes the standardized `.home-viewport-section` wrapper class.
 * This guarantees that every section fits cleanly inside a single full-screen viewport (100dvh)
 * with zero internal overflow or clipping, vertical centering, and smooth scroll snapping.
 *
 * NOTE FOR FUTURE SECTIONS:
 * Any future section component added to the homepage must apply the `.home-viewport-section`
 * class to its root <section> element.
 */
export default function HomepageContentRenderer({
  homepage,
  isPreview = false,
  forceMobile = false
}) {
  if (!homepage) return null;

  const animationSettings = homepage.animationSettings || {
    scrollRevealEnabled: true,
    galleryParallaxEnabled: true,
    imageHoverEnabled: true,
    counterAnimationEnabled: true
  };

  let order =
    Array.isArray(homepage.sectionOrder) && homepage.sectionOrder.length > 0
      ? [...homepage.sectionOrder]
      : [...DEFAULT_ORDER];

  if (!order.includes('hero')) {
    order = ['hero', ...order];
  }

  const renderSection = (key) => {
    switch (key) {
      case 'hero':
        if (homepage.hero?.enabled === false) return null;
        return (
          <HeroMorphSection
            key="hero"
            hero={homepage.hero}
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        );
      case 'about':
        return (
          <AboutSection
            key="about"
            about={homepage.about}
            animationSettings={animationSettings}
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        );
      case 'statistics':
        return (
          <StatisticsSection
            key="statistics"
            statistics={homepage.statistics}
            animationSettings={animationSettings}
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        );
      case 'workplace':
        return (
          <WorkplaceGallerySection
            key="workplace"
            workplace={homepage.workplace}
            animationSettings={animationSettings}
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        );
      case 'leadership':
        return (
          <ProfileShowcaseSection
            key="leadership"
            id="leadership"
            section={homepage.leadership}
            variant="leadership"
            tinted={false}
            animationSettings={animationSettings}
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        );
      case 'team':
        return (
          <ProfileShowcaseSection
            key="team"
            id="our-team"
            section={homepage.team}
            variant="team"
            tinted={false}
            animationSettings={animationSettings}
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        );
      case 'whatWeDo':
        return (
          <WhatWeDoSection
            key="whatWeDo"
            whatWeDo={homepage.whatWeDo}
            animationSettings={animationSettings}
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        );
      case 'values':
        return (
          <ValuesSection
            key="values"
            values={homepage.values}
            animationSettings={animationSettings}
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        );
      case 'callToAction':
        return (
          <CtaSection
            key="callToAction"
            callToAction={homepage.callToAction}
            animationSettings={animationSettings}
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        );
      default:
        return null;
    }
  };

  const animClassNames = [
    animationSettings.scrollRevealEnabled === false ? 'hp-scroll-reveal-off' : '',
    animationSettings.imageHoverEnabled === false ? 'hp-image-hover-off' : '',
    animationSettings.galleryParallaxEnabled === false ? 'hp-gallery-parallax-off' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`hp-root ${isPreview ? 'hp-root--preview' : ''} ${
        forceMobile ? 'hp-root--forced-mobile' : ''
      } ${animClassNames}`}
    >
      {order.map(renderSection)}
      <ContinueToProductsTrigger isPreview={isPreview} />
    </div>
  );
}
