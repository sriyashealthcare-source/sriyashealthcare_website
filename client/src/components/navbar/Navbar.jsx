import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useHomepageScroll } from '../../context/HomepageScrollContext';
import { useContactInfo } from '../../context/ContactContext';
import { SRIYAS_EMBLEM_URL } from '../../utils/cloudinaryAssets';
import { resolveAssetUrl } from '../../utils/session';
import { COMPANY_CONTACT } from '../../constants/contact';

export default function Navbar() {
  const { primaryPhone, primaryEmail } = useContactInfo();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const {
    isHomepage,
    isMorphEnabled,
    scrollProgress,
    registerNavImgRef,
    registerNavTextRef,
    measureNavTargets,
    brandMedia
  } = useHomepageScroll();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer whenever route changes or Escape is pressed
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Lock background scrolling and add active class to body when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-nav-open');
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.classList.remove('mobile-nav-open');
        document.body.style.overflow = prevOverflow || '';
      };
    } else {
      document.body.classList.remove('mobile-nav-open');
      document.body.style.overflow = '';
    }
    return undefined;
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const isProductsActive =
    location.pathname.startsWith('/products') || location.pathname.startsWith('/product/');

  const isHeroTopTransparent = isHomepage && scrollProgress < 0.60 && !mobileMenuOpen;
  const isEmblemDocked = !isHomepage || scrollProgress >= 0.985;

  // Reveal navbar text smoothly as the emblem approaches and docks into navbar position (0.65 -> 1.0)
  const navTextOpacity = !isHomepage
    ? 1
    : scrollProgress <= 0.65
      ? 0
      : Math.min(1, (scrollProgress - 0.65) / 0.35);

  const logoSrc = resolveAssetUrl(brandMedia?.url || SRIYAS_EMBLEM_URL);
  const logoAlt = brandMedia?.alt || 'Sriyas Healthcare emblem';
  const brandTitle = brandMedia?.companyName || 'SRIYAS HEALTHCARE';
  const brandSubtitle = brandMedia?.companySubtitle || 'PVT LTD';

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <nav
        className={`navbar ${isHomepage ? 'navbar--homepage' : ''} ${
          scrolled && !isHeroTopTransparent ? 'scrolled' : ''
        } ${isHomepage && isHeroTopTransparent ? 'navbar--hero-top' : ''}`}
        id="navbar"
        role="navigation"
        aria-label="Main Navigation"
      >
        <Link
          to="/"
          className={`nav-logo ${isHomepage && !isEmblemDocked ? 'nav-logo--morph-hidden' : ''}`}
          aria-label="Sriyas Healthcare Home"
          aria-hidden={isHomepage && !isEmblemDocked ? 'true' : undefined}
          tabIndex={isHomepage && !isEmblemDocked ? -1 : undefined}
          onClick={closeMenu}
        >
          <div className="nav-logo-brand">
            <img
              ref={registerNavImgRef}
              src={logoSrc}
              alt={logoAlt}
              className="nav-logo-emblem"
              width="46"
              height="51"
              onLoad={measureNavTargets}
              onError={(e) => {
                if (e.currentTarget.src !== '/assets/logos/sriyas-emblem.png') {
                  e.currentTarget.src = '/assets/logos/sriyas-emblem.png';
                }
              }}
              style={{ opacity: isEmblemDocked ? 1 : 0 }}
            />
            <span
              ref={registerNavTextRef}
              className="nav-logo-text"
              style={{ opacity: navTextOpacity }}
            >
              {brandTitle}
              {brandSubtitle ? <small>{brandSubtitle}</small> : null}
            </span>
          </div>
          <span
            className="nav-tagline"
            style={{ opacity: navTextOpacity }}
          >
            Empowering Healthcare with Care and Innovation
          </span>
        </Link>

        {/* Desktop & Laptop Horizontal Navigation */}
        <ul className="nav-links" aria-label="Primary Pages">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              id="nav-home"
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/products"
              className={`nav-link ${isProductsActive ? 'active' : ''}`}
              id="nav-products"
            >
              Products
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contact"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              id="nav-contact"
            >
              Contact
            </NavLink>
          </li>
        </ul>

        {/* Tablet & Mobile Hamburger Button */}
        <button
          type="button"
          className={`nav-toggle ${mobileMenuOpen ? 'is-open' : ''}`}
          id="nav-mobile-toggle"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
        </button>
      </nav>

      {/* Mobile Navigation Backdrop */}
      <div
        className={`mobile-nav-backdrop ${mobileMenuOpen ? 'is-open' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile & Tablet Slide-Down Drawer */}
      <div
        id="mobile-nav-drawer"
        className={`mobile-nav-drawer ${mobileMenuOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
        aria-hidden={!mobileMenuOpen}
      >
        <div className="mobile-nav-drawer-inner">
          <div className="mobile-nav-brand-row">
            <div className="mobile-nav-brand-identity">
              <img src={logoSrc} alt={logoAlt} />
              <div>
                <strong>{brandTitle}</strong>
                {brandSubtitle ? <small>{brandSubtitle}</small> : null}
              </div>
            </div>
            <button
              type="button"
              className="mobile-nav-close-btn"
              onClick={closeMenu}
              aria-label="Close navigation menu"
              id="mobile-nav-close-btn"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <ul className="mobile-nav-list">
            <li>
              <NavLink
                to="/"
                end
                onClick={closeMenu}
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                id="mobile-nav-home"
              >
                <span>Home</span>
                <span aria-hidden="true">→</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/products"
                onClick={closeMenu}
                className={`mobile-nav-link ${isProductsActive ? 'active' : ''}`}
                id="mobile-nav-products"
              >
                <span>Products</span>
                <span aria-hidden="true">→</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/contact"
                onClick={closeMenu}
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                id="mobile-nav-contact"
              >
                <span>Contact</span>
                <span aria-hidden="true">→</span>
              </NavLink>
            </li>
          </ul>

          <div className="mobile-nav-contact-quick">
            <a
              href={primaryPhone.clickUrl}
              aria-label={`Call Sriyas Healthcare at ${primaryPhone.displayPhone}`}
            >
              📞 {primaryPhone.displayPhone}
            </a>
            <a
              href={primaryEmail.mailtoUrl}
              aria-label={`Email Sriyas Healthcare at ${primaryEmail.email}`}
            >
              ✉ {primaryEmail.email}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
