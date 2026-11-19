import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useEnquiry } from '../../context/EnquiryContext';
import { COMPANY_CONTACT, buildWhatsAppUrl } from '../../constants/contact';
import { trackAnalyticsEvent } from '../../utils/session';
import EnquiryDrawer from './EnquiryDrawer';
import '../../styles/floatingEnquiry.css';

/**
 * Global Floating Contact Actions
 * Displays side-by-side bottom-right contact triggers on all public pages:
 *   [ ✉ Product Enquiry ]  [ (WhatsApp Icon) ]
 *
 * 1. Product Enquiry Pill: Opens the comprehensive slide-in Enquiry Drawer,
 *    persisting product / brand context and saving entries to MongoDB & Admin Portal.
 * 2. WhatsApp Circular Button: Directly launches WhatsApp (Android/iOS app or Web)
 *    prefilled with a context-aware message to Sriyas Healthcare (+91 9600804456).
 */
export default function FloatingEnquiryWidget() {
  const location = useLocation();
  const {
    isDrawerOpen,
    toggleDrawer,
    pageProduct,
    pageBrand,
    drawerProduct,
    drawerBrand
  } = useEnquiry();

  // Guard: NEVER render on any Admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  // Derive context-aware WhatsApp prefilled message based on active route and catalog context
  const whatsappUrl = useMemo(() => {
    const currentProduct = pageProduct || drawerProduct;
    const currentBrand = pageBrand || drawerBrand;
    const path = location.pathname;

    let message = '';
    if (currentProduct?.name) {
      message = `Hello Sriyas Healthcare Team, I am interested in ${currentProduct.name}. Please share more details.`;
    } else if (currentBrand?.name) {
      message = `Hello Sriyas Healthcare Team, I would like to know more about ${currentBrand.name} products.`;
    } else if (path === '/contact' || path === '/about' || location.hash.includes('about')) {
      message = 'Hello Sriyas Healthcare Team, I would like to get in touch with your team.';
    } else if (path === '/') {
      message = 'Hello Sriyas Healthcare Team, I visited your website and would like to know more about your products and services.';
    } else {
      message = 'Hello Sriyas Healthcare Team, I visited your website and would like to know more about your products and services. Please assist me.';
    }

    return buildWhatsAppUrl(message);
  }, [pageProduct, drawerProduct, pageBrand, drawerBrand, location.pathname, location.hash]);

  const handleWhatsAppClick = () => {
    try {
      trackAnalyticsEvent('whatsapp_click', {
        sourcePage: location.pathname,
        product: pageProduct?.name || drawerProduct?.name || null,
        brand: pageBrand?.name || drawerBrand?.name || null
      });
    } catch (_) {
      // Non-blocking
    }
  };

  return (
    <>
      <aside
        className="floating-contact-actions"
        aria-label="Quick Contact & Enquiry Actions"
      >
        {/* 1. Pill-shaped Product Enquiry Button */}
        <button
          type="button"
          className={`floating-enquiry-pill ${isDrawerOpen ? 'is-drawer-open' : ''}`}
          onClick={toggleDrawer}
          aria-label={isDrawerOpen ? 'Close Product Enquiry Drawer' : 'Open Product Enquiry Form'}
          title="Product Enquiry"
          id="floating-product-enquiry-btn"
        >
          <span className="floating-enquiry-pill-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
            >
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </span>
          <span className="floating-enquiry-pill-text">Product Enquiry</span>
        </button>

        {/* 2. Circular Gold WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="floating-whatsapp-btn"
          onClick={handleWhatsAppClick}
          aria-label={`Chat with us on WhatsApp (${COMPANY_CONTACT.displayPhone})`}
          title="Chat with us on WhatsApp"
          id="floating-whatsapp-btn"
        >
          <span className="floating-whatsapp-pulse" aria-hidden="true" />
          <svg
            className="floating-whatsapp-icon"
            viewBox="0 0 24 24"
            width="28"
            height="28"
            fill="#FFFFFF"
            aria-hidden="true"
          >
            {/* Official WhatsApp Glyph */}
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          <span className="floating-whatsapp-tooltip" role="tooltip">
            Chat with us on WhatsApp
          </span>
        </a>
      </aside>

      {/* Global Slide-In Enquiry Drawer */}
      <EnquiryDrawer />
    </>
  );
}
