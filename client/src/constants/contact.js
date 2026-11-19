/**
 * Sriyas Healthcare - Official Corporate Contact Constants & Helpers
 * Central source of truth for all public-facing phone numbers, email addresses,
 * and WhatsApp communication links across the website.
 */

export const COMPANY_CONTACT = {
  phone: '+919600804456',
  displayPhone: '+91 9600804456',
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
  dlNo: 'TN/Z04/20B/01443 & TN/Z04/21B/01443'
};

/**
 * Builds the official WhatsApp click-to-chat URL with properly encoded message.
 * @param {string} customMessage
 * @returns {string}
 */
export function buildWhatsAppUrl(customMessage) {
  const defaultMsg =
    'Hello Sriyas Healthcare Team, I visited your website and would like to know more about your products and services. Please assist me.';
  const msg = customMessage && typeof customMessage === 'string' && customMessage.trim()
    ? customMessage.trim()
    : defaultMsg;
  return `https://wa.me/${COMPANY_CONTACT.whatsapp}?text=${encodeURIComponent(msg)}`;
}
