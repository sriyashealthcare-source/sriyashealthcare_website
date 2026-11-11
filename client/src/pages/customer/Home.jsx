import React, { useState, useEffect } from 'react';
import { homepageService } from '../../services/homepageService';
import { productService } from '../../services/productService';
import HomepageContentRenderer from '../../components/home/HomepageContentRenderer';
import '../../styles/homepage.css';

const BASELINE_HERO = {
  companyName: 'SRIYAS',
  companySubtitle: 'HEALTHCARE PVT LTD',
  tagline: 'Empowering Healthcare with Care and Innovation',
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
  }
};

export default function Home() {
  const [homepage, setHomepage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    document.title = 'Sriyas Healthcare Pvt Ltd — Surgical & Healthcare Solutions';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content =
        'Sriyas Healthcare Private Limited is an authorized surgical and medical healthcare distributor based in Chennai supplying surgical sutures, topical adhesives, wound management, and biomaterials across India.';
    }

    let active = true;

    async function loadHomepage() {
      try {
        const res = await homepageService.getPublicHomepage();
        if (active && res?.homepage) {
          setHomepage(res.homepage);
          setFallbackMode(false);
        }
      } catch (err) {
        // Fallback: preserve baseline Hero + live partner/category showcase if API fails temporarily
        try {
          const [brandsRes, catsRes] = await Promise.all([
            productService.getPublicBrands(),
            productService.getPublicCategories()
          ]);
          if (active) {
            setHomepage({
              hero: BASELINE_HERO,
              partners: {
                enabled: true,
                eyebrow: 'Global Alliances',
                heading: 'Our Manufacturer Partners',
                subtitle:
                  'Authorized distribution partnerships with globally recognized surgical and clinical brands.',
                ctaText: 'Explore All Partners',
                ctaLink: '/products'
              },
              productCategories: {
                enabled: true,
                eyebrow: 'Healthcare Solutions',
                heading: 'Clinical & Surgical Solutions Portfolio',
                subtitle: 'Explore specialized medical device categories across our partners.',
                ctaText: 'Explore Product Catalogue',
                ctaLink: '/products'
              },
              callToAction: {
                enabled: true,
                eyebrow: 'Connect With Sriyas',
                heading: "Let's Build Better Healthcare Together.",
                supportingText:
                  'Connect with Sriyas Healthcare to explore our surgical and healthcare product portfolio.',
                primaryButtonText: 'Explore Products',
                primaryButtonLink: '/products',
                secondaryButtonText: 'Contact Us',
                secondaryButtonLink: '/contact'
              },
              sectionOrder: ['productCategories', 'partners', 'callToAction'],
              resolvedBrands: brandsRes?.brands || [],
              resolvedPartners: brandsRes?.brands || [],
              resolvedCategories: catsRes?.categories || []
            });
            setFallbackMode(true);
          }
        } catch (_) {
          if (active) {
            setHomepage({ hero: BASELINE_HERO, sectionOrder: [] });
            setFallbackMode(true);
          }
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

  return (
    <div data-fallback={fallbackMode ? 'true' : 'false'}>
      <HomepageContentRenderer homepage={homepage || { hero: BASELINE_HERO, sectionOrder: [] }} />
    </div>
  );
}
