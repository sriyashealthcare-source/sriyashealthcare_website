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

  // Memoized Statutory Registrations
  const gstinRecord = useMemo(
    () =>
      registrations.find((r) => r.isActive !== false && r.label?.toUpperCase().includes('GST')) || {
        label: 'GSTIN',
        value: '33ABQCS4744P1ZJ'
      },
    [registrations]
  );

  const dlRecords = useMemo(() => {
    const dl1 = registrations.find(
      (r) =>
        r.isActive !== false &&
        (r.id === 'reg-dl-1' || r.label?.includes('20B') || r.label?.includes('DL 1') || r.label?.includes('Licence 1'))
    );
    const dl2 = registrations.find(
      (r) =>
        r.isActive !== false &&
        (r.id === 'reg-dl-2' || r.label?.includes('21B') || r.label?.includes('DL 2') || r.label?.includes('Licence 2'))
    );
    const dlCombined = registrations.find(
      (r) => r.isActive !== false && (r.id === 'reg-dl' || r.label?.toUpperCase().includes('DRUG'))
    );

    let val1 = dl1?.value;
    let val2 = dl2?.value;

    if (!val1 && dlCombined?.value) {
      val1 = dlCombined.value.split('&')[0]?.trim();
    }
    if (!val2 && dlCombined?.value) {
      val2 = dlCombined.value.split('&')[1]?.trim();
    }

    return {
      dl1: val1 || 'TN/Z04/20B/01443',
      dl2: val2 || 'TN/Z04/21B/01443'
    };
  }, [registrations]);

  // Active Main Office Phones for the combined Phone Tile
  const mainOfficePhones = useMemo(() => {
    const active = phones.filter((p) => p.isActive !== false);
    if (active.length >= 2) return active.slice(0, 2);
    if (active.length === 1) {
      return [
        active[0],
        {
          id: 'phone-secondary-fallback',
          label: 'Main Office',
          countryCode: '+91',
          number: '9367772801',
          purpose: 'General Enquiries',
          enableClickToCall: true
        }
      ];
    }
    return [
      {
        id: 'phone-1-default',
        label: 'Main Office',
        countryCode: '+91',
        number: '9600804456',
        purpose: 'General & Institutional Enquiries',
        enableClickToCall: true
      },
      {
        id: 'phone-2-default',
        label: 'Main Office',
        countryCode: '+91',
        number: '9367772801',
        purpose: 'General Enquiries',
        enableClickToCall: true
      }
    ];
  }, [phones]);

  const activeWhatsApp = useMemo(() => {
    return (
      whatsapps.find((w) => w.isActive !== false) || {
        label: 'Official WhatsApp Support',
        number: '919600804456',
        department: 'Healthcare Solutions & Product Assistance'
      }
    );
  }, [whatsapps]);

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

        {/* Exactly 5 Tiles in One Horizontal Row on Desktop */}
        <div className="contact-grid" aria-label="Official Corporate Contact Channels">
          {/* Tile 1: Corporate Office & Distribution Centre */}
          <div className="contact-card contact-card-address">
            <div className="contact-icon" aria-hidden="true">📍</div>
            <h3>{primaryAddress?.officeName || 'Corporate Office & Distribution Centre'}</h3>
            <div className="contact-card-body">
              <p className="contact-address-text">
                {primaryAddress?.line1 || 'Plot No.53A, First Floor, East Facing, Oil Mill Road'}
                {primaryAddress?.line2 && <><br />{primaryAddress.line2}</>}
                {primaryAddress?.area && <><br />{primaryAddress.area}</>}
                <br />
                {primaryAddress?.city || 'Chennai'} &ndash; {primaryAddress?.pincode || '600077'}, {primaryAddress?.state || 'Tamil Nadu'}, {primaryAddress?.country || 'India'}
              </p>
            </div>
            <div className="contact-card-footer">
              <a
                href={primaryAddress?.googleMapsUrl || googleMapsUrl || 'https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw'}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-card-action-link"
                aria-label="View Sriyas Healthcare corporate office on Google Maps"
              >
                📍 View on Google Maps ↗
              </a>
            </div>
          </div>

          {/* Tile 2: Main Office – Contact Numbers (Combined) */}
          <div className="contact-card contact-card-phones">
            <div className="contact-icon" aria-hidden="true">📞</div>
            <h3>Main Office &ndash; Contact Numbers</h3>
            <div className="contact-card-body contact-phones-stack">
              {mainOfficePhones.map((phone, idx) => {
                const cleanNum = (phone.number || '').replace(/[^0-9]/g, '');
                const code = phone.countryCode || '+91';
                const disp = phone.displayPhone || `${code} ${cleanNum}`;
                const tel = phone.clickUrl || `tel:${code}${cleanNum}`;
                return (
                  <div key={phone.id || idx} className={`contact-phone-block ${idx > 0 ? 'contact-phone-divider' : ''}`}>
                    {phone.enableClickToCall !== false ? (
                      <a
                        href={tel}
                        className="contact-phone-link"
                        aria-label={`Call Sriyas Healthcare ${phone.purpose || 'Main Office'} at ${disp}`}
                      >
                        {disp}
                      </a>
                    ) : (
                      <span className="contact-phone-link">{disp}</span>
                    )}
                    <span className="contact-phone-desc">
                      {phone.purpose || (idx === 0 ? 'General & Institutional Enquiries' : 'General Enquiries')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tile 3: Official WhatsApp Support */}
          <div className="contact-card contact-card-whatsapp">
            <div className="contact-icon" aria-hidden="true">💬</div>
            <h3>{activeWhatsApp.label || 'Official WhatsApp Support'}</h3>
            <div className="contact-card-body">
              {(() => {
                const waNum = (activeWhatsApp.number || '919600804456').replace(/[^0-9]/g, '');
                const waDisplay = waNum.startsWith('91') && waNum.length === 12
                  ? `+91 ${waNum.slice(2)}`
                  : `+${waNum}`;
                const waLink = buildWhatsAppLink(activeWhatsApp.prefilledMessage);
                return (
                  <div className="contact-wa-block">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-wa-link"
                      aria-label={`Chat with Sriyas Healthcare on WhatsApp at ${waDisplay}`}
                    >
                      💬 WhatsApp: {waDisplay} ↗
                    </a>
                    <span className="contact-wa-desc">
                      {activeWhatsApp.department || 'Healthcare Solutions & Product Assistance'}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Tile 4: GSTIN */}
          <div className="contact-card contact-card-gstin">
            <div className="contact-icon" aria-hidden="true">🧾</div>
            <h3>GSTIN</h3>
            <div className="contact-card-body">
              <div className="contact-mono-badge">
                {gstinRecord.value || '33ABQCS4744P1ZJ'}
              </div>
              <span className="contact-reg-desc">
                Goods &amp; Services Tax Identification Number
              </span>
            </div>
          </div>

          {/* Tile 5: Drug Licence (DL) No. */}
          <div className="contact-card contact-card-dl">
            <div className="contact-icon" aria-hidden="true">📄</div>
            <h3>Drug Licence (DL) No.</h3>
            <div className="contact-card-body">
              <div className="contact-dl-stack">
                <div className="contact-dl-row">
                  <span className="dl-badge">Form 20B:</span>
                  <span className="dl-code">{dlRecords.dl1}</span>
                </div>
                <div className="contact-dl-row">
                  <span className="dl-badge">Form 21B:</span>
                  <span className="dl-code">{dlRecords.dl2}</span>
                </div>
              </div>
              <span className="contact-reg-desc">
                Government of Tamil Nadu Drugs Control Dept.
              </span>
            </div>
          </div>
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
