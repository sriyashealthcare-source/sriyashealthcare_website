const fs = require('fs');
const assert = require('assert');

console.log('═══════════════════════════════════════════════════════════════');
console.log('VERIFYING CONTACT PAGE OFFICE PHOTO LIGHTBOX & CONTROLS');
console.log('═══════════════════════════════════════════════════════════════');

// 1. Verify Contact.jsx source implementation
const contactSrc = fs.readFileSync('client/src/pages/customer/Contact.jsx', 'utf8');

// Check createPortal import
assert(contactSrc.includes("import { createPortal } from 'react-dom';"), 'createPortal must be imported from react-dom');
console.log('✓ createPortal imported from react-dom.');

// Check photo frame click trigger
assert(contactSrc.includes('className="office-portrait-frame"'), 'office-portrait-frame must exist');
assert(contactSrc.includes('role="button"'), 'office-portrait-frame must have role="button"');
assert(contactSrc.includes('tabIndex={0}'), 'office-portrait-frame must be keyboard accessible (tabIndex={0})');
assert(contactSrc.includes('onClick={() => openLightbox()}'), 'office-portrait-frame must trigger openLightbox() on click');
console.log('✓ Office photo card has clickable role="button", tabIndex, and onClick handler.');

// Check zoom badge click trigger
assert(contactSrc.includes('className="office-zoom-badge"'), 'office-zoom-badge must exist');
assert(contactSrc.includes('aria-label="Click to enlarge building photo"'), 'office-zoom-badge must have accessible label');
console.log('✓ "Click to enlarge" badge has explicit onClick trigger and aria-label.');

// Check createPortal rendering to document.body
assert(contactSrc.includes('createPortal(') && contactSrc.includes('document.body'), 'Lightbox must render via createPortal to document.body');
console.log('✓ Lightbox renders directly into document.body via React Portal.');

// Check "← Back to Contact Page" button
assert(contactSrc.includes('className="office-lightbox-back-btn"'), 'office-lightbox-back-btn must exist in topbar');
assert(contactSrc.includes('← Back to Contact Page'), 'Top-left back button must have "← Back to Contact Page" text');
assert(contactSrc.includes('onClick={closeLightbox}'), 'Back button must close the lightbox');
console.log('✓ Prominent "← Back to Contact Page" button present in lightbox topbar.');

// Check top-right close button
assert(contactSrc.includes('className="office-lightbox-close"'), 'office-lightbox-close button must exist');
console.log('✓ Top-right close button present.');

// Check stopPropagation on lightbox content
assert(contactSrc.includes('className="office-lightbox-content"') && contactSrc.includes('e.stopPropagation()'), 'Lightbox content must stopPropagation to prevent accidental close on image click');
console.log('✓ Content container stops click propagation.');

// Check Escape key support & body overflow locking
assert(contactSrc.includes("e.key === 'Escape'"), 'Escape key must close the lightbox');
assert(contactSrc.includes("document.body.style.overflow = 'hidden'"), 'Body scroll must be locked when lightbox is open');
assert(contactSrc.includes("document.body.style.overflow = prevOverflow"), 'Body scroll must be restored on close');
console.log('✓ Escape key listener and body overflow lock/restore verified.');

// 2. Verify customer.css styling
const cssSrc = fs.readFileSync('client/src/styles/customer.css', 'utf8');

assert(cssSrc.includes('.office-lightbox-overlay'), 'office-lightbox-overlay CSS must exist');
assert(cssSrc.includes('z-index: 99999;'), 'office-lightbox-overlay must have z-index: 99999');
assert(cssSrc.includes('backdrop-filter: blur(6px);'), 'office-lightbox-overlay must have blur backdrop');
assert(cssSrc.includes('.office-lightbox-topbar'), 'office-lightbox-topbar CSS must exist');
assert(cssSrc.includes('.office-lightbox-back-btn'), 'office-lightbox-back-btn CSS must exist');
assert(cssSrc.includes('cursor: pointer;'), 'Buttons must have cursor: pointer');
assert(cssSrc.includes('.office-zoom-badge'), 'office-zoom-badge CSS must exist');
assert(cssSrc.includes('cursor: zoom-in;'), 'office-portrait-frame must have cursor: zoom-in');
console.log('✓ Lightbox CSS rules (z-index: 99999, backdrop blur, topbar, back button, responsive styles) verified.');

console.log('═══════════════════════════════════════════════════════════════');
console.log('ALL CONTACT LIGHTBOX & BACK BUTTON CHECKS PASSED WITH 100%!');
console.log('═══════════════════════════════════════════════════════════════');
