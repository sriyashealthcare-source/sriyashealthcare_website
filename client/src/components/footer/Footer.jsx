import React from 'react';
import { Link } from 'react-router-dom';
import { SRIYAS_EMBLEM_URL } from '../../utils/cloudinaryAssets';

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
              />
              <div className="footer-brand-text">
                <span className="footer-brand-name">SRIYAS HEALTHCARE</span>
                <span className="footer-brand-sub">PVT LTD</span>
              </div>
            </div>
            <p className="footer-tagline">
              Empowering Healthcare with Care and Innovation.
            </p>
            <p className="footer-desc">
              Authorized surgical and medical distribution company in Chennai, Tamil Nadu, supplying Indian hospitals, surgeons, and healthcare institutions with verified sutures, meshes, and wound care technologies.
            </p>
            <div className="footer-meta-pill">
              <span>GSTIN:</span> <strong>33ABQCS4744P1ZJ</strong>
            </div>
          </div>

          {/* Column 2: Partner Portfolios & Manufacturer Links */}
          <div className="footer-col">
            <h3 className="footer-heading">Partner Portfolios</h3>
            <ul className="footer-nav-list">
              <li>
                <Link to="/products/peters" className="footer-nav-link">
                  Peters Surgical (Sutures &amp; Mesh)
                </Link>
              </li>
              <li>
                <Link to="/products/liquiband" className="footer-nav-link">
                  LiquiBand® (Tissue Adhesives)
                </Link>
              </li>
              <li>
                <Link to="/products/cutimed" className="footer-nav-link">
                  Cutimed® Sorbact® (Wound Care)
                </Link>
              </li>
              <li>
                <Link to="/products/gentacoll" className="footer-nav-link">
                  Genta-Coll® resorb (Haemostasis)
                </Link>
              </li>
              <li>
                <Link to="/products/gore" className="footer-nav-link">
                  W. L. Gore (Biomaterials)
                </Link>
              </li>
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
            <h3 className="footer-heading">Chennai Office</h3>
            <address className="footer-address">
              Plot No.53A, First Floor, East Facing,<br />
              Oil Mill Road, Maruthi Nagar, Karambakkam,<br />
              Thundalam, Chennai – 600077,<br />
              Tamil Nadu, India
            </address>
            <div className="footer-contact-items">
              <div className="footer-contact-row">
                <span className="footer-contact-icon" aria-hidden="true">📞</span>
                <div>
                  <a href="tel:+919600804456" className="footer-contact-link">+91 96008 04456</a>
                  <span className="footer-contact-sep">·</span>
                  <a href="tel:+919367772801" className="footer-contact-link">+91 93677 72801</a>
                </div>
              </div>
              <div className="footer-contact-row">
                <span className="footer-contact-icon" aria-hidden="true">✉</span>
                <a href="mailto:Sriyashealthcare@gmail.com" className="footer-contact-link">
                  Sriyashealthcare@gmail.com
                </a>
              </div>
              <div className="footer-contact-row">
                <span className="footer-contact-icon" aria-hidden="true">🕒</span>
                <span className="footer-hours">Mon – Sat: 9:00 AM – 6:30 PM</span>
              </div>
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
