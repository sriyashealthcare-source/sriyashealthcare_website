const HomepageContent = require('../models/HomepageContent');

const CANONICAL_SECTION_ORDER = [
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

function createDefaultHomepagePayload() {
  return {
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
        url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048213/sriyas-healthcare/general/sriyas-emblem.png',
        publicId: 'sriyas-healthcare/general/sriyas-emblem',
        mobileUrl: '',
        mobilePublicId: '',
        alt: 'Sriyas Healthcare Pvt Ltd Emblem',
        focalPoint: 'center center',
        aspectRatio: 'auto'
      },
      backgroundImage: {
        url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795106414/sriyas-healthcare/general/file_dmyw9r.jpg',
        publicId: 'sriyas-healthcare/general/file_dmyw9r',
        mobileUrl: '',
        mobilePublicId: '',
        alt: 'Sriyas Healthcare leadership and global partner delegation',
        focalPoint: 'center center',
        aspectRatio: '16/9'
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
          mobileUrl: '',
          mobilePublicId: '',
          alt: 'Clinical coordination and surgical device delivery outside operating theatre',
          caption: 'Operating Room Clinical Liaison & Surgical Device Support',
          focalPoint: 'center center',
          aspectRatio: '4/3',
          size: 'primary',
          displayOrder: 1
        },
        {
          id: 'about-hospital-corridor',
          url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107356/sriyas-healthcare/general/file_vncy1o.jpg',
          publicId: 'sriyas-healthcare/general/file_vncy1o',
          mobileUrl: '',
          mobilePublicId: '',
          alt: 'Hospital sterile surgical scrub suite coordination',
          caption: 'Hospital Clinical Presence & Surgical Support',
          focalPoint: 'center center',
          aspectRatio: '16/9',
          size: 'secondary',
          displayOrder: 2
        }
      ]
    },
    statistics: {
      enabled: true,
      eyebrow: 'Key Milestones & Healthcare Reach',
      heading: 'Delivering Dependability at Scale',
      subtitle:
        'Verified distribution metrics and milestones supporting healthcare institutions across India.',
      items: []
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
          photo: {
            url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795110797/sriyas-healthcare/general/file_rqtbl6.jpg',
            publicId: 'sriyas-healthcare/general/file_rqtbl6',
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'M. Ravikumar, Founder & Managing Director of Sriyas Healthcare Pvt. Ltd.',
            focalPoint: 'center top',
            aspectRatio: '3/4'
          },
          linkedinUrl: '',
          email: 'sriyashealthcare@gmail.com',
          displayOrder: 1,
          isActive: true
        },
        {
          id: 'leader-operations-directorate',
          name: 'Corporate & Clinical Operations',
          designation: 'Directorate of Institutional Partnerships',
          bio: 'Directing strategic brand relationships, hospital supply contracts, regulatory standards, and cold-chain logistics across institutional healthcare networks.',
          photo: {
            url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795107209/sriyas-healthcare/general/file_tzsxap.jpg',
            publicId: 'sriyas-healthcare/general/file_tzsxap',
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'Sriyas Healthcare Directorate of Institutional Partnerships',
            focalPoint: 'center top',
            aspectRatio: '3/4'
          },
          linkedinUrl: '',
          email: 'sriyashealthcare@gmail.com',
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
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'ANUSREE R - Administrative Secretary at Sriyas Healthcare',
            focalPoint: 'center top',
            aspectRatio: '3/4'
          },
          linkedinUrl: '',
          email: 'sriyashealthcare@gmail.com',
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
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'SWETHA G - Clinical Specialist at Sriyas Healthcare',
            focalPoint: 'center top',
            aspectRatio: '3/4'
          },
          linkedinUrl: '',
          email: 'sriyashealthcare@gmail.com',
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
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'RAHUL S - Clinical Specialist at Sriyas Healthcare',
            focalPoint: 'center top',
            aspectRatio: '3/4'
          },
          linkedinUrl: '',
          email: 'sriyashealthcare@gmail.com',
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
        'Serving as an authorized, dependable bridge between global healthcare manufacturers and hospital operating rooms across India.',
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
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'Specialized surgical distribution and operating room supply',
            focalPoint: 'center center',
            aspectRatio: '16/9'
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
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'Authorized manufacturer representation and healthcare alliances',
            focalPoint: 'center center',
            aspectRatio: '16/9'
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
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'Surgical closure technologies and advanced wound care',
            focalPoint: 'center center',
            aspectRatio: '16/9'
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
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'Hernia repair and biomaterials solutions',
            focalPoint: 'center center',
            aspectRatio: '16/9'
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
            mobileUrl: '',
            mobilePublicId: '',
            alt: 'Hospital procurement coordination and clinical dispatch',
            focalPoint: 'center center',
            aspectRatio: '16/9'
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
        mobileUrl: '',
        mobilePublicId: '',
        alt: 'Sriyas Healthcare clinical education and values in practice',
        focalPoint: 'center center',
        aspectRatio: '4/3'
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
      contactPhone: '+91 96008 04456',
      contactEmail: 'sriyashealthcare@gmail.com',
      contactAddress:
        'Plot No.53A, First Floor, East Facing, Oil Mill Road, Maruthi Nagar, Karambakkam, Thundalam, Chennai - 600077',
      backgroundImage: {
        url: 'https://res.cloudinary.com/pgjzw0zu/image/upload/v1795048243/sriyas-healthcare/banners/cta-backdrop.jpg',
        publicId: 'sriyas-healthcare/banners/cta-backdrop',
        mobileUrl: '',
        mobilePublicId: '',
        alt: 'Gold and obsidian architectural backdrop',
        focalPoint: 'center center',
        aspectRatio: '16/9'
      }
    },
    animationSettings: {
      scrollRevealEnabled: true,
      galleryParallaxEnabled: true,
      imageHoverEnabled: true,
      counterAnimationEnabled: true
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
    return deepClone(defaults);
  }

  const out = deepClone(snapshot);

  for (const key of CANONICAL_SECTION_ORDER) {
    if (!out[key] && defaults[key]) {
      out[key] = deepClone(defaults[key]);
    }
  }

  if (out.hero) {
    if (!out.hero.companyName) out.hero.companyName = defaults.hero.companyName;
    if (!out.hero.companySubtitle) out.hero.companySubtitle = defaults.hero.companySubtitle;
    if (!out.hero.logo?.url) out.hero.logo = defaults.hero.logo;
  }

  if (out.about) {
    if (!out.about.heading) out.about.heading = defaults.about.heading;
    if (!Array.isArray(out.about.images) || out.about.images.length === 0) {
      out.about.images = defaults.about.images;
    }
  }

  if (out.workplace) {
    if (!out.workplace.heading) out.workplace.heading = defaults.workplace.heading;
    if (!Array.isArray(out.workplace.images) || out.workplace.images.length === 0) {
      out.workplace.images = defaults.workplace.images;
    }
  }

  if (out.leadership) {
    if (!out.leadership.heading) out.leadership.heading = defaults.leadership.heading;
    if (!Array.isArray(out.leadership.items) || out.leadership.items.length === 0) {
      out.leadership.items = defaults.leadership.items;
    }
  }

  if (out.team) {
    if (!out.team.heading) out.team.heading = defaults.team.heading;
    if (!Array.isArray(out.team.items) || out.team.items.length === 0) {
      out.team.items = defaults.team.items;
    }
  }

  if (out.whatWeDo) {
    if (!out.whatWeDo.heading) out.whatWeDo.heading = defaults.whatWeDo.heading;
    if (!Array.isArray(out.whatWeDo.items) || out.whatWeDo.items.length === 0) {
      out.whatWeDo.items = defaults.whatWeDo.items;
    }
  }

  if (out.values) {
    if (!out.values.heading) out.values.heading = defaults.values.heading;
    if (!Array.isArray(out.values.items) || out.values.items.length === 0) {
      out.values.items = defaults.values.items;
    }
  }

  if (out.callToAction) {
    if (!out.callToAction.heading) out.callToAction.heading = defaults.callToAction.heading;
    out.callToAction.showContactDetails = true;
    out.callToAction.contactPhone = defaults.callToAction.contactPhone;
    out.callToAction.contactEmail = defaults.callToAction.contactEmail;
    out.callToAction.contactAddress = defaults.callToAction.contactAddress;
  }

  if (!out.statistics) {
    out.statistics = defaults.statistics;
  }
  if (!out.animationSettings) {
    out.animationSettings = defaults.animationSettings;
  }
  if (!Array.isArray(out.sectionOrder)) {
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
    if (
      !plain.published?.workplace ||
      !plain.draft?.workplace ||
      !plain.published?.leadership ||
      !plain.published?.statistics ||
      !plain.published?.animationSettings
    ) {
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
