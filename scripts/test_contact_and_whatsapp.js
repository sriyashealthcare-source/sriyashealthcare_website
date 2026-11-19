const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  SRIYAS HEALTHCARE — CONTACT & WHATSAPP VALIDATION SUITE');
console.log('═══════════════════════════════════════════════════════════════');

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// 1. Central Contact Configuration
test('Central contact configuration in client/src/constants/contact.js', () => {
  const content = fs.readFileSync('client/src/constants/contact.js', 'utf8');
  assert(content.includes("phone: '+919600804456'"), 'Must define phone: +919600804456');
  assert(content.includes("displayPhone: '+91 9600804456'"), 'Must define displayPhone: +91 9600804456');
  assert(content.includes("email: 'sriyashealthcare@gmail.com'"), 'Must define email: sriyashealthcare@gmail.com');
  assert(content.includes("whatsapp: '919600804456'"), 'Must define whatsapp: 919600804456');
  assert(content.includes('buildWhatsAppUrl'), 'Must export buildWhatsAppUrl helper');
});

// 2. Footer Contact Details
test('Footer.jsx uses central contact details and telephone link', () => {
  const footer = fs.readFileSync('client/src/components/footer/Footer.jsx', 'utf8');
  assert(footer.includes('COMPANY_CONTACT'), 'Footer must import COMPANY_CONTACT');
  assert(footer.includes('href={`tel:${COMPANY_CONTACT.phone}`}'), 'Footer must have tel link');
  assert(footer.includes('href={`mailto:${COMPANY_CONTACT.email}`}'), 'Footer must have mailto link');
  assert(!footer.includes('9367772801'), 'Old secondary number must be removed from Footer');
});

// 3. Navbar Contact Details
test('Navbar.jsx uses central contact details and telephone/email links', () => {
  const navbar = fs.readFileSync('client/src/components/navbar/Navbar.jsx', 'utf8');
  assert(navbar.includes('COMPANY_CONTACT'), 'Navbar must import COMPANY_CONTACT');
  assert(navbar.includes('href={`tel:${COMPANY_CONTACT.phone}`}'), 'Navbar must have tel link');
  assert(navbar.includes('href={`mailto:${COMPANY_CONTACT.email}`}'), 'Navbar must have mailto link');
});

// 4. Contact Us Page
test('Contact.jsx uses clickable tel and mailto links with official details', () => {
  const contact = fs.readFileSync('client/src/pages/customer/Contact.jsx', 'utf8');
  assert(contact.includes('COMPANY_CONTACT'), 'Contact page must import COMPANY_CONTACT');
  assert(contact.includes('href={`tel:${COMPANY_CONTACT.phone}`}'), 'Contact page must have tel link');
  assert(contact.includes('href={`mailto:${COMPANY_CONTACT.email}`}'), 'Contact page must have mailto link');
  assert(!contact.includes('>9367772801<'), 'Secondary phone number must not be displayed on Contact page');
});

// 5. CtaSection Phone Rendering
test('CtaSection.jsx converts phone numbers into clickable tel links', () => {
  const cta = fs.readFileSync('client/src/components/home/CtaSection.jsx', 'utf8');
  assert(cta.includes('renderClickablePhones'), 'CtaSection must define renderClickablePhones');
  assert(cta.includes('href={`tel:${telHref}`}'), 'Must render tel link');
  assert(cta.includes('href={`mailto:${callToAction.contactEmail}`}'), 'Must render mailto link');
});

// 6. Floating Action Widget Design & Behavior
test('FloatingEnquiryWidget.jsx displays Product Enquiry pill and WhatsApp button', () => {
  const widget = fs.readFileSync('client/src/components/enquiry/FloatingEnquiryWidget.jsx', 'utf8');
  assert(widget.includes('floating-enquiry-pill'), 'Must render Product Enquiry pill button');
  assert(widget.includes('floating-whatsapp-btn'), 'Must render WhatsApp button');
  assert(widget.includes('id="floating-product-enquiry-btn"'), 'Product Enquiry button must have unique id');
  assert(widget.includes('id="floating-whatsapp-btn"'), 'WhatsApp button must have unique id');
  assert(widget.includes('buildWhatsAppUrl'), 'Must build URL using buildWhatsAppUrl');
  assert(widget.includes("location.pathname.startsWith('/admin')"), 'Must guard against admin routes');
  assert(widget.includes('target="_blank"'), 'WhatsApp link must open in new tab/app');
  assert(widget.includes('rel="noopener noreferrer"'), 'Must have safe rel attributes');
  assert(widget.includes('aria-label='), 'Must have accessible labels');
});

// 7. Context-Aware WhatsApp Messages
test('FloatingEnquiryWidget generates context-aware WhatsApp messages', () => {
  const widget = fs.readFileSync('client/src/components/enquiry/FloatingEnquiryWidget.jsx', 'utf8');
  assert(widget.includes('interested in ${currentProduct.name}'), 'Must format product message');
  assert(widget.includes('know more about ${currentBrand.name} products'), 'Must format brand message');
  assert(widget.includes('like to get in touch with your team'), 'Must format contact/about message');
  assert(widget.includes('visited your website and would like to know more'), 'Must format default message');
});

// 8. CSS Responsive Behavior
test('floatingEnquiry.css keeps both buttons accessible on mobile without hiding', () => {
  const css = fs.readFileSync('client/src/styles/floatingEnquiry.css', 'utf8');
  assert(css.includes('.floating-contact-actions'), 'Must style floating-contact-actions container');
  assert(css.includes('.floating-enquiry-pill'), 'Must style floating-enquiry-pill');
  assert(css.includes('.floating-whatsapp-btn'), 'Must style floating-whatsapp-btn');
  assert(css.includes('.floating-whatsapp-pulse'), 'Must include pulse animation');
  assert(css.includes('.floating-whatsapp-tooltip'), 'Must style desktop hover tooltip');
  
  // Verify mobile styles
  const mobileQuery = css.slice(css.indexOf('@media (max-width: 768px)'));
  assert(mobileQuery.includes('.floating-enquiry-pill'), 'Must define mobile styles for pill');
  assert(mobileQuery.includes('display: inline-flex'), 'Product Enquiry pill must remain visible on mobile');
  assert(!mobileQuery.includes('.floating-enquiry-pill {\n    display: none'), 'Pill must NOT be hidden on mobile');
});

// 9. Client Build Test
test('Vite build succeeds without errors', () => {
  assert(fs.existsSync('client/dist/index.html'), 'Dist index.html must exist');
  assert(fs.existsSync('client/dist/contact/index.html'), 'Dist contact/index.html must exist');
});

console.log('───────────────────────────────────────────────────────────────');
console.log(`Results: ${passed} passed, ${failed} failed.`);
console.log('═══════════════════════════════════════════════════════════════');

if (failed > 0) process.exit(1);
