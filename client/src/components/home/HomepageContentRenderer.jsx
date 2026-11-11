import React from 'react';
import HeroMorphSection from './HeroMorphSection';
import AboutSection from './AboutSection';
import WhatWeDoSection from './WhatWeDoSection';
import FoundersSection from './FoundersSection';
import SolutionsSection from './SolutionsSection';
import PartnersSection from './PartnersSection';
import WhyChooseUsSection from './WhyChooseUsSection';
import CtaSection from './CtaSection';

const DEFAULT_ORDER = [
  'about',
  'whatWeDo',
  'founders',
  'productCategories',
  'partners',
  'whyChooseUs',
  'callToAction'
];

export default function HomepageContentRenderer({ homepage, isPreview = false }) {
  if (!homepage) return null;

  const order =
    Array.isArray(homepage.sectionOrder) && homepage.sectionOrder.length > 0
      ? homepage.sectionOrder
      : DEFAULT_ORDER;

  const renderSection = (key) => {
    switch (key) {
      case 'about':
        return <AboutSection key="about" about={homepage.about} isPreview={isPreview} />;
      case 'whatWeDo':
        return <WhatWeDoSection key="whatWeDo" whatWeDo={homepage.whatWeDo} isPreview={isPreview} />;
      case 'founders':
        return <FoundersSection key="founders" founders={homepage.founders} isPreview={isPreview} />;
      case 'productCategories':
        return (
          <SolutionsSection
            key="productCategories"
            productCategories={homepage.productCategories}
            resolvedCategories={homepage.resolvedCategories}
            isPreview={isPreview}
          />
        );
      case 'partners':
        return (
          <PartnersSection
            key="partners"
            partners={homepage.partners}
            resolvedPartners={homepage.resolvedPartners}
            isPreview={isPreview}
          />
        );
      case 'whyChooseUs':
        return (
          <WhyChooseUsSection
            key="whyChooseUs"
            whyChooseUs={homepage.whyChooseUs}
            isPreview={isPreview}
          />
        );
      case 'callToAction':
        return (
          <CtaSection
            key="callToAction"
            callToAction={homepage.callToAction}
            isPreview={isPreview}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`hp-root ${isPreview ? 'hp-root--preview' : ''}`}>
      <HeroMorphSection hero={homepage.hero} isPreview={isPreview} />
      {order.map(renderSection)}
    </div>
  );
}

