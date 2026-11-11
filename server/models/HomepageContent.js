const mongoose = require('mongoose');

const mediaRefSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, default: '' },
    publicId: { type: String, trim: true, default: '' },
    mobileUrl: { type: String, trim: true, default: '' },
    mobilePublicId: { type: String, trim: true, default: '' },
    alt: { type: String, trim: true, default: '' },
    focalPoint: { type: String, trim: true, default: 'center center' },
    aspectRatio: { type: String, trim: true, default: 'auto' }
  },
  { _id: false }
);

const aboutImageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    url: { type: String, trim: true, default: '' },
    publicId: { type: String, trim: true, default: '' },
    mobileUrl: { type: String, trim: true, default: '' },
    mobilePublicId: { type: String, trim: true, default: '' },
    alt: { type: String, trim: true, default: '' },
    caption: { type: String, trim: true, default: '' },
    focalPoint: { type: String, trim: true, default: 'center center' },
    aspectRatio: { type: String, trim: true, default: 'auto' },
    size: {
      type: String,
      enum: ['primary', 'secondary', 'accent'],
      default: 'primary'
    },
    displayOrder: { type: Number, default: 0 }
  },
  { _id: false }
);

const workplaceImageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    url: { type: String, trim: true, default: '' },
    publicId: { type: String, trim: true, default: '' },
    mobileUrl: { type: String, trim: true, default: '' },
    mobilePublicId: { type: String, trim: true, default: '' },
    alt: { type: String, trim: true, default: '' },
    title: { type: String, trim: true, default: '' },
    caption: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'Workplace' },
    focalPoint: { type: String, trim: true, default: 'center center' },
    aspectRatio: { type: String, trim: true, default: 'auto' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { _id: false }
);

const profileItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    designation: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    photo: { type: mediaRefSchema, default: () => ({}) },
    linkedinUrl: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { _id: false }
);

const whatWeDoItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    icon: { type: String, trim: true, default: '🩺' },
    image: { type: mediaRefSchema, default: () => ({}) },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { _id: false }
);

const valueItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    icon: { type: String, trim: true, default: '✦' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { _id: false }
);

const homepageSnapshotSchema = new mongoose.Schema(
  {
    hero: {
      companyName: { type: String, trim: true, default: 'SRIYAS HEALTHCARE' },
      companySubtitle: { type: String, trim: true, default: 'PVT LTD' },
      tagline: { type: String, trim: true, default: 'Empowering Healthcare with Care and Innovation.' },
      supportingIntro: {
        type: String,
        trim: true,
        default:
          'Authorized medical and surgical distribution partner based in Chennai, serving clinicians and hospitals with trusted healthcare technologies.'
      },
      valuesText: { type: String, trim: true, default: 'CARE · TRUST · INNOVATION' },
      ctaText: { type: String, trim: true, default: 'Explore Sriyas' },
      ctaLink: { type: String, trim: true, default: '#about-sriyas' },
      secondaryCtaText: { type: String, trim: true, default: 'Explore Products' },
      secondaryCtaLink: { type: String, trim: true, default: '/products' },
      showTagline: { type: Boolean, default: true },
      showValues: { type: Boolean, default: true },
      showSecondaryCta: { type: Boolean, default: true },
      logo: {
        type: mediaRefSchema,
        default: () => ({ url: '/assets/logos/sriyas-emblem.png', alt: 'Sriyas Healthcare Emblem' })
      },
      backgroundImage: {
        type: mediaRefSchema,
        default: () => ({})
      }
    },
    about: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: 'About Sriyas Healthcare' },
      heading: { type: String, trim: true, default: 'Empowering Healthcare Through Dedication & Partnership' },
      introduction: { type: String, trim: true, default: '' },
      supportingText: { type: String, trim: true, default: '' },
      hospitalCommitment: { type: String, trim: true, default: '' },
      vision: { type: String, trim: true, default: '' },
      mission: { type: String, trim: true, default: '' },
      layoutPreset: {
        type: String,
        enum: ['split-collage', 'editorial-stacked', 'centered-feature'],
        default: 'split-collage'
      },
      images: { type: [aboutImageSchema], default: [] }
    },
    workplace: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: 'Our Company & Workplace' },
      heading: { type: String, trim: true, default: 'Inside Sriyas Healthcare' },
      subtitle: { type: String, trim: true, default: '' },
      layoutStyle: {
        type: String,
        enum: ['editorial-collage', 'gallery-grid'],
        default: 'editorial-collage'
      },
      images: { type: [workplaceImageSchema], default: [] }
    },
    leadership: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: 'Leadership & Governance' },
      heading: { type: String, trim: true, default: 'Founders & Directors' },
      subtitle: { type: String, trim: true, default: '' },
      items: { type: [profileItemSchema], default: [] }
    },
    team: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: 'Our People' },
      heading: { type: String, trim: true, default: 'Our Dedicated Team' },
      subtitle: { type: String, trim: true, default: '' },
      items: { type: [profileItemSchema], default: [] }
    },
    whatWeDo: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: 'What We Do' },
      heading: { type: String, trim: true, default: 'Capabilities Built Around Clinical Care' },
      subtitle: { type: String, trim: true, default: '' },
      items: { type: [whatWeDoItemSchema], default: [] }
    },
    values: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: 'Our Values · Why Choose Us' },
      heading: { type: String, trim: true, default: 'Why Choose Sriyas Healthcare' },
      subtitle: { type: String, trim: true, default: '' },
      featureImage: { type: mediaRefSchema, default: () => ({}) },
      items: { type: [valueItemSchema], default: [] }
    },
    callToAction: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: 'Partner With Us' },
      heading: { type: String, trim: true, default: 'Partnering for Better Healthcare.' },
      supportingText: { type: String, trim: true, default: '' },
      primaryButtonText: { type: String, trim: true, default: 'Explore Our Products' },
      primaryButtonLink: { type: String, trim: true, default: '/products' },
      secondaryButtonText: { type: String, trim: true, default: 'Contact Us' },
      secondaryButtonLink: { type: String, trim: true, default: '/contact' },
      showContactDetails: { type: Boolean, default: true },
      contactPhone: { type: String, trim: true, default: '+91 96008 04456 · +91 93677 72801' },
      contactEmail: { type: String, trim: true, default: 'Sriyashealthcare@gmail.com' },
      contactAddress: {
        type: String,
        trim: true,
        default:
          'Plot No.53A, First Floor, East Facing, Oil Mill Road, Maruthi Nagar, Karambakkam, Thundalam, Chennai - 600077'
      },
      backgroundImage: { type: mediaRefSchema, default: () => ({}) }
    },
    sectionOrder: {
      type: [String],
      default: [
        'about',
        'workplace',
        'leadership',
        'team',
        'whatWeDo',
        'values',
        'callToAction'
      ]
    }
  },
  { _id: false }
);

const actorSchema = new mongoose.Schema(
  {
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  { _id: false }
);

const homepageContentSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      unique: true,
      default: 'main_homepage',
      index: true
    },
    draft: {
      type: homepageSnapshotSchema,
      required: true
    },
    published: {
      type: homepageSnapshotSchema,
      required: true
    },
    draftVersion: {
      type: Number,
      default: 1
    },
    publishedVersion: {
      type: Number,
      default: 1
    },
    hasUnpublishedChanges: {
      type: Boolean,
      default: false
    },
    lastPublishedAt: {
      type: Date,
      default: Date.now
    },
    lastPublishedBy: {
      type: actorSchema,
      default: () => ({})
    },
    updatedBy: {
      type: actorSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('HomepageContent', homepageContentSchema);
