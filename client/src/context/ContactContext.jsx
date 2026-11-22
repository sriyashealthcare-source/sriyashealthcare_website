import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { contactService } from '../services/contactService';
import { COMPANY_CONTACT } from '../constants/contact';
import { STOREFRONT_LOCATION_URL } from '../utils/cloudinaryAssets';

const ContactContext = createContext(null);

const DEFAULT_INITIAL_STATE = {
  companyName: COMPANY_CONTACT.companyName,
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
    }
  ],
  whatsapps: [
    {
      id: 'wa-main',
      label: 'Official WhatsApp Support',
      number: COMPANY_CONTACT.whatsapp,
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
      email: COMPANY_CONTACT.email,
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
      line1: COMPANY_CONTACT.address.line1,
      line2: COMPANY_CONTACT.address.line2,
      area: 'Maruthi Nagar, Karambakkam',
      city: COMPANY_CONTACT.address.city,
      district: 'Chennai',
      state: COMPANY_CONTACT.address.state,
      pincode: COMPANY_CONTACT.address.pincode,
      country: COMPANY_CONTACT.address.country,
      googleMapsUrl: 'https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw',
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
      value: COMPANY_CONTACT.gstin,
      displayLocation: 'both',
      isActive: true,
      displayOrder: 1
    },
    {
      id: 'reg-dl',
      label: 'Drug Licence (DL) No',
      value: COMPANY_CONTACT.dlNo,
      displayLocation: 'contact_page',
      isActive: true,
      displayOrder: 2
    }
  ],
  socialLinks: [],
  officeImages: [
    {
      id: 'img-storefront',
      url: STOREFRONT_LOCATION_URL,
      publicId: 'sriyas/office/storefront_location',
      alt: 'Sriyas Healthcare storefront and registered office in Chennai',
      caption: 'Corporate Office & Medical Distribution Centre, Chennai',
      isPrimary: true,
      displayOrder: 1
    }
  ],
  googleMapsUrl: 'https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw',
  mapCoordinates: { lat: 13.0458, lng: 80.1472 }
};

