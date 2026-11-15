import React from 'react';
import { useLocation } from 'react-router-dom';
import { useEnquiry } from '../../context/EnquiryContext';
import EnquiryDrawer from './EnquiryDrawer';
import '../../styles/floatingEnquiry.css';

export default function FloatingEnquiryWidget() {
  const location = useLocation();
  const { isDrawerOpen, toggleDrawer } = useEnquiry();

  // Guard: NEVER render on any Admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <div className="floating-enquiry-container" aria-label="Quick Product Enquiry">
        {/* Tooltip Pill on Desktop */}
        {!isDrawerOpen && (
          <button
            type="button"
            className="floating-enquiry-tooltip"
            onClick={toggleDrawer}
            aria-label="Open Product Enquiry Form"
          >
            <span className="floating-enquiry-tooltip-gold">✉</span>
            <span>Product Enquiry</span>
          </button>
        )}

        {/* Floating Action Button */}
        <button
          type="button"
          className="floating-enquiry-btn"
          onClick={toggleDrawer}
          aria-label={isDrawerOpen ? 'Close Product Enquiry Drawer' : 'Open Product Enquiry Drawer'}
          title="Product Enquiry"
          id="floating-enquiry-fab"
        >
          <span className="floating-enquiry-pulse" aria-hidden="true" />
          {isDrawerOpen ? (
            <svg
              className="floating-enquiry-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              className="floating-enquiry-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {/* Professional medical enquiry / chat bubble with subtle cross */}
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2v2H9v-2H7V9h2V7h2v2h2v2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Global Slide-In Enquiry Drawer */}
      <EnquiryDrawer />
    </>
  );
}
