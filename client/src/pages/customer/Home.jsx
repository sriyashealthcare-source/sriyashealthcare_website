import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { homepageService } from '../../services/homepageService';
import HomepageContentRenderer from '../../components/home/HomepageContentRenderer';
import SeoHead from '../../components/common/SeoHead';
import { SRIYAS_EMBLEM_URL } from '../../utils/cloudinaryAssets';
import { COMPANY_CONTACT } from '../../constants/contact';
import '../../styles/homepage.css';

const FALLBACK_HOMEPAGE = {
  hero: {
    enabled: true,
    companyName: 'SRIYAS HEALTHCARE',
    companySubtitle: 'PVT LTD',
    tagline: 'Advancing Surgical Care Through Trusted Medical Technologies',
    supportingIntro:
      'An authorized healthcare distribution partner headquartered in Chennai, supplying hospitals, surgeons, and clinical teams across India with specialized surgical devices, wound closure technologies, and institutional healthcare solutions.',
    valuesText: 'CARE · TRUST · INNOVATION',
    ctaText: 'Explore Sriyas',
    ctaLink: '#about-sriyas',
    secondaryCtaText: 'View Products',
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
      url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106414/sriyas-healthcare/general/file_dmyw9r.jpg',
      publicId: 'sriyas-healthcare/general/file_dmyw9r',
      alt: 'Sriyas Healthcare leadership and global partner delegation'
    }
  },
  about: {
    enabled: true,
    eyebrow: 'About Sriyas Healthcare',
    heading: 'Connecting Clinical Excellence with Verified Medical Innovations',
    introduction:
      'Sriyas Healthcare Private Limited is an authorized healthcare and surgical distribution enterprise based in Chennai, Tamil Nadu. We specialize in the institutional supply of specialized surgical devices, biosurgical materials, and sterile wound management technologies across leading hospitals, operating rooms, and specialty healthcare institutions.',
    supportingText:
      'We collaborate directly with internationally respected medical manufacturers—including Peters Surgical, Advanced Medical Solutions (LiquiBand), Cutimed Sorbact, Genta-Coll, and W. L. Gore & Associates—ensuring genuine manufacturer provenance, complete batch traceability, and cold-chain compliance.',
    hospitalCommitment:
      'Our dedicated team provides on-ground hospital coordination, clinical product assistance, and responsive delivery so surgical faculties and procurement departments can focus entirely on patient care.',
    vision:
      'To be India\'s most trusted surgical distribution partner, making advanced clinical innovations consistently accessible to surgical teams and healthcare institutions.',
    mission:
      'To represent premier healthcare manufacturers with uncompromising integrity, maintain flawless supply-chain reliability, and uphold Care, Trust, and Innovation in every institutional engagement.',
    layoutPreset: 'split-collage',
    images: [
      {
        id: 'about-surgical-liaison',
        url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106727/sriyas-healthcare/general/file_cwsk2o.jpg',
        publicId: 'sriyas-healthcare/general/file_cwsk2o',
        alt: 'Clinical coordination and surgical device delivery outside operating theatre',
        caption: 'Operating Room Clinical Liaison & Surgical Device Support',
        displayOrder: 1
      },
      {
        id: 'about-hospital-corridor',
        url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107356/sriyas-healthcare/general/file_vncy1o.jpg',
        publicId: 'sriyas-healthcare/general/file_vncy1o',
        alt: 'Hospital sterile surgical scrub suite coordination',
        caption: 'Hospital Clinical Presence & Surgical Support',
        displayOrder: 2
      }
    ]
  },
  workplace: {
    enabled: true,
    eyebrow: 'OUR COMPANY IN ACTION',
    heading: 'Building Relationships Across the Healthcare Community',
    subtitle:
      'Explore moments from our professional engagements, clinical interactions, manufacturer collaborations and healthcare initiatives.',
    layoutStyle: 'editorial-carousel',
    images: [
      {
        id: 'wp-global-delegation',
        url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106414/sriyas-healthcare/general/file_dmyw9r.jpg',
        publicId: 'sriyas-healthcare/general/file_dmyw9r',
        title: 'Global Manufacturer Alliances & Corporate Delegation',
        caption: 'Sriyas Healthcare leadership and team alongside international medical technology partners and clinical delegates.',
        category: 'Partnerships',
        displayOrder: 1,
        isActive: true
      },
      {
        id: 'wp-live-surgery-cme',
        url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107290/sriyas-healthcare/general/file_lbhsyb.jpg',
        publicId: 'sriyas-healthcare/general/file_lbhsyb',
        title: 'Live Surgical Demonstrations & Clinical Workshops',
        caption: 'Supporting faculty demonstrations at prestigious clinical forums including FALS Hernia Chennai, MGM Healthcare, and IAGES.',
        category: 'Surgical Education',
        displayOrder: 2,
        isActive: true
      },
      {
        id: 'wp-medical-expo-booth',
        url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107307/sriyas-healthcare/general/file_a7kn4f.jpg',
        publicId: 'sriyas-healthcare/general/file_a7kn4f',
        title: 'National Healthcare Expos & Manufacturer Alliances',
        caption: 'Sriyas Healthcare executive team representing partner portfolios (Advanced Medical Solutions, Karl Storz Endoskope) at national medical congresses.',
        category: 'Industry Expos',
        displayOrder: 3,
        isActive: true
      },
      {
        id: 'wp-hernia-symposium',
        url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107405/sriyas-healthcare/general/file_i8s4ch.jpg',
        publicId: 'sriyas-healthcare/general/file_i8s4ch',
        title: 'Surgeon CME & Hernia Solutions Symposium',
        caption: 'Conducting procedure perspectives and clinical CME sessions on IPOM mesh solutions and tissue reinforcement technologies.',
        category: 'Clinical CME',
        displayOrder: 4,
        isActive: true
      },
      {
        id: 'wp-hospital-presentation',
        url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107100/sriyas-healthcare/general/file_xpe7i6.jpg',
        publicId: 'sriyas-healthcare/general/file_xpe7i6',
        title: 'Hospital Clinical Presentations & Surgeon Engagement',
        caption: 'Presenting surgical skin adhesives and wound closure solutions to surgical residents and faculty at leading hospitals including KMCH Department of General Surgery.',
        category: 'Hospital Training',
        displayOrder: 5,
        isActive: true
      },
      {
        id: 'wp-surgical-liaison',
        url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106727/sriyas-healthcare/general/file_cwsk2o.jpg',
        publicId: 'sriyas-healthcare/general/file_cwsk2o',
        title: 'Operating Room Clinical Liaison & Surgical Device Support',
        caption: 'Direct on-site clinical liaison providing emergency surgical stock availability and procedural device support outside the operating suite.',
        category: 'OR Support',
        displayOrder: 6,
        isActive: true
      },
      {
        id: 'wp-hospital-corridor',
        url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107356/sriyas-healthcare/general/file_vncy1o.jpg',
        publicId: 'sriyas-healthcare/general/file_vncy1o',
        title: 'Hospital Clinical Presence & Surgical Support',
        caption: 'Continuous sterile suite coordination and surgical consumable fulfillment across leading specialty hospital surgical departments.',
        category: 'Clinical Support',
        displayOrder: 7,
        isActive: true
      },
      {
        id: 'wp-clinical-training',
        url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106936/sriyas-healthcare/general/file_zgmlxn.jpg',
        publicId: 'sriyas-healthcare/general/file_zgmlxn',
        title: 'Clinical Education & Surgical Solutions Training',
        caption: 'Interactive procedural workshops and biosurgical product familiarization for surgical teams, resident faculties, and clinical specialists.',
        category: 'Surgical Training',
        displayOrder: 8,
        isActive: true
      }
    ]
  },
  leadership: {
    enabled: true,
    eyebrow: 'LEADERSHIP & GOVERNANCE',
    heading: 'Principled Leadership Committed to Healthcare Integrity',
    subtitle:
      'Our leadership brings together experience and commitment to building trusted relationships across the healthcare community.',
    items: [
      {
        id: 'leader-founder-md',
        name: 'M. Ravikumar',
        designation: 'Founder & Managing Director',
        bio: 'Guiding Sriyas Healthcare with a dedicated commitment to hospital supply excellence, institutional transparency, and trusted partnerships with global surgical pioneers.',
        email: 'sriyashealthcare@gmail.com',
        photo: {
          url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795110797/sriyas-healthcare/general/file_rqtbl6.jpg',
          publicId: 'sriyas-healthcare/general/file_rqtbl6',
          alt: 'M. Ravikumar, Founder & Managing Director of Sriyas Healthcare Pvt. Ltd.'
        },
        displayOrder: 1,
        isActive: true
      },
      {
        id: 'leader-operations-directorate',
        name: 'Corporate & Clinical Operations',
        designation: 'Directorate of Institutional Partnerships',
        bio: 'Directing strategic brand relationships, hospital supply contracts, regulatory standards, and cold-chain logistics across institutional healthcare networks.',
        email: 'sriyashealthcare@gmail.com',
        photo: {
          url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107209/sriyas-healthcare/general/file_tzsxap.jpg',
          publicId: 'sriyas-healthcare/general/file_tzsxap',
          alt: 'Sriyas Healthcare Directorate of Institutional Partnerships'
        },
        displayOrder: 2,
        isActive: true
      }
    ]
  },
  team: {
    enabled: true,
    eyebrow: 'Our People & Clinical Support',
    heading: 'Hospital-Dedicated Specialists Supporting Every Procedure',
    subtitle:
      'Our multidisciplinary team works seamlessly with hospital procurement managers, nursing coordinators, and surgical departments across India.',
    items: [
      {
        id: 'team-ot-support',
        name: 'ANUSREE R',
        designation: 'Administrative Secretary',
        bio: 'Facilitating on-site surgical product briefing, emergency theater stock availability, and procedural device readiness.',
        photo: {
          url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795262392/sriyas-healthcare/general/file_ayn1ew.jpg',
          publicId: 'sriyas-healthcare/general/file_ayn1ew',
          alt: 'ANUSREE R - Administrative Secretary at Sriyas Healthcare'
        },
        displayOrder: 1,
        isActive: true
      },
      {
        id: 'team-biomed-eng',
        name: 'SWETHA G',
        designation: 'Clinical Specialist',
        bio: 'Clinical Specialist who supports medical professionals, assists with clinical activities, and helps ensure quality patient care and smooth healthcare services.',
        photo: {
          url: '',
          publicId: '',
          alt: 'SWETHA G - Clinical Specialist at Sriyas Healthcare'
        },
        displayOrder: 2,
        isActive: true
      },
      {
        id: 'team-surgical-systems',
        name: 'RAHUL S',
        designation: 'Clinical Specialist',
        bio: 'Clinical Specialist with experience in supporting healthcare activities, assisting medical professionals, and ensuring smooth patient care and daily clinical operations.',
        photo: {
          url: '',
          publicId: '',
          alt: 'RAHUL S - Clinical Specialist at Sriyas Healthcare'
        },
        displayOrder: 3,
        isActive: true
      }
    ]
  },
  whatWeDo: {
    enabled: true,
    eyebrow: 'What We Do',
    heading: 'Focused Capabilities in Surgical & Medical Supply',
    subtitle:
      'Connecting healthcare institutions with specialised surgical products, clinical support and dependable distribution.',
    items: [
      {
        id: 'wwd-distribution',
        title: 'Specialized Surgical & Medical Distribution',
        description:
          'Providing streamlined institutional supply and dependable fulfillment for operating theatres, surgical wards, and trauma centers across healthcare networks.',
        icon: '🏥',
        image: {
          url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106727/sriyas-healthcare/general/file_cwsk2o.jpg',
          publicId: 'sriyas-healthcare/general/file_cwsk2o',
          alt: 'Specialized surgical distribution and operating room supply'
        },
        displayOrder: 1,
        isActive: true
      },
      {
        id: 'wwd-partnerships',
        title: 'Global Manufacturer Representation',
        description:
          'Direct authorized distributor partnerships with leading international brands ensuring authentic provenance, warranty backing, and official clinical documentation.',
        icon: '🤝',
        image: {
          url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107209/sriyas-healthcare/general/file_tzsxap.jpg',
          publicId: 'sriyas-healthcare/general/file_tzsxap',
          alt: 'Authorized manufacturer representation and healthcare alliances'
        },
        displayOrder: 2,
        isActive: true
      },
      {
        id: 'wwd-surgical-closure',
        title: 'Surgical Closure & Advanced Wound Care',
        description:
          'Comprehensive supply of barbed sutures, non-absorbable/absorbable sutures, topical microbial sealants, and antimicrobial dressings for surgical specialties.',
        icon: '🩺',
        image: {
          url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107290/sriyas-healthcare/general/file_lbhsyb.jpg',
          publicId: 'sriyas-healthcare/general/file_lbhsyb',
          alt: 'Surgical closure technologies and advanced wound care'
        },
        displayOrder: 3,
        isActive: true
      },
      {
        id: 'wwd-hernia-biomaterials',
        title: 'Hernia Repair & Biomaterials Solutions',
        description:
          'Supplying innovative biosynthetic meshes, IPOM hernia solutions, and laparoscopic fixation devices for general and gastrointestinal surgeons.',
        icon: '🔬',
        image: {
          url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107405/sriyas-healthcare/general/file_i8s4ch.jpg',
          publicId: 'sriyas-healthcare/general/file_i8s4ch',
          alt: 'Hernia repair and biomaterials solutions'
        },
        displayOrder: 4,
        isActive: true
      },
      {
        id: 'wwd-hospital-dispatch',
        title: 'Hospital Procurement & Emergency Dispatch',
        description:
          'Dedicated account coordination providing responsive quotation turnaround, batch traceability, and rapid emergency dispatch for acute clinical requirements.',
        icon: '🚚',
        image: {
          url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107100/sriyas-healthcare/general/file_xpe7i6.jpg',
          publicId: 'sriyas-healthcare/general/file_xpe7i6',
          alt: 'Hospital procurement coordination and clinical dispatch'
        },
        displayOrder: 5,
        isActive: true
      }
    ]
  },
  values: {
    enabled: true,
    eyebrow: 'Our Values & Commitment',
    heading: 'Why Healthcare Institutions Choose Sriyas',
    subtitle:
      'Every institutional interaction is rooted in our founding pillars of Care, Trust, and Innovation, supported by disciplined healthcare logistics.',
    featureImage: {
      url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106936/sriyas-healthcare/general/file_zgmlxn.jpg',
      publicId: 'sriyas-healthcare/general/file_zgmlxn',
      alt: 'Sriyas Healthcare clinical education and values in practice'
    },
    items: [
      {
        id: 'val-authorized',
        title: 'Authorized Direct Sourcing',
        description:
          'Direct distribution agreements with recognized medical pioneers guarantee 100% genuine products with manufacturer warranties.',
        icon: '🛡️',
        displayOrder: 1,
        isActive: true
      },
      {
        id: 'val-authenticity',
        title: 'Uncompromised Product Authenticity',
        description:
          'Strict adherence to pharmaceutical and medical device regulatory standards, maintaining cold-chain integrity and complete lot traceability.',
        icon: '✓',
        displayOrder: 2,
        isActive: true
      },
      {
        id: 'val-care-trust',
        title: 'Care & Trust at the Core',
        description:
          'We respect the clinical significance of every item we supply, honoring commitments with transparency, speed, and ethical diligence.',
        icon: '💛',
        displayOrder: 3,
        isActive: true
      },
      {
        id: 'val-reliable',
        title: 'Reliable Institutional Logistics',
        description:
          'Disciplined warehousing and dependable regional distribution supporting scheduled surgical procedures and urgent hospital demand.',
        icon: '🚚',
        displayOrder: 4,
        isActive: true
      },
      {
        id: 'val-knowledge',
        title: 'Clinical Product Knowledge',
        description:
          'In-depth product familiarity and technical assistance to aid hospital procurement committees and surgical coordinators.',
        icon: '🩺',
        displayOrder: 5,
        isActive: true
      },
      {
        id: 'val-partnerships',
        title: 'Enduring Healthcare Partnerships',
        description:
          'Building long-term, mutually supportive relationships with government hospitals, private healthcare groups, and surgical faculties.',
        icon: '🏛️',
        displayOrder: 6,
        isActive: true
      }
    ]
  },
  callToAction: {
    enabled: true,
    eyebrow: 'Connect With Sriyas Healthcare',
    heading: 'Partnering for Higher Standards in Healthcare Delivery',
    supportingText:
      'Connect with our Chennai team to discuss hospital supply contracts, request product specifications, or explore our complete authorized surgical portfolio.',
    primaryButtonText: 'Explore Our Products',
    primaryButtonLink: '/products',
    secondaryButtonText: 'Request Institutional Enquiry',
    secondaryButtonLink: '/contact',
    showContactDetails: true,
    contactPhone: COMPANY_CONTACT.displayPhone,
    contactEmail: COMPANY_CONTACT.email,
    contactAddress:
      'Plot No.53A, First Floor, East Facing, Oil Mill Road, Maruthi Nagar, Karambakkam, Thundalam, Chennai - 600077',
    backgroundImage: {
      url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048243/sriyas-healthcare/banners/cta-backdrop.jpg',
      publicId: 'sriyas-healthcare/banners/cta-backdrop'
    }
  },
  animationSettings: {
    scrollRevealEnabled: true,
    galleryParallaxEnabled: true,
    imageHoverEnabled: true,
    counterAnimationEnabled: true
  },
  sectionOrder: [
    'hero',
    'about',
    'workplace',
    'leadership',
    'team',
    'whatWeDo',
    'values',
    'callToAction'
  ]
};

export default function Home() {
  const [homepage, setHomepage] = useState(FALLBACK_HOMEPAGE);
  const [loading, setLoading] = useState(false);
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
          setHomepage(FALLBACK_HOMEPAGE);
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
          telephone: COMPANY_CONTACT.phone,
          contactType: 'sales & customer support',
          areaServed: 'IN',
          availableLanguage: ['en', 'ta']
        }
      ],
      email: COMPANY_CONTACT.email,
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
        homepage={homepage || FALLBACK_HOMEPAGE}
      />
    </>
  );
}
