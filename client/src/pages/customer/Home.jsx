import React, { useState, useEffect } from 'react';
import { homepageService } from '../../services/homepageService';
import HomepageContentRenderer from '../../components/home/HomepageContentRenderer';
import '../../styles/homepage.css';

const BASELINE_HERO = {
  companyName: 'SRIYAS HEALTHCARE',
  companySubtitle: 'PVT LTD',
  tagline: 'Empowering Healthcare with Care and Innovation.',
  supportingIntro:
    'An authorized healthcare distributor headquartered in Chennai, supporting hospitals, surgeons, and clinical teams with trusted surgical and medical technologies.',
  valuesText: 'CARE · TRUST · INNOVATION',
  ctaText: 'Explore Sriyas',
  ctaLink: '#about-sriyas',
  secondaryCtaText: 'Explore Products',
  secondaryCtaLink: '/products',
  showTagline: true,
  showValues: true,
  showSecondaryCta: true,
  logo: {
    url: '/assets/logos/sriyas-emblem.png',
    publicId: '',
    alt: 'Sriyas Healthcare Pvt Ltd Emblem'
  },
  backgroundImage: {
    url: '',
    publicId: '',
    alt: ''
  }
};

export default function Home() {
  const [homepage, setHomepage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Sriyas Healthcare Pvt Ltd — Surgical & Healthcare Solutions';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content =
        'Sriyas Healthcare Private Limited is an authorized surgical and medical distribution partner based in Chennai, serving hospitals and clinicians across India.';
    }

    let active = true;

    async function loadHomepage() {
      try {
        const res = await homepageService.getPublicHomepage();
        if (active && res?.homepage) {
          setHomepage(res.homepage);
        }
      } catch (_) {
        if (active) {
          setHomepage({
            hero: BASELINE_HERO,
            callToAction: {
              enabled: true,
              eyebrow: 'Connect With Sriyas Healthcare',
              heading: 'Partnering for Better Healthcare.',
              supportingText:
                'Connect with our Chennai team to discuss hospital supply requirements or explore our global surgical partner portfolio.',
              primaryButtonText: 'Explore Our Products',
              primaryButtonLink: '/products',
              secondaryButtonText: 'Contact Us',
              secondaryButtonLink: '/contact',
              showContactDetails: true,
              contactPhone: '+91 96008 04456 · +91 93677 72801',
              contactEmail: 'Sriyashealthcare@gmail.com',
              contactAddress:
                'Plot No.53A, First Floor, East Facing, Oil Mill Road, Maruthi Nagar, Karambakkam, Thundalam, Chennai - 600077'
            },
            sectionOrder: ['callToAction']
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHomepage();

    return () => {
      active = false;
    };
  }, []);

  if (loading && !homepage) {
    return (
      <HomepageContentRenderer
        homepage={{
          hero: BASELINE_HERO,
          sectionOrder: []
        }}
      />
    );
  }

  return <HomepageContentRenderer homepage={homepage || { hero: BASELINE_HERO, sectionOrder: [] }} />;
}
