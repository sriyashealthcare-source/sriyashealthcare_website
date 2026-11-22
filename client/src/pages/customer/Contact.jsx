import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { enquiryService } from '../../services/enquiryService';
import { trackAnalyticsEvent } from '../../utils/session';
import SeoHead from '../../components/common/SeoHead';
import { SRIYAS_EMBLEM_URL, STOREFRONT_LOCATION_URL } from '../../utils/cloudinaryAssets';
import { useContactInfo } from '../../context/ContactContext';

export default function Contact() {
  const {
    contactInfo,
    primaryPhone,
    primaryEmail,
    primaryAddress,
    primaryOfficeImage,
    phones,
    whatsapps,
    emails,
    addresses,
    workingHours,
    registrations,
    socialLinks,
    officeImages,
    googleMapsUrl,
    buildWhatsAppLink
  } = useContactInfo();

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

  // Filter active, contact-page visible items
  const visiblePhones = useMemo(
    () => phones.filter((p) => p.isActive !== false && p.showOnContactPage !== false),
    [phones]
  );

  const visibleWhatsapps = useMemo(
    () => whatsapps.filter((w) => w.isActive !== false && w.showOnContactPage !== false),
    [whatsapps]
  );

  const visibleEmails = useMemo(
    () => emails.filter((e) => e.isActive !== false && e.showOnContactPage !== false),
    [emails]
  );

  const visibleAddresses = useMemo(
    () => addresses.filter((a) => a.isActive !== false && a.showOnContactPage !== false),
    [addresses]
  );

  const visibleRegistrations = useMemo(
    () =>
      registrations.filter(
        (r) =>
          r.isActive !== false &&
          (r.displayLocation === 'both' || r.displayLocation === 'contact_page')
      ),
    [registrations]
  );

  // Schema generation
  const contactSchemas = useMemo(() => [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sriyashealthcare.com/' },
        { '@type': 'ListItem', position: 2, name: 'Contact Us', item: 'https://sriyashealthcare.com/contact' }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'WholesaleStore'],
      '@id': 'https://sriyashealthcare.com/#localbusiness',
      name: contactInfo.companyName || 'Sriyas Healthcare Private Limited',
      image: SRIYAS_EMBLEM_URL,
      url: 'https://sriyashealthcare.com/contact',
      telephone: primaryPhone?.number ? `+91${primaryPhone.number.replace(/[^0-9]/g, '')}` : '+919600804456',
      priceRange: '$$',
      description:
        'Authorized distributor of surgical sutures, tissue adhesives, hernia meshes, and wound care devices in Chennai, Tamil Nadu, India.',
      address: {
        '@type': 'PostalAddress',
        streetAddress: primaryAddress?.line1 || 'Plot No.53A, First Floor, East Facing, Oil Mill Road, Maruthi Nagar, Karambakkam, Thundalam',
        addressLocality: primaryAddress?.city || 'Chennai',
        addressRegion: primaryAddress?.state || 'Tamil Nadu',
        postalCode: primaryAddress?.pincode || '600077',
        addressCountry: 'IN'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '13.0458',
        longitude: '80.1472'
      }
    }
  ], [contactInfo.companyName, primaryPhone, primaryAddress]);

  return (
    <>
      <SeoHead
        title="Contact Sriyas Healthcare | Medical Distributor in Chennai, India"
        description="Contact Sriyas Healthcare Private Limited in Chennai for hospital supplies, surgical product quotes, clinical enquiries, and distribution partnerships. Call +91 96008 04456."
        canonicalPath="/contact"
        ogType="website"
        schema={contactSchemas}
      />

      <section className="contact-section" id="contact-section" aria-label="Contact Information">
        <div style={{ maxWidth: '1100px', margin: '0 auto 16px', padding: '0 16px' }}>
          <nav className="partner-breadcrumbs" aria-label="Breadcrumbs">
            <Link to="/" className="breadcrumb-link">
              Home
            </Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Contact Us</span>
          </nav>
        </div>

        <div className="contact-header">
          <div className="eyebrow">Reach Us</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', color: 'var(--ink)', margin: '8px 0 12px' }}>
            Contact Sriyas Healthcare
          </h1>
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

        {/* Central Dynamic Contact Information Grid */}
        <div className="contact-grid">
          {/* Company Profile Card */}
          <div className="contact-card">
            <div className="contact-icon" aria-hidden="true">🏢</div>
            <h3>Company</h3>
            <p style={{ fontWeight: 600, color: 'var(--ink)' }}>
              {contactInfo.companyName || 'Sriyas Healthcare Private Limited'}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-mute)', marginTop: '4px' }}>
              {contactInfo.tagline || 'Empowering Healthcare with Care and Innovation.'}
            </p>
          </div>

          {/* Dynamic Office Address Cards */}
          {visibleAddresses.map((addr) => (
            <div className="contact-card" key={addr.id || addr.line1}>
              <div className="contact-icon" aria-hidden="true">📍</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                <h3 style={{ margin: 0 }}>{addr.officeName}</h3>
                {addr.officeType && (
                  <span style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-deep)', borderRadius: '3px', fontWeight: 700 }}>
                    {addr.officeType}
                  </span>
                )}
              </div>
              <p>
                {addr.line1}
                {addr.line2 && <><br />{addr.line2}</>}
                {addr.area && <><br />{addr.area}</>}
                <br />
                {addr.city} &ndash; {addr.pincode}, {addr.state}, {addr.country}
              </p>
              {addr.googleMapsUrl && (
                <div style={{ marginTop: '10px' }}>
                  <a
                    href={addr.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.82rem', color: 'var(--gold-dark)', fontWeight: 600 }}
                  >
                    📍 View on Google Maps ↗
                  </a>
                </div>
              )}
            </div>
          ))}

          {/* Dynamic Phone Numbers */}
          {visiblePhones.map((phone) => {
            const cleanNum = (phone.number || '').replace(/[^0-9]/g, '');
            const code = phone.countryCode || '+91';
            const disp = phone.displayPhone || `${code} ${cleanNum}`;
            const tel = phone.clickUrl || `tel:${code}${cleanNum}`;
            return (
              <div className="contact-card" key={phone.id || phone.number}>
                <div className="contact-icon" aria-hidden="true">📞</div>
                <h3>{phone.label}</h3>
                <div>
                  {phone.enableClickToCall !== false ? (
                    <a
                      href={tel}
                      aria-label={`Call Sriyas Healthcare at ${disp}`}
                      style={{ fontSize: '1.05rem', fontWeight: 600 }}
                    >
                      {disp}
                    </a>
                  ) : (
                    <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{disp}</span>
                  )}
                </div>
                {phone.purpose && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-mute)', marginTop: '4px' }}>
                    {phone.purpose}
                  </p>
                )}
              </div>
            );
          })}

          {/* Dynamic WhatsApp Channels */}
          {visibleWhatsapps.map((wa) => {
            const waClean = (wa.number || '').replace(/[^0-9]/g, '');
            const chatUrl = buildWhatsAppLink(wa.prefilledMessage);
            return (
              <div className="contact-card" key={wa.id || wa.number}>
                <div className="contact-icon" aria-hidden="true">💬</div>
                <h3>{wa.label}</h3>
                <div>
                  <a
                    href={chatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Chat with Sriyas Healthcare on WhatsApp at ${wa.number}`}
                    style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--gold-dark)' }}
                  >
                    💬 WhatsApp: +{waClean} ↗
                  </a>
                </div>
                {wa.department && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-mute)', marginTop: '4px' }}>
                    {wa.department}
                  </p>
                )}
              </div>
            );
          })}

          {/* Dynamic Email Addresses */}
          {visibleEmails.map((email) => {
            const mailto = email.mailtoUrl || `mailto:${email.email}`;
            return (
              <div className="contact-card" key={email.id || email.email}>
                <div className="contact-icon" aria-hidden="true">✉</div>
                <h3>{email.label}</h3>
                <div>
                  {email.enableMailto !== false ? (
                    <a
                      href={mailto}
                      aria-label={`Email Sriyas Healthcare at ${email.email}`}
                      style={{ fontWeight: 600 }}
                    >
                      {email.email}
                    </a>
                  ) : (
                    <span style={{ fontWeight: 600 }}>{email.email}</span>
                  )}
                </div>
                {email.department && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-mute)', marginTop: '4px' }}>
                    {email.department}
                  </p>
                )}
              </div>
            );
          })}

          {/* Operating Hours Card */}
          {workingHours && workingHours.isActive !== false && (
            <div className="contact-card">
              <div className="contact-icon" aria-hidden="true">🕒</div>
              <h3>Working Hours</h3>
              <p style={{ fontWeight: 600, color: 'var(--ink)' }}>
                {workingHours.workingDays || 'Monday – Saturday'}
                <br />
                {workingHours.openingTime} &ndash; {workingHours.closingTime}
              </p>
              {workingHours.specialDays && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-mute)', marginTop: '4px' }}>
                  {workingHours.specialDays}
                </p>
              )}
              {workingHours.holidays && (
                <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '2px' }}>
                  {workingHours.holidays}
                </p>
              )}
              {workingHours.temporaryClosureMessage && (
                <div style={{ marginTop: '8px', padding: '6px', background: 'rgba(212, 175, 55, 0.15)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--gold-deep)', fontWeight: 600 }}>
                  ⚠️ {workingHours.temporaryClosureMessage}
                </div>
              )}
            </div>
          )}

          {/* Company Registration Cards (GSTIN, DL No, etc.) */}
          {visibleRegistrations.map((reg) => (
            <div className="contact-card" key={reg.id || reg.label}>
              <div className="contact-icon" aria-hidden="true">
                {reg.label.toUpperCase().includes('GST') ? '🧾' : '📄'}
              </div>
              <h3>{reg.label}</h3>
              <p style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)' }}>
                {reg.value}
              </p>
            </div>
          ))}

          {/* Social Profiles Card */}
          {socialLinks && socialLinks.length > 0 && (
            <div className="contact-card">
              <div className="contact-icon" aria-hidden="true">🌐</div>
              <h3>Connect Online</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {socialLinks.map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.88rem', color: 'var(--gold-dark)', fontWeight: 600, textTransform: 'capitalize' }}
                  >
                    ↗ {s.label || s.platform}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Office Location & Photographs */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px' }}>
          {officeImages && officeImages.length > 1 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {officeImages.map((img) => (
                <div key={img.id} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(169, 130, 44, 0.25)', boxShadow: 'var(--shadow-card)' }}>
                  <img
                    src={img.url}
                    alt={img.alt || 'Sriyas Healthcare Office Facility'}
                    style={{ width: '100%', height: '220px', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  {img.caption && (
                    <div style={{ padding: '8px 12px', background: '#fff', fontSize: '0.82rem', color: 'var(--text-mute)', textAlign: 'center' }}>
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <a
              className="map-wrap"
              href={googleMapsUrl || 'https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Sriyas Healthcare corporate office location in Google Maps"
            >
              <img
                className="map-photo"
                src={primaryOfficeImage?.url || STOREFRONT_LOCATION_URL}
                alt={primaryOfficeImage?.alt || 'Sriyas Healthcare storefront location in Chennai'}
                loading="lazy"
              />
              <span className="map-overlay">📍 View Location on Google Maps</span>
            </a>
          )}

          <div className="map-link-wrap">
            <a
              className="map-link"
              href={googleMapsUrl || 'https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw'}
              target="_blank"
              rel="noopener noreferrer"
            >
              📍 Open Registered Office in Google Maps ↗
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
