import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { homepageService } from '../../services/homepageService';
import HomepageContentRenderer from '../../components/home/HomepageContentRenderer';
import SeoHead from '../../components/common/SeoHead';
import { SRIYAS_EMBLEM_URL } from '../../utils/cloudinaryAssets';
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
    url: SRIYAS_EMBLEM_URL,
    publicId: 'sriyas-healthcare/general/sriyas-emblem',
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
  const location = useLocation();
  const isAboutRoute = location.pathname === '/about';

  useEffect(() => {
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

  // Handle smooth scroll when navigating to /about or with #about-sriyas hash
  useEffect(() => {
    if (isAboutRoute || location.hash === '#about-sriyas') {
      const timer = setTimeout(() => {
        const el = document.getElementById('about-sriyas');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isAboutRoute, location.hash, loading]);

  const seoData = homepage?.seo || {};
  const pageTitle = isAboutRoute
    ? 'About Sriyas Healthcare | Advanced Surgical Solutions Chennai'
    : seoData.title ||
      'Sriyas Healthcare | Surgical Products & Medical Device Distributor in Chennai, India';
  const pageDesc = isAboutRoute
    ? 'Learn about Sriyas Healthcare Private Limited — our mission, leadership, values, and dedication to supplying hospitals with world-class surgical devices.'
    : seoData.description ||
      'Sriyas Healthcare Private Limited is a Chennai-based healthcare distributor supplying surgical sutures, medical devices, tissue adhesives, surgical meshes and wound care solutions across India.';
  const canonicalUrl = isAboutRoute
    ? 'https://sriyashealthcare.com/about'
    : seoData.canonicalUrl || 'https://sriyashealthcare.com';

  const homeSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://sriyashealthcare.com/#organization',
      name: 'Sriyas Healthcare Private Limited',
      alternateName: 'Sriyas Healthcare',
      url: 'https://sriyashealthcare.com',
      logo: SRIYAS_EMBLEM_URL,
      description:
        'Premier surgical products and medical device distribution company based in Chennai, India, supplying sutures, surgical meshes, tissue adhesives, and advanced wound care solutions.',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Plot No.53A, First Floor, East Facing, Oil Mill Road, Maruthi Nagar, Karambakkam, Thundalam',
        addressLocality: 'Chennai',
        addressRegion: 'Tamil Nadu',
        postalCode: '600077',
        addressCountry: 'IN'
      },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+91-9600804456',
          contactType: 'sales & customer support',
          areaServed: 'IN',
          availableLanguage: ['en', 'ta']
        },
        {
          '@type': 'ContactPoint',
          telephone: '+91-9367772801',
          contactType: 'hospital procurement enquiry',
          areaServed: 'IN',
          availableLanguage: ['en', 'ta']
        }
      ],
      email: 'Sriyashealthcare@gmail.com',
      taxID: '33ABQCS4744P1ZJ'
    },
    {
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'WholesaleStore'],
      '@id': 'https://sriyashealthcare.com/#localbusiness',
      name: 'Sriyas Healthcare Private Limited',
      image: SRIYAS_EMBLEM_URL,
      url: 'https://sriyashealthcare.com',
      telephone: '+919600804456',
      priceRange: '$$',
      description:
        'Authorized distributor of world-class surgical sutures, tissue adhesives, hernia meshes, and wound care devices in Chennai, Tamil Nadu, India.',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Plot No.53A, First Floor, East Facing, Oil Mill Road, Maruthi Nagar, Karambakkam, Thundalam',
        addressLocality: 'Chennai',
        addressRegion: 'Tamil Nadu',
        postalCode: '600077',
        addressCountry: 'IN'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '13.0458',
        longitude: '80.1472'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': 'https://sriyashealthcare.com/#website',
      url: 'https://sriyashealthcare.com',
      name: 'Sriyas Healthcare',
      description: 'Surgical Products & Medical Device Distributor in Chennai, India',
      publisher: {
        '@id': 'https://sriyashealthcare.com/#organization'
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://sriyashealthcare.com/products?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    }
  ];

  return (
    <>
      <SeoHead
        title={pageTitle}
        description={pageDesc}
        canonicalUrl={canonicalUrl}
        ogImage={seoData.ogImage || SRIYAS_EMBLEM_URL}
        ogType="website"
        noindex={seoData.robotsIndex === false}
        schema={homeSchemas}
      />
      <HomepageContentRenderer
        homepage={homepage || { hero: BASELINE_HERO, sectionOrder: [] }}
      />
    </>
  );
}
