const HomepageContent = require('../models/HomepageContent');

const CANONICAL_SECTION_ORDER = [
  'about',
  'workplace',
  'leadership',
  'team',
  'whatWeDo',
  'values',
  'callToAction'
];

function createDefaultHomepagePayload() {
  return {
    hero: {
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
        mobileUrl: '',
        mobilePublicId: '',
        alt: 'Sriyas Healthcare Pvt Ltd Emblem',
        focalPoint: 'center center',
        aspectRatio: 'auto'
      },
      backgroundImage: {
        url: '',
        publicId: '',
        mobileUrl: '',
        mobilePublicId: '',
        alt: 'Sriyas Healthcare architectural background',
        focalPoint: 'center center',
        aspectRatio: 'auto'
      }
    },
    about: {
      enabled: true,
      eyebrow: 'About Sriyas Healthcare',
      heading: 'Empowering Healthcare Through Care & Partnership',
      introduction:
        'Sriyas Healthcare Private Limited is an authorized surgical and medical device distribution company based in Chennai, Tamil Nadu, dedicated to connecting healthcare institutions and clinicians across India with dependable medical solutions.',
      supportingText:
        'We partner closely with globally respected healthcare manufacturers to coordinate supply across operating rooms, surgical specialties, and acute-care departments.',
      hospitalCommitment:
        'Our focus rests on responsive institutional service, transparent communication, and dependable coordination so hospital procurement teams and clinicians can focus on patient care.',
      vision:
        'To serve as a trusted partner for hospitals and healthcare providers by making advanced surgical and clinical care technologies consistently accessible.',
      mission:
        'To represent respected healthcare manufacturers with integrity, deliver attentive service to medical professionals, and uphold Care, Trust, and Innovation in every interaction.',
      layoutPreset: 'split-collage',
      images: [
        {
          id: 'about-office-facade',
          url: '/assets/contact/storefront-location.jpg',
          publicId: '',
          mobileUrl: '',
          mobilePublicId: '',
          alt: 'Sriyas Healthcare Chennai facility storefront',
          caption: 'Sriyas Healthcare Pvt. Ltd. — Chennai Operations',
          focalPoint: 'center center',
          aspectRatio: '4/3',
          size: 'primary',
          displayOrder: 1
        },
        {
          id: 'about-office-interior-ph',
          url: '/assets/placeholders/office-reception-placeholder.jpg',
          publicId: '',
          mobileUrl: '',
          mobilePublicId: '',
          alt: 'Corporate healthcare reception concept placeholder',
          caption: 'Workplace Concept (Placeholder — Replace in Admin)',
          focalPoint: 'center center',
          aspectRatio: '16/9',
          size: 'secondary',
          displayOrder: 2
        }
      ]
    },
    workplace: {
      enabled: true,
      eyebrow: 'Our Company & Workplace',
      heading: 'Where Clinical Coordination Takes Shape',
      subtitle:
        'Take a look inside our corporate environment, workspace, and day-to-day operations supporting hospital partners. (Temporary placeholders shown until updated in Admin.)',
      layoutStyle: 'editorial-collage',
      images: [
        {
          id: 'wp-reception',
          url: '/assets/placeholders/office-reception-placeholder.jpg',
          publicId: '',
          mobileUrl: '',
          mobilePublicId: '',
          alt: 'Modern corporate reception placeholder',
          title: 'Corporate Reception & Welcome Lounge',
          caption: 'Office & Reception Environment (Placeholder — Editable in Admin)',
          category: 'Office',
          focalPoint: 'center center',
          aspectRatio: '16/9',
          displayOrder: 1,
          isActive: true
        },
        {
          id: 'wp-collab',
          url: '/assets/placeholders/workplace-workspace-placeholder.jpg',
          publicId: '',
          mobileUrl: '',
          mobilePublicId: '',
          alt: 'Healthcare coordination meeting space placeholder',
          title: 'Team Coordination & Partner Discussions',
          caption: 'Collaborative Workspace (Placeholder — Editable in Admin)',
          category: 'Workplace',
          focalPoint: 'center center',
          aspectRatio: '16/9',
          displayOrder: 2,
          isActive: true
        },
        {
          id: 'wp-ops',
          url: '/assets/placeholders/healthcare-operations-placeholder.jpg',
          publicId: '',
          mobileUrl: '',
          mobilePublicId: '',
          alt: 'Medical distribution operations placeholder',
          title: 'Supply Coordination & Logistics Focus',
          caption: 'Business & Supply Operations (Placeholder — Editable in Admin)',
          category: 'Business Activity',
          focalPoint: 'center center',
          aspectRatio: '4/3',
          displayOrder: 3,
          isActive: true
        }
      ]
    },
    leadership: {
      enabled: true,
      eyebrow: 'Leadership & Governance',
      heading: 'Founders & Directors',
      subtitle:
        'Guiding Sriyas Healthcare with principled governance, long-term partner relationships, and commitment to clinical communities. (Update real names, portraits, and bios in Admin.)',
      items: [
        {
          id: 'leader-founder-ph',
          name: 'Founder & Managing Director (Profile Pending)',
          designation: 'Founder & Managing Director',
          bio: 'Profile details and official executive biography can be added directly from the Admin Homepage Editor.',
          photo: {
            url: '/assets/placeholders/portrait-leadership-placeholder.svg',
            publicId: '',
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'Founder and Managing Director placeholder portrait',
            focalPoint: 'center top',
            aspectRatio: '1/1'
          },
          linkedinUrl: '',
          email: '',
          displayOrder: 1,
          isActive: true
        },
        {
          id: 'leader-director-ph',
          name: 'Director — Operations & Supply (Profile Pending)',
          designation: 'Director',
          bio: 'Leadership profile biography and portrait photograph can be uploaded and published via Admin Website Management.',
          photo: {
            url: '/assets/placeholders/portrait-leadership-placeholder.svg',
            publicId: '',
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'Company Director placeholder portrait',
            focalPoint: 'center top',
            aspectRatio: '1/1'
          },
          linkedinUrl: '',
          email: '',
          displayOrder: 2,
          isActive: true
        }
      ]
    },
    team: {
      enabled: true,
      eyebrow: 'Our People',
      heading: 'Hospital Support & Operations Team',
      subtitle:
        'Dedicated specialists collaborating across hospital liaison, logistics coordination, and clinician assistance. (Placeholder entries ready for customization.)',
      items: [
        {
          id: 'team-coord-ph',
          name: 'Clinical Product Coordination (Placeholder)',
          designation: 'Clinical Liaison Specialist',
          bio: 'Update this profile with your team member name, portrait, and clinical coordination summary.',
          photo: {
            url: '/assets/placeholders/portrait-team-placeholder.svg',
            publicId: '',
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'Team member placeholder portrait',
            focalPoint: 'center top',
            aspectRatio: '1/1'
          },
          linkedinUrl: '',
          email: '',
          displayOrder: 1,
          isActive: true
        },
        {
          id: 'team-hospital-ph',
          name: 'Hospital & Institutional Support (Placeholder)',
          designation: 'Customer & Account Relations',
          bio: 'Replace with actual staff profile photo and biography from the Homepage Editor Team section.',
          photo: {
            url: '/assets/placeholders/portrait-team-placeholder.svg',
            publicId: '',
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'Team member placeholder portrait',
            focalPoint: 'center top',
            aspectRatio: '1/1'
          },
          linkedinUrl: '',
          email: '',
          displayOrder: 2,
          isActive: true
        },
        {
          id: 'team-logistics-ph',
          name: 'Supply & Quality Logistics (Placeholder)',
          designation: 'Distribution & Compliance Support',
          bio: 'Editable team profile slot covering operational coordination and institutional supply fulfillment.',
          photo: {
            url: '/assets/placeholders/portrait-team-placeholder.svg',
            publicId: '',
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'Team member placeholder portrait',
            focalPoint: 'center top',
            aspectRatio: '1/1'
          },
          linkedinUrl: '',
          email: '',
          displayOrder: 3,
          isActive: true
        }
      ]
    },
    whatWeDo: {
      enabled: true,
      eyebrow: 'What We Do',
      heading: 'Focused Capabilities in Medical & Surgical Supply',
      subtitle:
        'We operate as a dedicated bridge between respected medical device manufacturers and institutional healthcare teams.',
      items: [
        {
          id: 'wwd-distribution',
          title: 'Specialized Surgical & Medical Distribution',
          description:
            'Streamlined institutional sourcing and reliable fulfillment for operating theatres, surgical wards, and specialized care centers.',
          icon: '🏥',
          image: {
            url: '',
            publicId: '',
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'Specialized surgical distribution',
            focalPoint: 'center center',
            aspectRatio: '16/9'
          },
          displayOrder: 1,
          isActive: true
        },
        {
          id: 'wwd-partnerships',
          title: 'Healthcare Manufacturer Partnerships',
          description:
            'Authorized collaboration with specialized global manufacturers to represent authentic product portfolios with integrity.',
          icon: '🤝',
          image: { url: '', publicId: '', mobileUrl: '', mobilePublicId: '', alt: '', focalPoint: 'center center', aspectRatio: '16/9' },
          displayOrder: 2,
          isActive: true
        },
        {
          id: 'wwd-clinical-supply',
          title: 'Surgical & Clinical Product Supply',
          description:
            'Consistent institutional availability across surgical closure technologies, wound management dressings, and clinical consumables.',
          icon: '🩺',
          image: { url: '', publicId: '', mobileUrl: '', mobilePublicId: '', alt: '', focalPoint: 'center center', aspectRatio: '16/9' },
          displayOrder: 3,
          isActive: true
        },
        {
          id: 'wwd-clinician-support',
          title: 'Hospital & Clinician Support',
          description:
            'Attentive responsiveness to hospital procurement departments, operating room nursing coordinators, and clinical specialists.',
          icon: '📋',
          image: { url: '', publicId: '', mobileUrl: '', mobilePublicId: '', alt: '', focalPoint: 'center center', aspectRatio: '16/9' },
          displayOrder: 4,
          isActive: true
        },
        {
          id: 'wwd-coordination',
          title: 'Product Coordination & Customer Assistance',
          description:
            'Clear inquiry turnaround, specification coordination, and helpful institutional support from request to delivery.',
          icon: '✦',
          image: { url: '', publicId: '', mobileUrl: '', mobilePublicId: '', alt: '', focalPoint: 'center center', aspectRatio: '16/9' },
          displayOrder: 5,
          isActive: true
        }
      ]
    },
    values: {
      enabled: true,
      eyebrow: 'Our Values · Why Choose Sriyas',
      heading: 'Why Healthcare Institutions Choose Sriyas',
      subtitle:
        'Every engagement reflects our founding principles of Care, Trust, and Innovation alongside transparent service.',
      featureImage: {
        url: '/assets/placeholders/healthcare-operations-placeholder.jpg',
        publicId: '',
        mobileUrl: '',
        mobilePublicId: '',
        alt: 'Medical operations coordination placeholder',
        focalPoint: 'center center',
        aspectRatio: '4/3'
      },
      items: [
        {
          id: 'val-authorized',
          title: 'Authorized Manufacturer Relationships',
          description:
            'Direct partnerships with established medical and surgical brands ensuring genuine product provenance.',
          icon: '🤝',
          displayOrder: 1,
          isActive: true
        },
        {
          id: 'val-authenticity',
          title: 'Quality & Authenticity',
          description:
            'Strict adherence to authentic, manufacturer-backed medical supplies handled through licensed pharmaceutical distribution practices.',
          icon: '✓',
          displayOrder: 2,
          isActive: true
        },
        {
          id: 'val-care-trust',
          title: 'Care & Trust',
          description:
            'Built around respect for patients and clinical teams, honoring commitments with transparency and accountability.',
          icon: '💛',
          displayOrder: 3,
          isActive: true
        },
        {
          id: 'val-reliable',
          title: 'Reliable Institutional Service',
          description:
            'Dependable regional supply coordination supporting planned surgeries and ongoing clinical demand.',
          icon: '🚚',
          displayOrder: 4,
          isActive: true
        },
        {
          id: 'val-support',
          title: 'Professional Healthcare Support',
          description:
            'Helpful assistance on product enquiries, technical documentation, and institutional quotation requests.',
          icon: '🩺',
          displayOrder: 5,
          isActive: true
        },
        {
          id: 'val-relationships',
          title: 'Long-Term Hospital Partnerships',
          description:
            'Focused on enduring relationships with hospitals, surgical clinics, and healthcare professionals across India.',
          icon: '🏛️',
          displayOrder: 6,
          isActive: true
        }
      ]
    },
    callToAction: {
      enabled: true,
      eyebrow: 'Connect With Sriyas Healthcare',
      heading: 'Partnering for Better Healthcare.',
      supportingText:
        'Connect with our Chennai team to discuss hospital supply requirements, institutional enquiries, or explore our complete surgical partner portfolio.',
      primaryButtonText: 'Explore Our Products',
      primaryButtonLink: '/products',
      secondaryButtonText: 'Contact Us',
      secondaryButtonLink: '/contact',
      showContactDetails: true,
      contactPhone: '+91 96008 04456 · +91 93677 72801',
      contactEmail: 'Sriyashealthcare@gmail.com',
      contactAddress:
        'Plot No.53A, First Floor, East Facing, Oil Mill Road, Maruthi Nagar, Karambakkam, Thundalam, Chennai - 600077',
      backgroundImage: {
        url: '/assets/placeholders/cta-backdrop-placeholder.jpg',
        publicId: '',
        mobileUrl: '',
        mobilePublicId: '',
        alt: 'Gold and obsidian architectural backdrop placeholder',
        focalPoint: 'center center',
        aspectRatio: '16/9'
      }
    },
    sectionOrder: [...CANONICAL_SECTION_ORDER]
  };
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function upgradeLegacySnapshotIfNeeded(snapshot) {
  const defaults = createDefaultHomepagePayload();
  if (!snapshot || typeof snapshot !== 'object') {
    return defaults;
  }

  const out = deepClone(snapshot);
  const needsUpgrade = !out.workplace || !out.leadership || !out.team || !out.values;

  if (needsUpgrade) {
    // Migrate previous single-brand string 'SRIYAS' + 'HEALTHCARE PVT LTD' cleanly
    if (out.hero && out.hero.companyName === 'SRIYAS' && out.hero.companySubtitle === 'HEALTHCARE PVT LTD') {
      out.hero.companyName = defaults.hero.companyName;
      out.hero.companySubtitle = defaults.hero.companySubtitle;
    }
    if (out.hero && !out.hero.supportingIntro) {
      out.hero.supportingIntro = defaults.hero.supportingIntro;
    }
    if (out.hero && !out.hero.backgroundImage) {
      out.hero.backgroundImage = defaults.hero.backgroundImage;
    }
    if (out.about && !out.about.hospitalCommitment) {
      out.about.hospitalCommitment = defaults.about.hospitalCommitment;
    }
    if (!out.workplace) {
      out.workplace = defaults.workplace;
    }
    if (!out.leadership) {
      const legacyFounders = Array.isArray(out.founders?.items) ? out.founders.items : [];
      out.leadership = legacyFounders.length > 0
        ? {
            enabled: out.founders?.enabled !== false,
            eyebrow: out.founders?.eyebrow || defaults.leadership.eyebrow,
            heading: out.founders?.heading || defaults.leadership.heading,
            subtitle: out.founders?.subtitle || defaults.leadership.subtitle,
            items: legacyFounders
          }
        : defaults.leadership;
    }
    if (!out.team) {
      out.team = defaults.team;
    }
    if (!out.values) {
      out.values = out.whyChooseUs && Array.isArray(out.whyChooseUs.items) && out.whyChooseUs.items.length > 0
        ? {
            enabled: out.whyChooseUs.enabled !== false,
            eyebrow: defaults.values.eyebrow,
            heading: defaults.values.heading,
            subtitle: out.whyChooseUs.subtitle || defaults.values.subtitle,
            featureImage: defaults.values.featureImage,
            items: defaults.values.items
          }
        : defaults.values;
    }
    if (out.callToAction && !out.callToAction.backgroundImage) {
      out.callToAction.heading = defaults.callToAction.heading;
      out.callToAction.showContactDetails = true;
      out.callToAction.contactPhone = defaults.callToAction.contactPhone;
      out.callToAction.contactEmail = defaults.callToAction.contactEmail;
      out.callToAction.contactAddress = defaults.callToAction.contactAddress;
      out.callToAction.backgroundImage = defaults.callToAction.backgroundImage;
    }
    out.sectionOrder = [...CANONICAL_SECTION_ORDER];
  }

  return out;
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
  } else {
    const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    if (!plain.published?.workplace || !plain.draft?.workplace || !plain.published?.leadership) {
      const nextDraft = upgradeLegacySnapshotIfNeeded(plain.draft);
      const nextPublished = upgradeLegacySnapshotIfNeeded(plain.published);
      doc = await HomepageContent.findOneAndUpdate(
        { singletonKey: 'main_homepage' },
        {
          $set: {
            draft: nextDraft,
            published: nextPublished
          }
        },
        { new: true }
      );
    }
  }
  return doc;
}

module.exports = {
  CANONICAL_SECTION_ORDER,
  createDefaultHomepagePayload,
  upgradeLegacySnapshotIfNeeded,
  ensureHomepageInitialized,
  deepClone
};
