import React from 'react';
import HeroMorphSection from './HeroMorphSection';
import AboutSection from './AboutSection';
import WorkplaceGallerySection from './WorkplaceGallerySection';
import ProfileShowcaseSection from './ProfileShowcaseSection';
import WhatWeDoSection from './WhatWeDoSection';
import ValuesSection from './ValuesSection';
import CtaSection from './CtaSection';
import ContinueToProductsTrigger from './ContinueToProductsTrigger';

const DEFAULT_ORDER = [
  'about',
  'workplace',
  'leadership',
  'team',
  'whatWeDo',
  'values',
  'callToAction'
];

export default function HomepageContentRenderer({
  homepage,
  isPreview = false,
  forceMobile = false
}) {
  if (!homepage) return null;

  const order =
    Array.isArray(homepage.sectionOrder) && homepage.sectionOrder.length > 0
      ? homepage.sectionOrder
      : DEFAULT_ORDER;

  const renderSection = (key) => {
    switch (key) {
      case 'about':
        return (
          <AboutSection
            key="about"
            about={homepage.about}
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        );
      case 'workplace':
        return (
          <WorkplaceGallerySection
            key="workplace"
            workplace={homepage.workplace}
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
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        );
      case 'whatWeDo':
        return (
          <WhatWeDoSection
            key="whatWeDo"
            whatWeDo={homepage.whatWeDo}
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        );
      case 'values':
        return (
          <ValuesSection
            key="values"
            values={homepage.values}
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        );
      case 'callToAction':
        return (
          <CtaSection
            key="callToAction"
            callToAction={homepage.callToAction}
            isPreview={isPreview}
            forceMobile={forceMobile}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`hp-root ${isPreview ? 'hp-root--preview' : ''} ${
        forceMobile ? 'hp-root--forced-mobile' : ''
      }`}
    >
      <HeroMorphSection
        hero={homepage.hero}
        isPreview={isPreview}
        forceMobile={forceMobile}
      />
      {order.map(renderSection)}
      <ContinueToProductsTrigger isPreview={isPreview} />
    </div>
  );
}