export function ContactProvider({ children }) {
  const [contactData, setContactData] = useState(DEFAULT_INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadContactInfo = useCallback(async (force = false) => {
    try {
      const data = await contactService.getPublicContactInfo({ force });
      if (data && typeof data === 'object') {
        setContactData((prev) => ({
          ...prev,
          ...data
        }));
        setError(null);
      }
    } catch (err) {
      // Gracefully retain initial default data on network or backend unavailability
      setError(err?.message || 'Failed to fetch contact information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContactInfo(false);
  }, [loadContactInfo]);

  const refreshContactInfo = useCallback(async () => {
    setLoading(true);
    await loadContactInfo(true);
  }, [loadContactInfo]);

  // Derived primary helpers
  const primaryPhone = useMemo(() => {
    const list = contactData.phones || [];
    const item = list.find((p) => p.isPrimary && p.isActive !== false) || list.find((p) => p.isActive !== false) || null;
    if (!item) {
      return {
        label: 'Main Office',
        countryCode: '+91',
        number: '9600804456',
        displayPhone: '+91 9600804456',
        clickUrl: 'tel:+919600804456',
        purpose: 'General Enquiries'
      };
    }
    const cleanNum = (item.number || '').replace(/[^0-9]/g, '');
    const code = item.countryCode || '+91';
    const displayPhone = `${code} ${cleanNum}`;
    const clickUrl = `tel:${code}${cleanNum}`;
    return {
      ...item,
      displayPhone,
      clickUrl
    };
  }, [contactData.phones]);

  const primaryWhatsApp = useMemo(() => {
    const list = contactData.whatsapps || [];
    const item = list.find((w) => w.isPrimary && w.isActive !== false) || list.find((w) => w.isActive !== false) || null;
    if (!item) {
      return {
        label: 'Official WhatsApp Support',
        number: COMPANY_CONTACT.whatsapp,
        prefilledMessage:
          'Hello Sriyas Healthcare Team, I visited your website and would like to know more about your products and services. Please assist me.',
        enableFloatingButton: true
      };
    }
    return item;
  }, [contactData.whatsapps]);

  const primaryEmail = useMemo(() => {
    const list = contactData.emails || [];
    const item = list.find((e) => e.isPrimary && e.isActive !== false) || list.find((e) => e.isActive !== false) || null;
    if (!item) {
      return {
        label: 'General & Institutional Enquiries',
        email: COMPANY_CONTACT.email,
        mailtoUrl: `mailto:${COMPANY_CONTACT.email}`,
        department: 'Healthcare Solutions & Supply'
      };
    }
    return {
      ...item,
      mailtoUrl: `mailto:${item.email}`
    };
  }, [contactData.emails]);

  const primaryAddress = useMemo(() => {
    const list = contactData.addresses || [];
    const item = list.find((a) => a.isPrimary && a.isActive !== false) || list.find((a) => a.isActive !== false) || null;
    if (!item) {
      return {
        officeName: 'Corporate Office & Distribution Centre',
        officeType: 'Head Office',
        line1: COMPANY_CONTACT.address.line1,
        line2: COMPANY_CONTACT.address.line2,
        area: 'Maruthi Nagar, Karambakkam',
        city: COMPANY_CONTACT.address.city,
        state: COMPANY_CONTACT.address.state,
        pincode: COMPANY_CONTACT.address.pincode,
        country: COMPANY_CONTACT.address.country,
        formatted: `${COMPANY_CONTACT.address.line1}, ${COMPANY_CONTACT.address.line2}, ${COMPANY_CONTACT.address.city} - ${COMPANY_CONTACT.address.pincode}, ${COMPANY_CONTACT.address.state}, ${COMPANY_CONTACT.address.country}`
      };
    }
    const parts = [
      item.line1,
      item.line2,
      item.area,
      item.city ? `${item.city}${item.pincode ? ` - ${item.pincode}` : ''}` : '',
      item.state,
      item.country
    ].filter(Boolean);
    return {
      ...item,
      formatted: parts.join(', ')
    };
  }, [contactData.addresses]);

  const primaryOfficeImage = useMemo(() => {
    const list = contactData.officeImages || [];
    const item = list.find((img) => img.isPrimary) || list[0] || null;
    if (!item) {
      return {
        url: STOREFRONT_LOCATION_URL,
        alt: 'Sriyas Healthcare Corporate Office & Distribution Facility'
      };
    }
    return item;
  }, [contactData.officeImages]);

  const isWhatsAppFloatingEnabled = useMemo(() => {
    if (!primaryWhatsApp || !primaryWhatsApp.number) return false;
    return primaryWhatsApp.enableFloatingButton !== false && primaryWhatsApp.isActive !== false;
  }, [primaryWhatsApp]);

  const buildWhatsAppLink = useCallback(
    (customMessage) => {
      const waNum = (primaryWhatsApp?.number || COMPANY_CONTACT.whatsapp).replace(/[^0-9]/g, '');
      const defaultMsg =
        primaryWhatsApp?.prefilledMessage ||
        'Hello Sriyas Healthcare Team, I visited your website and would like to know more about your products and services. Please assist me.';
      const msg = typeof customMessage === 'string' && customMessage.trim() ? customMessage.trim() : defaultMsg;
      return `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
    },
    [primaryWhatsApp]
  );

  const value = {
    contactInfo: contactData,
    loading,
    error,
    refreshContactInfo,
    primaryPhone,
    primaryWhatsApp,
    primaryEmail,
    primaryAddress,
    primaryOfficeImage,
    isWhatsAppFloatingEnabled,
    buildWhatsAppLink,
    phones: contactData.phones || [],
    whatsapps: contactData.whatsapps || [],
    emails: contactData.emails || [],
    addresses: contactData.addresses || [],
    workingHours: contactData.workingHours || {},
    registrations: contactData.registrations || [],
    socialLinks: (contactData.socialLinks || []).filter((s) => s.isActive !== false && s.url),
    officeImages: contactData.officeImages || [],
    googleMapsUrl: contactData.googleMapsUrl || 'https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw',
    mapCoordinates: contactData.mapCoordinates || { lat: 13.0458, lng: 80.1472 }
  };

  return <ContactContext.Provider value={value}>{children}</ContactContext.Provider>;
}

export function useContactInfo() {
  const context = useContext(ContactContext);
  if (!context) {
    throw new Error('useContactInfo must be used within a ContactProvider');
  }
  return context;
}
