const mongoose = require('mongoose');

const phoneEntrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    countryCode: { type: String, default: '+91', trim: true },
    number: { type: String, required: true, trim: true },
    purpose: { type: String, default: '', trim: true },
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    showOnContactPage: { type: Boolean, default: true },
    showInFooter: { type: Boolean, default: true },
    enableClickToCall: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 1 }
  },
  { _id: false }
);

const whatsappEntrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    number: { type: String, required: true, trim: true },
    department: { type: String, default: '', trim: true },
    prefilledMessage: { type: String, default: '', trim: true },
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    enableFloatingButton: { type: Boolean, default: true },
    showOnContactPage: { type: Boolean, default: true },
    showInFooter: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 1 }
  },
  { _id: false }
);

const emailEntrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    department: { type: String, default: '', trim: true },
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    showOnContactPage: { type: Boolean, default: true },
    showInFooter: { type: Boolean, default: true },
    enableMailto: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 1 }
  },
  { _id: false }
);

const addressEntrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    officeName: { type: String, required: true, trim: true },
    officeType: {
      type: String,
      default: 'Head Office',
      trim: true
    },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: '', trim: true },
    area: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, default: '', trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true },
    googleMapsUrl: { type: String, default: '', trim: true },
    mapEmbedUrl: { type: String, default: '', trim: true },
    coordinates: {
      lat: { type: Number, default: 13.0458 },
      lng: { type: Number, default: 80.1472 }
    },
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    showOnContactPage: { type: Boolean, default: true },
    showInFooter: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 1 }
  },
  { _id: false }
);

const workingHoursSchema = new mongoose.Schema(
  {
    workingDays: { type: String, default: 'Monday – Saturday', trim: true },
    openingTime: { type: String, default: '9:00 AM', trim: true },
    closingTime: { type: String, default: '6:30 PM', trim: true },
    specialDays: {
      type: String,
      default: 'Sunday: Closed / Emergency Hospital Dispatch',
      trim: true
    },
    holidays: {
      type: String,
      default: 'Closed on Public & National Holidays',
      trim: true
    },
    temporaryClosureMessage: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true }
  },
  { _id: false }
);

const registrationEntrySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    displayLocation: {
      type: String,
      enum: ['both', 'contact_page', 'footer'],
      default: 'both'
    },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 1 }
  },
  { _id: false }
);

const socialLinkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    platform: {
      type: String,
      enum: ['linkedin', 'instagram', 'facebook', 'youtube', 'x', 'whatsapp', 'custom'],
      default: 'linkedin'
    },
    label: { type: String, required: true, trim: true },
    url: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 1 }
  },
  { _id: false }
);

const officeImageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: '', trim: true },
    alt: { type: String, default: '', trim: true },
    caption: { type: String, default: '', trim: true },
    isPrimary: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 1 }
  },
  { _id: false }
);

const actorSchema = new mongoose.Schema(
  {
    id: { type: String, default: '' },
    name: { type: String, default: 'Admin' },
    email: { type: String, default: '' }
  },
  { _id: false }
);

const contactInformationSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      unique: true,
      default: 'corporate_contact_info',
      index: true
    },
    companyName: {
      type: String,
      default: 'Sriyas Healthcare Private Limited',
      trim: true
    },
    tagline: {
      type: String,
      default: 'Empowering Healthcare with Care and Innovation.',
      trim: true
    },
    phones: {
      type: [phoneEntrySchema],
      default: () => []
    },
    whatsapps: {
      type: [whatsappEntrySchema],
      default: () => []
    },
    emails: {
      type: [emailEntrySchema],
      default: () => []
    },
    addresses: {
      type: [addressEntrySchema],
      default: () => []
    },
    workingHours: {
      type: workingHoursSchema,
      default: () => ({})
    },
    registrations: {
      type: [registrationEntrySchema],
      default: () => []
    },
    socialLinks: {
      type: [socialLinkSchema],
      default: () => []
    },
    officeImages: {
      type: [officeImageSchema],
      default: () => []
    },
    googleMapsUrl: {
      type: String,
      default: 'https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw',
      trim: true
    },
    mapCoordinates: {
      lat: { type: Number, default: 13.0458 },
      lng: { type: Number, default: 80.1472 }
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

module.exports = mongoose.model('ContactInformation', contactInformationSchema);
