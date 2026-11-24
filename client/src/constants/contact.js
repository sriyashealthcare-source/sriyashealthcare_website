/**
 * Sriyas Healthcare - Official Corporate Contact Constants & Helpers
 * Central source of truth for all public-facing phone numbers, email addresses,
 * and WhatsApp communication links across the website.
 */

export const COMPANY_CONTACT = {
  phone: '+919600804456',
  displayPhone: '+91 9600804456',
  phoneSecondary: '+919367772801',
  displayPhoneSecondary: '+91 9367772801',
  email: 'sriyashealthcare@gmail.com',
  whatsapp: '919600804456',
  companyName: 'Sriyas Healthcare Private Limited',
  address: {
    line1: 'Plot No.53A, First Floor, East Facing, Oil Mill Road',
    line2: 'Maruthi Nagar, Karambakkam, Thundalam',
    city: 'Chennai',
    pincode: '600077',
    state: 'Tamil Nadu',
    country: 'India'
  },
  operatingHours: 'Mon – Sat: 9:00 AM – 6:30 PM',
  gstin: '33ABQCS4744P1ZJ',
  dlNo: 'TN/Z04/20B/01443 & TN/Z04/21B/01443',
  dlNo1: 'TN/Z04/20B/01443',
  dlNo2: 'TN/Z04/21B/01443'
};

/**
 * Standard, reliable Google Maps search URL for Sriyas Healthcare corporate office.
 * Direct search query by address avoids shortlink redirect timeouts or broken connections.
 */
export const GOOGLE_MAPS_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `Sriyas Healthcare, ${COMPANY_CONTACT.address.line1}, ${COMPANY_CONTACT.address.line2}, ${COMPANY_CONTACT.address.city} - ${COMPANY_CONTACT.address.pincode}, ${COMPANY_CONTACT.address.state}, ${COMPANY_CONTACT.address.country}`
)}`;

/**
 * Builds the official WhatsApp click-to-chat URL with properly encoded message.
 * Supports optional dynamic phone number with fallback to default corporate WhatsApp.
 * @param {string} [customMessage]
 * @param {string} [customPhone]
 * @returns {string}
 */
export function buildWhatsAppUrl(customMessage, customPhone) {
  const phone = (customPhone && typeof customPhone === 'string' && customPhone.replace(/[^0-9]/g, ''))
    ? customPhone.replace(/[^0-9]/g, '')
    : COMPANY_CONTACT.whatsapp;
  const defaultMsg =
    'Hello Sriyas Healthcare Team, I visited your website and would like to know more about your products and services. Please assist me.';
  const msg = customMessage && typeof customMessage === 'string' && customMessage.trim()
    ? customMessage.trim()
    : defaultMsg;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
