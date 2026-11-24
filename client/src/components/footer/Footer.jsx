import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SRIYAS_EMBLEM_URL } from '../../utils/cloudinaryAssets';
import { useContactInfo } from '../../context/ContactContext';
import { productService } from '../../services/productService';

const DEFAULT_PARTNER_PORTFOLIOS = [
  { slug: 'ams', name: 'Advanced Medical Solutions', specialty: 'Surgical & Wound Care' },
  { slug: 'peters', name: 'Peters Surgical', specialty: 'Sutures & Mesh' },
  { slug: 'liquiband', name: 'LiquiBand®', specialty: 'Tissue Adhesives' },
  { slug: 'cutimed', name: 'Cutimed® Sorbact®', specialty: 'Wound Care' },
  { slug: 'gentacoll', name: 'Genta-Coll® resorb', specialty: 'Haemostasis' },
  { slug: 'gore', name: 'W. L. Gore', specialty: 'Biomaterials' }
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const {
    contactInfo,
    primaryPhone,
    primaryEmail,
    primaryAddress,
    phones,
    emails,
    workingHours,
    registrations,
    socialLinks
  } = useContactInfo();

  // Dynamic Partner Portfolios list (connected to Admin Portal / Database)
  const [partnerPortfolios, setPartnerPortfolios] = useState(DEFAULT_PARTNER_PORTFOLIOS);
  const [partnersLoading, setPartnersLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadActivePartners = async () => {
      try {
        setPartnersLoading(true);
        const res = await productService.getPublicBrands();
        if (!isMounted) return;

        const brandList = Array.isArray(res) ? res : (res?.brands || []);
        // Strictly filter active partner brands
        const activeBrands = brandList.filter(
          (b) => b && b.isActive !== false && b.status !== 'inactive' && (b.slug || b._id)
        );

        if (activeBrands.length > 0) {
          setPartnerPortfolios(activeBrands);
        }
      } catch {
        // Fall back gracefully to DEFAULT_PARTNER_PORTFOLIOS if offline or API error
      } finally {
        if (isMounted) setPartnersLoading(false);
      }
    };

    loadActivePartners();

    // Listen to admin brand changes or tab refocussing for instant live updates
    const handleUpdate = () => loadActivePartners();
    window.addEventListener('sriyas:brands-updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('sriyas:brands-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  const getPartnerDisplayLabel = (partner) => {
    if (partner.specialty && partner.specialty.trim()) {
      return `${partner.name} (${partner.specialty.trim()})`;
    }
    if (partner.tabLabel && partner.tabLabel.trim() && partner.tabLabel.trim() !== partner.name.trim()) {
      return `${partner.name} (${partner.tabLabel.trim()})`;
    }
    return partner.name;
  };

  // Active footer phone numbers
  const footerPhones = useMemo(() => {
    const list = phones.filter((p) => p.showInFooter && p.isActive !== false);
    return list.length > 0 ? list : [primaryPhone];
  }, [phones, primaryPhone]);

  // Active footer email addresses
  const footerEmails = useMemo(() => {
    const list = emails.filter((e) => e.showInFooter && e.isActive !== false);
    return list.length > 0 ? list : [primaryEmail];
  }, [emails, primaryEmail]);

  // GSTIN identifier
  const gstinRecord = useMemo(() => {
    return (
      registrations.find((r) => r.isActive !== false && r.label.toUpperCase().includes('GST')) ||
      registrations[0] || { label: 'GSTIN', value: '33ABQCS4744P1ZJ' }
    );
  }, [registrations]);

  // Formatted hours string
  const hoursDisplay = useMemo(() => {
    if (!workingHours || workingHours.isActive === false) return null;
    if (workingHours.workingDays && workingHours.openingTime && workingHours.closingTime) {
      return `${workingHours.workingDays}: ${workingHours.openingTime} – ${workingHours.closingTime}`;
    }
    return 'Mon – Sat: 9:00 AM – 6:30 PM';
  }, [workingHours]);

  return (
    <footer className="footer" id="site-footer" role="contentinfo" aria-label="Sriyas Healthcare Corporate Footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Column 1: Company Profile & Identity */}
          <div className="footer-col footer-col--brand">
            <div className="footer-brand-lockup">
              <img
                src={SRIYAS_EMBLEM_URL}
                alt="Sriyas Healthcare Emblem"
                className="footer-emblem-img"
                width="40"
                height="40"
                loading="lazy"
                onError={(e) => {
                  if (e.currentTarget.src !== '/assets/logos/sriyas-emblem.png') {
                    e.currentTarget.src = '/assets/logos/sriyas-emblem.png';
                  }
                }}
              />
              <div className="footer-brand-text">
                <span className="footer-brand-name">SRIYAS HEALTHCARE</span>
                <span className="footer-brand-sub">PVT LTD</span>
              </div>
            </div>
            <p className="footer-tagline">
              {contactInfo.tagline || 'Empowering Healthcare with Care and Innovation.'}
            </p>
            <p className="footer-desc">
              Authorized surgical and medical distribution company in Chennai, Tamil Nadu, supplying Indian hospitals, surgeons, and healthcare institutions with verified sutures, meshes, and wound care technologies.
            </p>
            {gstinRecord && gstinRecord.value && (
              <div className="footer-meta-pill">
                <span>{gstinRecord.label}:</span> <strong>{gstinRecord.value}</strong>
              </div>
            )}
            {socialLinks && socialLinks.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                {socialLinks.map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-nav-link"
                    style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}
                  >
                    ↗ {s.label || s.platform}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Partner Portfolios & Manufacturer Links */}
          <div className="footer-col">
            <h3 className="footer-heading">Partner Portfolios</h3>
            <ul className="footer-nav-list">
              {partnerPortfolios.map((partner) => {
                const slug = partner.slug || partner._id;
                const label = getPartnerDisplayLabel(partner);
                return (
                  <li key={partner._id || slug}>
                    <Link to={`/products/${slug}`} className="footer-nav-link">
                      {label}
                    </Link>
                  </li>
                );
              })}
              {partnerPortfolios.length === 0 && !partnersLoading && (
                <li style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.82rem' }}>
                  No active partner portfolios
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Quick Navigation */}
          <div className="footer-col">
            <h3 className="footer-heading">Navigation</h3>
            <ul className="footer-nav-list">
              <li>
                <Link to="/" className="footer-nav-link">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="footer-nav-link">
                  About Sriyas Healthcare
                </Link>
              </li>
              <li>
                <Link to="/products" className="footer-nav-link">
                  Products Directory
                </Link>
              </li>
              <li>
                <Link to="/contact" className="footer-nav-link">
                  Contact &amp; Institutional Supply
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="footer-nav-link footer-nav-link--muted">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Local Contact & Chennai Office */}
          <div className="footer-col footer-col--contact">
            <h3 className="footer-heading">{primaryAddress?.officeName || 'Chennai Office'}</h3>
            <address className="footer-address">
              {primaryAddress?.line1 || 'Plot No.53A, First Floor, East Facing, Oil Mill Road'}<br />
              {(primaryAddress?.line2 || 'Maruthi Nagar, Karambakkam, Thundalam') && (
                <>{primaryAddress?.line2 || 'Maruthi Nagar, Karambakkam, Thundalam'}<br /></>
              )}
              {primaryAddress?.city || 'Chennai'} – {primaryAddress?.pincode || '600077'},<br />
              {primaryAddress?.state || 'Tamil Nadu'}, {primaryAddress?.country || 'India'}
            </address>
            <div className="footer-contact-items">
              {footerPhones.map((phone) => {
                const cleanNum = (phone.number || '').replace(/[^0-9]/g, '');
                const code = phone.countryCode || '+91';
                const disp = phone.displayPhone || `${code} ${cleanNum}`;
                const tel = phone.clickUrl || `tel:${code}${cleanNum}`;
                return (
                  <div className="footer-contact-row" key={phone.id || phone.number}>
                    <span className="footer-contact-icon" aria-hidden="true">📞</span>
                    <div>
                      {phone.enableClickToCall !== false ? (
                        <a
                          href={tel}
                          className="footer-contact-link"
                          aria-label={`Call Sriyas Healthcare at ${disp}`}
                        >
                          {disp}
                        </a>
                      ) : (
                        <span className="footer-contact-link">{disp}</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {footerEmails.map((email) => {
                const mailto = email.mailtoUrl || `mailto:${email.email}`;
                return (
                  <div className="footer-contact-row" key={email.id || email.email}>
                    <span className="footer-contact-icon" aria-hidden="true">✉</span>
                    <div>
                      {email.enableMailto !== false ? (
                        <a
                          href={mailto}
                          className="footer-contact-link"
                          aria-label={`Email Sriyas Healthcare at ${email.email}`}
                        >
                          {email.email}
                        </a>
                      ) : (
                        <span className="footer-contact-link">{email.email}</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {hoursDisplay && (
                <div className="footer-contact-row">
                  <span className="footer-contact-icon" aria-hidden="true">🕒</span>
                  <span className="footer-hours">{hoursDisplay}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            © {currentYear} <span>Sriyas Healthcare Private Limited</span>. All rights reserved.
          </div>
          <div className="footer-compliance">
            Authorized Medical &amp; Surgical Distributor · Cold-Chain &amp; Institutional Healthcare Supply
          </div>
        </div>
      </div>
    </footer>
  );
}
