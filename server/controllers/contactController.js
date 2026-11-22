const crypto = require('crypto');
const ContactInformation = require('../models/ContactInformation');
const {
  uploadBuffer,
  CLOUDINARY_FOLDERS
} = require('../config/cloudinary');

function makeItemId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function cleanText(val, fallback = '', maxLen = 500) {
  if (typeof val !== 'string') return fallback;
  return val.trim().slice(0, maxLen);
}

function cleanBool(val, fallback = true) {
  if (typeof val === 'boolean') return val;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return fallback;
}

function cleanUrl(val, fallback = '') {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (/^(javascript|vbscript|data):/i.test(trimmed)) {
    return fallback;
  }
  return trimmed.slice(0, 1000);
}

function createDefaultContactPayload() {
  return {
    singletonKey: 'corporate_contact_info',
    companyName: 'Sriyas Healthcare Private Limited',
    tagline: 'Empowering Healthcare with Care and Innovation.',
    phones: [
      {
        id: 'phone-main',
        label: 'Main Office',
        countryCode: '+91',
        number: '9600804456',
        purpose: 'General & Institutional Enquiries',
        isPrimary: true,
        isActive: true,
        showOnContactPage: true,
        showInFooter: true,
        enableClickToCall: true,
        displayOrder: 1
      },
      {
        id: 'phone-secondary',
        label: 'Main Office',
        countryCode: '+91',
        number: '9367772801',
        purpose: 'General Enquiries',
        isPrimary: false,
        isActive: true,
        showOnContactPage: true,
        showInFooter: true,
        enableClickToCall: true,
        displayOrder: 2
      }
    ],
    whatsapps: [
      {
        id: 'wa-main',
        label: 'Official WhatsApp Support',
        number: '919600804456',
        department: 'Healthcare Solutions & Product Assistance',
        prefilledMessage:
          'Hello Sriyas Healthcare Team, I visited your website and would like to know more about your products and services. Please assist me.',
        isPrimary: true,
        isActive: true,
        enableFloatingButton: true,
        showOnContactPage: true,
        showInFooter: false,
        displayOrder: 1
      }
    ],
    emails: [
      {
        id: 'email-main',
        label: 'General & Institutional Enquiries',
        email: 'sriyashealthcare@gmail.com',
        department: 'Healthcare Solutions & Supply',
        isPrimary: true,
        isActive: true,
        showOnContactPage: true,
        showInFooter: true,
        enableMailto: true,
        displayOrder: 1
      }
    ],
    addresses: [
      {
        id: 'addr-main',
        officeName: 'Corporate Office & Distribution Centre',
        officeType: 'Head Office',
        line1: 'Plot No.53A, First Floor, East Facing, Oil Mill Road',
        line2: 'Maruthi Nagar, Karambakkam, Thundalam',
        area: 'Maruthi Nagar, Karambakkam',
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600077',
        country: 'India',
        googleMapsUrl: 'https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw',
        mapEmbedUrl: '',
        coordinates: { lat: 13.0458, lng: 80.1472 },
        isPrimary: true,
        isActive: true,
        showOnContactPage: true,
        showInFooter: true,
        displayOrder: 1
      }
    ],
    workingHours: {
      workingDays: 'Monday – Saturday',
      openingTime: '9:00 AM',
      closingTime: '6:30 PM',
      specialDays: 'Sunday: Closed / Emergency Hospital Dispatch',
      holidays: 'Closed on Public & National Holidays',
      temporaryClosureMessage: '',
      isActive: true
    },
    registrations: [
      {
        id: 'reg-gstin',
        label: 'GSTIN',
        value: '33ABQCS4744P1ZJ',
        displayLocation: 'both',
        isActive: true,
        displayOrder: 1
      },
      {
        id: 'reg-dl-1',
        label: 'Drug Licence 1',
        value: 'TN/Z04/20B/01443',
        displayLocation: 'contact_page',
        isActive: true,
        displayOrder: 2
      },
      {
        id: 'reg-dl-2',
        label: 'Drug Licence 2',
        value: 'TN/Z04/21B/01443',
        displayLocation: 'contact_page',
        isActive: true,
        displayOrder: 3
      },
      {
        id: 'reg-dl',
        label: 'Drug Licence (DL) No',
        value: 'TN/Z04/20B/01443 & TN/Z04/21B/01443',
        displayLocation: 'contact_page',
        isActive: true,
        displayOrder: 4
      }
    ],
    socialLinks: [
      {
        id: 'soc-linkedin',
        platform: 'linkedin',
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/company/sriyas-healthcare',
        isActive: false,
        displayOrder: 1
      }
    ],
    officeImages: [
      {
        id: 'img-storefront',
        url: 'https://res.cloudinary.com/drdjtyyvn/image/upload/v1762518465/sriyas/office/storefront_location.jpg',
        publicId: 'sriyas/office/storefront_location',
        alt: 'Sriyas Healthcare storefront and registered office in Chennai',
        caption: 'Corporate Office & Medical Distribution Centre, Chennai',
        isPrimary: true,
        displayOrder: 1
      }
    ],
    googleMapsUrl: 'https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw',
    mapCoordinates: { lat: 13.0458, lng: 80.1472 },
    updatedBy: { id: '', name: 'System Seed', email: '' }
  };
}

