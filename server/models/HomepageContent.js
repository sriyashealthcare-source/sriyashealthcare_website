const mongoose = require('mongoose');

const mediaRefSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, default: '' },
    publicId: { type: String, trim: true, default: '' },
    alt: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const aboutImageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    url: { type: String, trim: true, default: '' },
    publicId: { type: String, trim: true, default: '' },
    caption: { type: String, trim: true, default: '' },
    size: {
      type: String,
      enum: ['primary', 'secondary', 'accent'],
      default: 'primary'
    },
    displayOrder: { type: Number, default: 0 }
  },
  { _id: false }
);

const whatWeDoItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    icon: { type: String, trim: true, default: '🩺' },
    image: { type: mediaRefSchema, default: () => ({ url: '', publicId: '', alt: '' }) },
    linkUrl: { type: String, trim: true, default: '/products' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { _id: false }
);

const founderItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    designation: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    photo: { type: mediaRefSchema, default: () => ({ url: '', publicId: '', alt: '' }) },
    linkedinUrl: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { _id: false }
);

const whyChooseItemSchema = new mongoose.Schema(
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
      companyName: { type: String, trim: true, default: 'SRIYAS' },
      companySubtitle: { type: String, trim: true, default: 'HEALTHCARE PVT LTD' },
      tagline: { type: String, trim: true, default: 'Empowering Healthcare with Care and Innovation' },
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
        default: () => ({ url: '/assets/logos/sriyas-emblem.png', publicId: '', alt: 'Sriyas Healthcare Emblem' })
      }
    },
    about: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: 'About Sriyas Healthcare' },
      heading: { type: String, trim: true, default: 'Empowering Healthcare Through Innovation' },
      introduction: { type: String, trim: true, default: '' },
      supportingText: { type: String, trim: true, default: '' },
      vision: { type: String, trim: true, default: '' },
      mission: { type: String, trim: true, default: '' },
      layoutPreset: {
        type: String,
        enum: ['split-collage', 'editorial-stacked', 'centered-feature'],
        default: 'split-collage'
      },
      images: { type: [aboutImageSchema], default: [] }
    },
    whatWeDo: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: 'What We Do' },
      heading: { type: String, trim: true, default: 'Surgical & Clinical Supply Expertise' },
      subtitle: { type: String, trim: true, default: '' },
      items: { type: [whatWeDoItemSchema], default: [] }
    },
    founders: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: 'Founders & Leadership' },
      heading: { type: String, trim: true, default: 'Leadership Dedicated to Clinical Trust' },
      subtitle: { type: String, trim: true, default: '' },
      items: { type: [founderItemSchema], default: [] }
    },
    productCategories: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: 'Healthcare Solutions' },
      heading: { type: String, trim: true, default: 'Our Product Categories' },
      subtitle: { type: String, trim: true, default: '' },
      selectedCategoryIds: { type: [String], default: [] },
      maxDisplay: { type: Number, default: 8 },
      ctaText: { type: String, trim: true, default: 'Explore Product Catalogue' },
      ctaLink: { type: String, trim: true, default: '/products' }
    },
    partners: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: 'Global Manufacturer Alliances' },
      heading: { type: String, trim: true, default: 'Our Trusted Partners' },
      subtitle: { type: String, trim: true, default: '' },
      selectedBrandIds: { type: [String], default: [] },
      ctaText: { type: String, trim: true, default: 'Explore All Partners' },
      ctaLink: { type: String, trim: true, default: '/products' }
    },
    whyChooseUs: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: 'Our Commitment' },
      heading: { type: String, trim: true, default: 'Why Choose Sriyas Healthcare' },
      subtitle: { type: String, trim: true, default: '' },
      items: { type: [whyChooseItemSchema], default: [] }
    },
    callToAction: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, trim: true, default: 'Connect With Us' },
      heading: { type: String, trim: true, default: "Let's Build Better Healthcare Together." },
      supportingText: {
        type: String,
        trim: true,
        default: 'Connect with Sriyas Healthcare to explore our surgical and healthcare product portfolio.'
      },
      primaryButtonText: { type: String, trim: true, default: 'Explore Products' },
      primaryButtonLink: { type: String, trim: true, default: '/products' },
      secondaryButtonText: { type: String, trim: true, default: 'Contact Us' },
      secondaryButtonLink: { type: String, trim: true, default: '/contact' }
    },
    sectionOrder: {
      type: [String],
      default: [
        'about',
        'whatWeDo',
        'founders',
        'productCategories',
        'partners',
        'whyChooseUs',
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

