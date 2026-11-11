const HomepageContent = require('../models/HomepageContent');

const CANONICAL_SECTION_ORDER = [
  'about',
  'whatWeDo',
  'founders',
  'productCategories',
  'partners',
  'whyChooseUs',
  'callToAction'
];

function createDefaultHomepagePayload() {
  return {
    hero: {
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
    },
    about: {
      enabled: true,
      eyebrow: 'About Sriyas Healthcare',
      heading: 'Empowering Healthcare Through Innovation',
      introduction:
        'Sriyas Healthcare Private Limited is an authorized healthcare distributor based in Chennai, dedicated to supplying advanced surgical sutures, topical tissue adhesives, surgical meshes, infection-management wound care solutions, and biomaterials to hospitals and clinicians across India.',
      supportingText:
        'Working alongside globally respected medical device manufacturers, we bridge surgical innovation with dependable institutional access so operating theatres and clinical care teams receive reliable, specialty-grade medical products.',
      vision:
        'To serve as a trusted partner for healthcare providers across India by making precision surgical and clinical technologies consistently accessible.',
      mission:
        'To represent world-class manufacturers with integrity, support medical professionals with dedicated service, and uphold care, trust, and innovation in every clinical interaction.',
      layoutPreset: 'split-collage',
      images: [
        {
          id: 'about-office-1',
          url: '/assets/contact/storefront-location.jpg',
          publicId: '',
          caption: 'Sriyas Healthcare Pvt. Ltd. — Chennai Facility',
          size: 'primary',
          displayOrder: 1
        },
        {
          id: 'about-clinical-2',
          url: '/assets/categories/cat-peters-synthetic-absorbable-sutures.png',
          publicId: '',
          caption: 'Precision Surgical Closure Portfolio',
          size: 'secondary',
          displayOrder: 2
        }
      ]
    },
    whatWeDo: {
      enabled: true,
      eyebrow: 'What We Do',
      heading: 'Specialized Surgical & Medical Distribution',
      subtitle:
        'Delivering clinical-grade surgical consumables, advanced wound care, and biomaterial solutions tailored to operating rooms and specialty care teams.',
      items: [
        {
          id: 'wwd-sutures',
          title: 'Surgical Sutures & Closure Systems',
          description:
            'Comprehensive range of absorbable, non-absorbable, barbed knotless sutures, titanium haemostatic clips, and obstetrics surgical kits.',
          icon: '🪡',
          image: {
            url: '/assets/categories/cat-peters-synthetic-absorbable-sutures.png',
            publicId: '',
            alt: 'Surgical Sutures and Closure Systems'
          },
          linkUrl: '/products/peters',
          displayOrder: 1,
          isActive: true
        },
        {
          id: 'wwd-adhesives',
          title: 'Topical Skin Adhesives & Mesh Fixation',
          description:
            'Fast, sterile cyanoacrylate skin closure adhesives and laparoscopic atraumatic hernia mesh fixation systems.',
          icon: '💉',
          image: {
            url: '/assets/categories/cat-liquiband-topical-skin-adhesive.png',
            publicId: '',
            alt: 'Topical Skin Adhesives and Mesh Fixation'
          },
          linkUrl: '/products/liquiband',
          displayOrder: 2,
          isActive: true
        },
        {
          id: 'wwd-woundcare',
          title: 'Antimicrobial & Infection-Management Wound Care',
          description:
            'Physical DACC-technology wound dressings and equine collagen haemostatic sponges supporting wound healing and infection protection.',
          icon: '🩹',
          image: {
            url: '/assets/categories/cat-cutimed-wound-care-infection-management.png',
            publicId: '',
            alt: 'Infection-Management Wound Care'
          },
          linkUrl: '/products/cutimed',
          displayOrder: 3,
          isActive: true
        },
        {
          id: 'wwd-biomaterials',
          title: 'Bioabsorbable Tissue Reinforcement & Biomaterials',
          description:
            'Biocompatible scaffolds and intraperitoneal biomaterials supporting soft tissue repair and complex abdominal wall reconstruction.',
          icon: '🧬',
          image: {
            url: '/assets/categories/cat-gore-absorbable-biomaterials-tissue-reinforcement.png',
            publicId: '',
            alt: 'Bioabsorbable Biomaterials'
          },
          linkUrl: '/products/gore',
          displayOrder: 4,
          isActive: true
        }
      ]
    },
    founders: {
      enabled: true,
      eyebrow: 'Founders & Leadership',
      heading: 'Leadership Guided by Purpose',
      subtitle:
        'Meet the leadership guiding Sriyas Healthcare with operational discipline, clinical respect, and long-term partner relationships.',
      items: []
    },
    productCategories: {
      enabled: true,
      eyebrow: 'Healthcare Solutions',
      heading: 'Clinical & Surgical Solutions Portfolio',
      subtitle:
        'Explore specialized medical device categories curated from our manufacturing partners.',
      selectedCategoryIds: [],
      maxDisplay: 8,
      ctaText: 'Explore Product Catalogue',
      ctaLink: '/products'
    },
    partners: {
      enabled: true,
      eyebrow: 'Global Alliances',
      heading: 'Our Manufacturer Partners',
      subtitle:
        'We collaborate directly with specialized surgical and biomaterials manufacturers trusted by healthcare institutions worldwide.',
      selectedBrandIds: [],
      ctaText: 'Explore All Partners',
      ctaLink: '/products'
    },
    whyChooseUs: {
      enabled: true,
      eyebrow: 'Why Choose Sriyas',
      heading: 'Built Around Clinical Reliability',
      subtitle:
        'Every product line and institutional supply engagement reflects our core values of Care, Trust, and Innovation.',
      items: [
        {
          id: 'wcu-partnerships',
          title: 'Authorized Manufacturer Alliances',
          description:
            'Direct distribution partnerships with internationally recognized surgical and medical device brands ensuring authentic supply.',
          icon: '🤝',
          displayOrder: 1,
          isActive: true
        },
        {
          id: 'wcu-portfolio',
          title: 'Focused Specialty Portfolio',
          description:
            'Purpose-curated portfolio spanning surgical sutures, haemostasis, tissue adhesives, wound management, and biomaterials.',
          icon: '🔬',
          displayOrder: 2,
          isActive: true
        },
        {
          id: 'wcu-clinicians',
          title: 'Commitment to Healthcare Teams',
          description:
            'Dedicated product coordination and responsive assistance for surgeons, operating room staff, and hospital procurement teams.',
          icon: '🏥',
          displayOrder: 3,
          isActive: true
        },
        {
          id: 'wcu-integrity',
          title: 'Care, Trust & Responsive Service',
          description:
            'Transparent communication, licensed medical distribution practices, and attentive regional supply support.',
          icon: '✦',
          displayOrder: 4,
          isActive: true
        }
      ]
    },
    callToAction: {
      enabled: true,
      eyebrow: 'Connect With Sriyas',
      heading: "Let's Build Better Healthcare Together.",
      supportingText:
        'Connect with Sriyas Healthcare to explore our surgical and healthcare product portfolio or discuss institutional supply requirements.',
      primaryButtonText: 'Explore Products',
      primaryButtonLink: '/products',
      secondaryButtonText: 'Contact Us',
      secondaryButtonLink: '/contact'
    },
    sectionOrder: [...CANONICAL_SECTION_ORDER]
  };
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

async function ensureHomepageInitialized() {
  let doc = await HomepageContent.findOne({ singletonKey: 'main_homepage' });
  if (!doc) {
    const initial = createDefaultHomepagePayload();
    doc = await HomepageContent.create({
      singletonKey: 'main_homepage',
      draft: deepClone(initial),
      published: deepClone(initial),
      draftVersion: 1,
      publishedVersion: 1,
      hasUnpublishedChanges: false,
      lastPublishedAt: new Date(),
      lastPublishedBy: { name: 'System Seed' },
      updatedBy: { name: 'System Seed' }
    });
  }
  return doc;
}

module.exports = {
  CANONICAL_SECTION_ORDER,
  createDefaultHomepagePayload,
  ensureHomepageInitialized,
  deepClone
};