async function ensureContactInfoInitialized() {
  let doc = await ContactInformation.findOne({ singletonKey: 'corporate_contact_info' });
  if (!doc) {
    const payload = createDefaultContactPayload();
    doc = await ContactInformation.create(payload);
  }
  return doc;
}

function toPlainObject(doc) {
  if (!doc) return {};
  if (typeof doc.toObject === 'function') {
    return doc.toObject();
  }
  return JSON.parse(JSON.stringify(doc));
}

/**
 * Enforces single primary constraint across an array of items.
 * If multiple items have isPrimary: true, the latest/last marked item takes precedence.
 * If no item is marked primary, the first item becomes primary.
 */
function enforceSinglePrimary(items) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const primaryIndices = [];
  items.forEach((item, idx) => {
    if (Boolean(item.isPrimary)) {
      primaryIndices.push(idx);
    }
  });

  // If multiple are marked primary, choose the last one; if none, default to 0
  const chosenIndex = primaryIndices.length > 0
    ? primaryIndices[primaryIndices.length - 1]
    : 0;

  return items.map((item, idx) => ({
    ...item,
    isPrimary: idx === chosenIndex
  }));
}

// GET /api/contact-information (Public)
const getPublicContactInfo = async (req, res, next) => {
  try {
    const doc = await ensureContactInfoInitialized();
    const raw = toPlainObject(doc);

    const phones = (raw.phones || [])
      .filter((p) => p.isActive !== false && p.number)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const whatsapps = (raw.whatsapps || [])
      .filter((w) => w.isActive !== false && w.number)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const emails = (raw.emails || [])
      .filter((e) => e.isActive !== false && e.email)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const addresses = (raw.addresses || [])
      .filter((a) => a.isActive !== false && a.line1)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const registrations = (raw.registrations || [])
      .filter((r) => r.isActive !== false && r.value)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const socialLinks = (raw.socialLinks || [])
      .filter((s) => s.isActive !== false && s.url)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const officeImages = (raw.officeImages || [])
      .filter((img) => Boolean(img.url))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const primaryPhone = phones.find((p) => p.isPrimary) || phones[0] || null;
    const primaryWhatsApp = whatsapps.find((w) => w.isPrimary) || whatsapps[0] || null;
    const primaryEmail = emails.find((e) => e.isPrimary) || emails[0] || null;
    const primaryAddress = addresses.find((a) => a.isPrimary) || addresses[0] || null;
    const primaryOfficeImage = officeImages.find((i) => i.isPrimary) || officeImages[0] || null;

    res.status(200).json({
      success: true,
      contact: {
        companyName: raw.companyName || 'Sriyas Healthcare Private Limited',
        tagline: raw.tagline || 'Empowering Healthcare with Care and Innovation.',
        phones,
        whatsapps,
        emails,
        addresses,
        workingHours: raw.workingHours || {},
        registrations,
        socialLinks,
        officeImages,
        primaryPhone,
        primaryWhatsApp,
        primaryEmail,
        primaryAddress,
        primaryOfficeImage,
        googleMapsUrl: raw.googleMapsUrl || 'https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw',
        mapCoordinates: raw.mapCoordinates || { lat: 13.0458, lng: 80.1472 },
        updatedAt: raw.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/contact-information (Admin Protected)
const getAdminContactInfo = async (req, res, next) => {
  try {
    const doc = await ensureContactInfoInitialized();
    const raw = toPlainObject(doc);

    res.status(200).json({
      success: true,
      contact: raw
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/contact-information (Admin Protected)
const updateAdminContactInfo = async (req, res, next) => {
  try {
    const incoming = req.body || {};
    const existing = await ensureContactInfoInitialized();

    // 1. Sanitize Phones
    let phones = [];
    if (Array.isArray(incoming.phones)) {
      phones = incoming.phones.map((p, idx) => ({
        id: cleanText(p.id) || makeItemId('phone'),
        label: cleanText(p.label, 'Office Phone', 80),
        countryCode: cleanText(p.countryCode, '+91', 10),
        number: cleanText(p.number, '', 30).replace(/[^0-9+]/g, ''),
        purpose: cleanText(p.purpose, '', 120),
        isPrimary: cleanBool(p.isPrimary, false),
        isActive: cleanBool(p.isActive, true),
        showOnContactPage: cleanBool(p.showOnContactPage, true),
        showInFooter: cleanBool(p.showInFooter, true),
        enableClickToCall: cleanBool(p.enableClickToCall, true),
        displayOrder: Number.isFinite(Number(p.displayOrder)) ? Number(p.displayOrder) : idx + 1
      })).filter(p => Boolean(p.number));
      phones = enforceSinglePrimary(phones);
    } else {
      phones = existing.phones;
    }

    // 2. Sanitize WhatsApps
    let whatsapps = [];
    if (Array.isArray(incoming.whatsapps)) {
      whatsapps = incoming.whatsapps.map((w, idx) => ({
        id: cleanText(w.id) || makeItemId('wa'),
        label: cleanText(w.label, 'WhatsApp Support', 80),
        number: cleanText(w.number, '', 30).replace(/[^0-9]/g, ''),
        department: cleanText(w.department, '', 120),
        prefilledMessage: cleanText(w.prefilledMessage, '', 500),
        isPrimary: cleanBool(w.isPrimary, false),
        isActive: cleanBool(w.isActive, true),
        enableFloatingButton: cleanBool(w.enableFloatingButton, true),
        showOnContactPage: cleanBool(w.showOnContactPage, true),
        showInFooter: cleanBool(w.showInFooter, false),
        displayOrder: Number.isFinite(Number(w.displayOrder)) ? Number(w.displayOrder) : idx + 1
      })).filter(w => Boolean(w.number));
      whatsapps = enforceSinglePrimary(whatsapps);
    } else {
      whatsapps = existing.whatsapps;
    }

    // 3. Sanitize Emails
    let emails = [];
    if (Array.isArray(incoming.emails)) {
      emails = incoming.emails.map((e, idx) => ({
        id: cleanText(e.id) || makeItemId('email'),
        label: cleanText(e.label, 'General Enquiries', 80),
        email: cleanText(e.email, '', 120).toLowerCase(),
        department: cleanText(e.department, '', 120),
        isPrimary: cleanBool(e.isPrimary, false),
        isActive: cleanBool(e.isActive, true),
        showOnContactPage: cleanBool(e.showOnContactPage, true),
        showInFooter: cleanBool(e.showInFooter, true),
        enableMailto: cleanBool(e.enableMailto, true),
        displayOrder: Number.isFinite(Number(e.displayOrder)) ? Number(e.displayOrder) : idx + 1
      })).filter(e => Boolean(e.email && e.email.includes('@')));
      emails = enforceSinglePrimary(emails);
    } else {
      emails = existing.emails;
    }

    // 4. Sanitize Addresses
    let addresses = [];
    if (Array.isArray(incoming.addresses)) {
      addresses = incoming.addresses.map((a, idx) => ({
        id: cleanText(a.id) || makeItemId('addr'),
        officeName: cleanText(a.officeName, 'Office', 100),
        officeType: cleanText(a.officeType, 'Head Office', 50),
        line1: cleanText(a.line1, '', 200),
        line2: cleanText(a.line2, '', 200),
        area: cleanText(a.area, '', 100),
        city: cleanText(a.city, 'Chennai', 80),
        district: cleanText(a.district, 'Chennai', 80),
        state: cleanText(a.state, 'Tamil Nadu', 80),
        pincode: cleanText(a.pincode, '', 20),
        country: cleanText(a.country, 'India', 60),
        googleMapsUrl: cleanUrl(a.googleMapsUrl),
        mapEmbedUrl: cleanUrl(a.mapEmbedUrl),
        coordinates: {
          lat: Number.isFinite(Number(a.coordinates?.lat)) ? Number(a.coordinates.lat) : 13.0458,
          lng: Number.isFinite(Number(a.coordinates?.lng)) ? Number(a.coordinates.lng) : 80.1472
        },
        isPrimary: cleanBool(a.isPrimary, false),
        isActive: cleanBool(a.isActive, true),
        showOnContactPage: cleanBool(a.showOnContactPage, true),
        showInFooter: cleanBool(a.showInFooter, true),
        displayOrder: Number.isFinite(Number(a.displayOrder)) ? Number(a.displayOrder) : idx + 1
      })).filter(a => Boolean(a.line1));
      addresses = enforceSinglePrimary(addresses);
    } else {
      addresses = existing.addresses;
    }

    // 5. Sanitize Working Hours
    let workingHours = existing.workingHours;
    if (incoming.workingHours && typeof incoming.workingHours === 'object') {
      workingHours = {
        workingDays: cleanText(incoming.workingHours.workingDays, 'Monday – Saturday', 80),
        openingTime: cleanText(incoming.workingHours.openingTime, '9:00 AM', 30),
        closingTime: cleanText(incoming.workingHours.closingTime, '6:30 PM', 30),
        specialDays: cleanText(incoming.workingHours.specialDays, '', 150),
        holidays: cleanText(incoming.workingHours.holidays, '', 150),
        temporaryClosureMessage: cleanText(incoming.workingHours.temporaryClosureMessage, '', 300),
        isActive: cleanBool(incoming.workingHours.isActive, true)
      };
    }

    // 6. Sanitize Registrations
    let registrations = [];
    if (Array.isArray(incoming.registrations)) {
      const allowedLocs = new Set(['both', 'contact_page', 'footer']);
      registrations = incoming.registrations.map((r, idx) => ({
        id: cleanText(r.id) || makeItemId('reg'),
        label: cleanText(r.label, '', 80),
        value: cleanText(r.value, '', 120),
        displayLocation: allowedLocs.has(r.displayLocation) ? r.displayLocation : 'both',
        isActive: cleanBool(r.isActive, true),
        displayOrder: Number.isFinite(Number(r.displayOrder)) ? Number(r.displayOrder) : idx + 1
      })).filter(r => Boolean(r.label && r.value));
    } else {
      registrations = existing.registrations;
    }

    // 7. Sanitize Social Links
    let socialLinks = [];
    if (Array.isArray(incoming.socialLinks)) {
      const allowedPlatforms = new Set(['linkedin', 'instagram', 'facebook', 'youtube', 'x', 'whatsapp', 'custom']);
      socialLinks = incoming.socialLinks.map((s, idx) => ({
        id: cleanText(s.id) || makeItemId('soc'),
        platform: allowedPlatforms.has(s.platform) ? s.platform : 'custom',
        label: cleanText(s.label, 'Social Link', 60),
        url: cleanUrl(s.url),
        isActive: cleanBool(s.isActive, true),
        displayOrder: Number.isFinite(Number(s.displayOrder)) ? Number(s.displayOrder) : idx + 1
      }));
    } else {
      socialLinks = existing.socialLinks;
    }

    // 8. Sanitize Office Images
    let officeImages = [];
    if (Array.isArray(incoming.officeImages)) {
      officeImages = incoming.officeImages.map((img, idx) => ({
        id: cleanText(img.id) || makeItemId('img'),
        url: cleanUrl(img.url),
        publicId: cleanText(img.publicId, '', 300),
        alt: cleanText(img.alt, '', 200),
        caption: cleanText(img.caption, '', 200),
        isPrimary: cleanBool(img.isPrimary, false),
        displayOrder: Number.isFinite(Number(img.displayOrder)) ? Number(img.displayOrder) : idx + 1
      })).filter(img => Boolean(img.url));
      officeImages = enforceSinglePrimary(officeImages);
    } else {
      officeImages = existing.officeImages;
    }

    // Updated By actor
    const actor = {
      id: String(req.admin?.id || ''),
      name: String(req.admin?.name || 'Admin'),
      email: String(req.admin?.email || '')
    };

    const updatePayload = {
      companyName: cleanText(incoming.companyName, existing.companyName || 'Sriyas Healthcare Private Limited', 120),
      tagline: cleanText(incoming.tagline, existing.tagline || 'Empowering Healthcare with Care and Innovation.', 250),
      phones,
      whatsapps,
      emails,
      addresses,
      workingHours,
      registrations,
      socialLinks,
      officeImages,
      googleMapsUrl: cleanUrl(incoming.googleMapsUrl, existing.googleMapsUrl || 'https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw'),
      mapCoordinates: {
        lat: Number.isFinite(Number(incoming.mapCoordinates?.lat)) ? Number(incoming.mapCoordinates.lat) : 13.0458,
        lng: Number.isFinite(Number(incoming.mapCoordinates?.lng)) ? Number(incoming.mapCoordinates.lng) : 80.1472
      },
      updatedBy: actor
    };

    const updatedDoc = await ContactInformation.findOneAndUpdate(
      { singletonKey: 'corporate_contact_info' },
      { $set: updatePayload },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Contact information updated successfully.',
      contact: toPlainObject(updatedDoc)
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/contact-information/upload-image (Admin Protected)
const uploadContactImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file was uploaded.'
      });
    }

    const originalName = req.file.originalname || 'office-image.jpg';
    const uploadResult = await uploadBuffer(
      req.file.buffer,
      originalName,
      CLOUDINARY_FOLDERS.contact || 'sriyas-healthcare/contact'
    );

    res.status(200).json({
      success: true,
      message: 'Office photograph uploaded successfully.',
      image: {
        url: uploadResult.url,
        publicId: uploadResult.public_id || uploadResult.publicId || '',
        alt: cleanText(req.body.alt, originalName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), 200)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicContactInfo,
  getAdminContactInfo,
  updateAdminContactInfo,
  uploadContactImage,
  ensureContactInfoInitialized
};
