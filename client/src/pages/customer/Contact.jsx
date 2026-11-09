import React, { useState, useEffect } from 'react';
import { enquiryService } from '../../services/enquiryService';
import { trackAnalyticsEvent } from '../../utils/session';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    subject: 'Healthcare Solutions & Product Enquiry',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    document.title = 'Contact Us | Sriyas Healthcare Pvt Ltd';
    trackAnalyticsEvent('page_view', { pageTitle: 'Contact Us' });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in all required fields (Name, Phone, Email, Message).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await enquiryService.submitEnquiry(formData);
      if (res && res.success) {
        setStatusMessage(res.message || 'Thank you! Your enquiry has been received.');
        setFormData({
          name: '',
          phone: '',
          email: '',
          company: '',
          subject: 'Healthcare Solutions & Product Enquiry',
          message: ''
        });
      } else {
        setErrorMessage(res?.message || 'Could not submit your enquiry. Please try again.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Network error submitting enquiry. Please call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="contact-section" id="contact-section" aria-label="Contact Information">
      <div className="contact-header">
        <div className="eyebrow">Reach Us</div>
        <h2>Contact Sriyas Healthcare</h2>
        <p>
          We&apos;re here to help. Reach out to us through any of the channels below or submit
          your product requirements using our secure enquiry form.
        </p>
      </div>

      {/* Online Enquiry Form Card */}
      <div className="enquiry-form-card">
        <div className="enquiry-form-header">
          <h3>Send Us an Enquiry</h3>
          <p>
            Interested in medical supplies, surgical instruments or partnership? Send us your
            details and our healthcare specialist team will respond promptly.
          </p>
        </div>

        {statusMessage && (
          <div className="enquiry-alert enquiry-alert-success" role="alert">
            ✓ {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div className="enquiry-alert enquiry-alert-error" role="alert">
            ⚠ {errorMessage}
          </div>
        )}

        <form className="enquiry-form" onSubmit={handleSubmit} noValidate>
          <div className="enquiry-form-grid">
            <div>
              <label htmlFor="enquiry-name">
                Full Name <span className="req">*</span>
              </label>
              <input
                id="enquiry-name"
                name="name"
                type="text"
                placeholder="Dr. / Mr. / Ms. Your Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="enquiry-phone">
                Phone Number <span className="req">*</span>
              </label>
              <input
                id="enquiry-phone"
                name="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="enquiry-email">
                Email Address <span className="req">*</span>
              </label>
              <input
                id="enquiry-email"
                name="email"
                type="email"
                placeholder="your.email@hospital.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="enquiry-company">
                Hospital / Clinic / Organization
              </label>
              <input
                id="enquiry-company"
                name="company"
                type="text"
                placeholder="Hospital or Institution name (optional)"
                value={formData.company}
                onChange={handleChange}
              />
            </div>

            <div className="enquiry-field-full">
              <label htmlFor="enquiry-subject">
                Subject
              </label>
              <input
                id="enquiry-subject"
                name="subject"
                type="text"
                placeholder="Product Inquiry / Bulk Order / Quotation Request"
                value={formData.subject}
                onChange={handleChange}
              />
            </div>

            <div className="enquiry-field-full">
              <label htmlFor="enquiry-message">
                Message / Requirement Details <span className="req">*</span>
              </label>
              <textarea
                id="enquiry-message"
                name="message"
                rows="4"
                placeholder="Please describe the products, quantities or surgical solutions you are interested in..."
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="enquiry-actions">
            <button
              type="submit"
              className="enquiry-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting Enquiry...' : 'Submit Enquiry'}
            </button>
            <p className="enquiry-privacy-note">
              🔒 Your contact information is kept strictly confidential and used solely by Sriyas Healthcare representatives to address your requirements.
            </p>
          </div>
        </form>
      </div>

      {/* Existing Company Info Cards */}
      <div className="contact-grid">
        <div className="contact-card">
          <div className="contact-icon">🏢</div>
          <h3>Company</h3>
          <p>Sriyas Healthcare Private Limited</p>
        </div>

        <div className="contact-card">
          <div className="contact-icon">📍</div>
          <h3>Address</h3>
          <p>
            Plot No.53A, First Floor,
            <br />
            East Facing, Oil Mill Road,
            <br />
            Maruthi Nagar, Karambakkam,
            <br />
            Thundalam, Chennai - 600077
          </p>
        </div>

        <div className="contact-card">
          <div className="contact-icon">📞</div>
          <h3>Phone</h3>
          <a href="tel:+919600804456">9600804456</a>
          <br />
          <a href="tel:+919367772801">9367772801</a>
        </div>

        <div className="contact-card">
          <div className="contact-icon">✉</div>
          <h3>Email</h3>
          <a href="mailto:Sriyashealthcare@gmail.com">Sriyashealthcare@gmail.com</a>
        </div>

        <div className="contact-card">
          <div className="contact-icon">🧾</div>
          <h3>GST</h3>
          <p>33ABQCS4744P1ZJ</p>
        </div>

        <div className="contact-card">
          <div className="contact-icon">📄</div>
          <h3>DL No</h3>
          <p>
            TN/Z04/20B/01443 &amp;
            <br />
            TN/Z04/21B/01443
          </p>
        </div>
      </div>

      <a
        className="map-wrap"
        href="https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open our location in Google Maps"
      >
        <img
          className="map-photo"
          src="/assets/contact/storefront-location.jpg"
          alt="Sriyas Healthcare storefront location"
          loading="lazy"
        />
        <span className="map-overlay">📍 View Location</span>
      </a>

      <div className="map-link-wrap">
        <a
          className="map-link"
          href="https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw"
          target="_blank"
          rel="noopener noreferrer"
        >
          📍 Open in Google Maps
        </a>
      </div>
    </section>
  );
}
