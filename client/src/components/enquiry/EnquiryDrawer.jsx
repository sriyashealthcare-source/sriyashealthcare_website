import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useEnquiry } from '../../context/EnquiryContext';
import { enquiryService } from '../../services/enquiryService';
import { resolveAssetUrl } from '../../utils/session';

export default function EnquiryDrawer() {
  const {
    isDrawerOpen,
    closeDrawer,
    drawerProduct,
    drawerBrand,
    drawerPrefillMessage,
    selectProduct,
    clearProduct,
    allProducts,
    allBrands
  } = useEnquiry();

  // Form input state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // Searchable product selector state
  const [isSelectingProduct, setIsSelectingProduct] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const drawerRef = useRef(null);
  const nameInputRef = useRef(null);

  // Synchronize prefill message whenever drawerProduct or drawerPrefillMessage changes
  useEffect(() => {
    if (drawerPrefillMessage) {
      setFormData(prev => ({
        ...prev,
        message: prev.message && prev.message !== '' && !prev.message.startsWith('I would like to')
          ? prev.message
          : drawerPrefillMessage
      }));
    }
  }, [drawerPrefillMessage, drawerProduct]);

  // Lock body scroll and focus input when drawer opens
  useEffect(() => {
    if (isDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        if (nameInputRef.current && !isSubmitted) {
          nameInputRef.current.focus();
        }
      }, 250);

      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(timer);
      };
    }
  }, [isDrawerOpen, isSubmitted]);

  // Escape key closes drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Filtered products for in-drawer selector
  const filteredProducts = useMemo(() => {
    if (!productSearchQuery.trim()) {
      return (allProducts || []).slice(0, 10);
    }
    const q = productSearchQuery.toLowerCase().trim();
    return (allProducts || []).filter(p => {
      const pName = (p.name || '').toLowerCase();
      const bName = (p.brand?.name || p.brand || '').toLowerCase();
      const cat = (p.category?.name || p.cardCategory || '').toLowerCase();
      return pName.includes(q) || bName.includes(q) || cat.includes(q);
    }).slice(0, 12);
  }, [allProducts, productSearchQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (formData.phone.replace(/[^0-9]/g, '').length < 6) {
      errors.phone = 'Please provide a valid contact number (at least 6 digits).';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      errors.email = 'Please provide a valid email address.';
    }
    if (!formData.message.trim()) {
      errors.message = 'Please enter your enquiry message or requirements.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        company: formData.company.trim(),
        message: formData.message.trim(),
        enquirySource: 'Floating Product Enquiry Widget',
        sourcePage: window.location.pathname
      };

      if (drawerProduct) {
        payload.productId = drawerProduct._id;
        payload.productName = drawerProduct.name;
        payload.productSlug = drawerProduct.slug;
        payload.brandName = drawerProduct.brand?.name || (typeof drawerProduct.brand === 'string' ? drawerProduct.brand : drawerBrand?.name || '');
        payload.subject = `Enquiry for ${drawerProduct.name}`;
      }

      if (drawerBrand) {
        payload.brandId = drawerBrand._id;
        payload.brandName = drawerBrand.name;
        payload.brandSlug = drawerBrand.slug;
        if (!payload.subject) {
          payload.subject = `Enquiry for ${drawerBrand.name} Products`;
        }
      }

      const res = await enquiryService.submitEnquiry(payload);

      if (res && res.success) {
        setSubmittedData({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          productName: drawerProduct?.name || null,
          brandName: drawerBrand?.name || drawerProduct?.brand?.name || null
        });
        setIsSubmitted(true);
      } else {
        setServerError(res?.message || 'Could not submit your enquiry. Please check your connection and try again.');
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Network error submitting enquiry. Please try again or reach our team directly.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForNewEnquiry = () => {
    setIsSubmitted(false);
    setSubmittedData(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      message: drawerPrefillMessage || 'I would like to enquire about surgical supplies and healthcare solutions.'
    });
    setFormErrors({});
    setServerError('');
  };

  // Resolve thumbnail image for context card
  const productThumb = useMemo(() => {
    if (!drawerProduct) return null;
    const primaryImg = Array.isArray(drawerProduct.images)
      ? drawerProduct.images.find(img => img.isPrimary) || drawerProduct.images[0]
      : null;
    const url = primaryImg?.url || drawerProduct.cardBg || '/assets/placeholders/peters-suture.svg';
    return resolveAssetUrl(url);
  }, [drawerProduct]);

  const activeBrandName = drawerBrand?.name || (typeof drawerProduct?.brand === 'object' ? drawerProduct.brand.name : drawerProduct?.brand) || '';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`enquiry-drawer-backdrop ${isDrawerOpen ? 'is-open' : ''}`}
        onClick={closeDrawer}
        aria-hidden={!isDrawerOpen}
      />

      {/* Drawer Container */}
      <aside
        ref={drawerRef}
        className={`enquiry-drawer ${isDrawerOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-drawer-title"
        aria-hidden={!isDrawerOpen}
      >
        {/* Header */}
        <div className="enquiry-drawer-header">
          <div className="enquiry-drawer-eyebrow">
            <span>◆</span> Sriyas Healthcare
          </div>
          <h2 id="enquiry-drawer-title" className="enquiry-drawer-title">
            {isSubmitted ? 'Enquiry Received' : 'Product Enquiry'}
          </h2>
          <p className="enquiry-drawer-subtitle">
            {isSubmitted
              ? 'Our medical solutions team will contact you shortly.'
              : 'Submit your requirements for swift clinical specifications and pricing.'}
          </p>

          <button
            type="button"
            className="enquiry-drawer-close"
            onClick={closeDrawer}
            aria-label="Close enquiry window"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body Area */}
        <div className="enquiry-drawer-body">
          {isSubmitted ? (
            /* Success confirmation screen */
            <div className="enquiry-success-view">
              <div className="enquiry-success-icon-wrap">✓</div>
              <h3 className="enquiry-success-title">Thank You, {submittedData?.name}!</h3>
              <p className="enquiry-success-desc">
                Your enquiry has been received directly by the Sriyas Healthcare medical solutions team.
                We will contact you via <strong>{submittedData?.phone}</strong> or <strong>{submittedData?.email}</strong> shortly.
              </p>

              <div className="enquiry-success-summary">
                {submittedData?.productName && (
                  <div className="enquiry-success-row">
                    <span className="enquiry-success-label">Product of Interest:</span>
                    <span className="enquiry-success-val">{submittedData.productName}</span>
                  </div>
                )}
                {submittedData?.brandName && (
                  <div className="enquiry-success-row">
                    <span className="enquiry-success-label">Manufacturer / Partner:</span>
                    <span className="enquiry-success-val">{submittedData.brandName}</span>
                  </div>
                )}
                <div className="enquiry-success-row">
                  <span className="enquiry-success-label">Contact Reference:</span>
                  <span className="enquiry-success-val">{submittedData?.phone}</span>
                </div>
              </div>

              <div className="enquiry-success-actions">
                <button
                  type="button"
                  className="enquiry-submit-btn"
                  onClick={closeDrawer}
                >
                  Done &amp; Close
                </button>
                <button
                  type="button"
                  className="enquiry-btn-secondary"
                  onClick={handleResetForNewEnquiry}
                >
                  Submit Another Enquiry
                </button>
              </div>
            </div>
          ) : (
            /* Enquiry Form Screen */
            <form onSubmit={handleSubmit} noValidate>
              {/* Product / Brand Context Card */}
              {drawerProduct ? (
                <div className="enquiry-context-card">
                  <img
                    src={productThumb}
                    alt={drawerProduct.name}
                    className="enquiry-context-thumb"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/placeholders/peters-suture.svg';
                    }}
                  />
                  <div className="enquiry-context-info">
                    {activeBrandName && (
                      <span className="enquiry-context-tag">{activeBrandName}</span>
                    )}
                    <h4 className="enquiry-context-name">{drawerProduct.name}</h4>
                    <p className="enquiry-context-sub">Auto-detected from active view</p>
                  </div>
                  <button
                    type="button"
                    className="enquiry-context-action-btn"
                    onClick={() => {
                      clearProduct();
                      setIsSelectingProduct(true);
                    }}
                    title="Change product"
                  >
                    Change
                  </button>
                </div>
              ) : drawerBrand ? (
                <div className="enquiry-context-card">
                  <div
                    className="enquiry-context-thumb"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem'
                    }}
                  >
                    {drawerBrand.icon || '🔬'}
                  </div>
                  <div className="enquiry-context-info">
                    <span className="enquiry-context-tag">Partner Manufacturer</span>
                    <h4 className="enquiry-context-name">{drawerBrand.name}</h4>
                    <p className="enquiry-context-sub">Catalogue enquiries for this brand</p>
                  </div>
                  <button
                    type="button"
                    className="enquiry-context-action-btn"
                    onClick={() => setIsSelectingProduct(true)}
                  >
                    Select Product
                  </button>
                </div>
              ) : null}

              {/* Optional Searchable Product Selector */}
              {isSelectingProduct && (
                <div className="enquiry-selector-box">
                  <div className="enquiry-selector-header">
                    <label className="enquiry-selector-title">Select Healthcare Product</label>
                    <button
                      type="button"
                      className="enquiry-context-action-btn"
                      onClick={() => setIsSelectingProduct(false)}
                    >
                      Hide
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Search product (e.g. Optilene, Cutimed, LiquiBand)..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="enquiry-selector-input"
                  />
                  <ul className="enquiry-selector-list">
                    {filteredProducts.map((p) => {
                      const bName = p.brand?.name || (typeof p.brand === 'string' ? p.brand : '');
                      return (
                        <li
                          key={p._id || p.slug}
                          className="enquiry-selector-item"
                          onClick={() => {
                            selectProduct(p);
                            setIsSelectingProduct(false);
                            setProductSearchQuery('');
                          }}
                        >
                          <span>{p.name}</span>
                          {bName && <span className="enquiry-selector-badge">{bName}</span>}
                        </li>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <li style={{ padding: '8px', fontSize: '0.82rem', color: '#888', textAlign: 'center' }}>
                        No matching products found.
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Server-level error message */}
              {serverError && (
                <div className="enquiry-inline-alert enquiry-inline-alert-error" role="alert">
                  ⚠ {serverError}
                </div>
              )}

              {/* Full Name */}
              <div className="enquiry-field-group">
                <label className="enquiry-field-label" htmlFor="enquiry-drawer-name">
                  Full Name <span className="enquiry-field-req">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  id="enquiry-drawer-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Dr. / Mr. / Ms. Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`enquiry-field-input ${formErrors.name ? 'has-error' : ''}`}
                  disabled={submitting}
                />
                {formErrors.name && (
                  <div className="enquiry-field-error-text">{formErrors.name}</div>
                )}
              </div>

              {/* Email Address */}
              <div className="enquiry-field-group">
                <label className="enquiry-field-label" htmlFor="enquiry-drawer-email">
                  Email Address <span className="enquiry-field-req">*</span>
                </label>
                <input
                  id="enquiry-drawer-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="doctor@hospital.org or personal email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`enquiry-field-input ${formErrors.email ? 'has-error' : ''}`}
                  disabled={submitting}
                />
                {formErrors.email && (
                  <div className="enquiry-field-error-text">{formErrors.email}</div>
                )}
              </div>

              {/* Phone Number */}
              <div className="enquiry-field-group">
                <label className="enquiry-field-label" htmlFor="enquiry-drawer-phone">
                  Phone Number <span className="enquiry-field-req">*</span>
                </label>
                <input
                  id="enquiry-drawer-phone"
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`enquiry-field-input ${formErrors.phone ? 'has-error' : ''}`}
                  disabled={submitting}
                />
                {formErrors.phone && (
                  <div className="enquiry-field-error-text">{formErrors.phone}</div>
                )}
              </div>

              {/* Hospital / Clinic / Company */}
              <div className="enquiry-field-group">
                <label className="enquiry-field-label" htmlFor="enquiry-drawer-company">
                  Hospital / Clinic / Organization <span style={{ color: '#888', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  id="enquiry-drawer-company"
                  type="text"
                  name="company"
                  placeholder="Apollo Hospitals, Fortis, Private Practice..."
                  value={formData.company}
                  onChange={handleChange}
                  className="enquiry-field-input"
                  disabled={submitting}
                />
              </div>

              {/* Message / Requirements */}
              <div className="enquiry-field-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="enquiry-field-label" htmlFor="enquiry-drawer-message">
                    Enquiry Details <span className="enquiry-field-req">*</span>
                  </label>
                  {!drawerProduct && !isSelectingProduct && (
                    <button
                      type="button"
                      className="enquiry-context-action-btn"
                      onClick={() => setIsSelectingProduct(true)}
                    >
                      + Tag a Product
                    </button>
                  )}
                </div>
                <textarea
                  id="enquiry-drawer-message"
                  name="message"
                  rows={4}
                  placeholder="Please describe your product requirement, quantity, delivery location or requested specifications..."
                  value={formData.message}
                  onChange={handleChange}
                  className={`enquiry-field-input enquiry-field-textarea ${formErrors.message ? 'has-error' : ''}`}
                  disabled={submitting}
                />
                {formErrors.message && (
                  <div className="enquiry-field-error-text">{formErrors.message}</div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="enquiry-submit-btn"
                disabled={submitting}
                id="floating-enquiry-submit"
              >
                {submitting ? (
                  <>
                    <span className="enquiry-submit-spinner" />
                    <span>Submitting Enquiry...</span>
                  </>
                ) : (
                  <>
                    <span>✉ Send Product Enquiry</span>
                  </>
                )}
              </button>

              <p className="enquiry-privacy-note">
                🔒 Your contact details are kept strictly confidential and used solely by Sriyas Healthcare for processing your medical enquiry.
              </p>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}
