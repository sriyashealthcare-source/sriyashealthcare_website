import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useHomepageScroll } from '../../context/HomepageScrollContext';

export default function Navbar() {
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

  const isHeroTopTransparent = isMorphEnabled && scrollProgress < 0.72 && !mobileMenuOpen;
  const isEmblemDocked = !isMorphEnabled || scrollProgress >= 0.992;

  // Reveal navbar text strictly as the travelling title settles into navbar position (0.86 -> 1.0)
  const navTextOpacity = !isMorphEnabled
    ? 1
    : scrollProgress <= 0.86
      ? 0
      : Math.min(1, (scrollProgress - 0.86) / 0.14);

  const logoSrc = brandMedia?.url || '/assets/logos/sriyas-emblem.png';
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
          className={`nav-logo ${isMorphEnabled && !isEmblemDocked ? 'nav-logo--morph-hidden' : ''}`}
          aria-label="Sriyas Healthcare Home"
          aria-hidden={isMorphEnabled && !isEmblemDocked ? 'true' : undefined}
          tabIndex={isMorphEnabled && !isEmblemDocked ? -1 : undefined}
          onClick={closeMenu}
        >
          <div className="nav-logo-brand">
            <img
              ref={registerNavImgRef}
              src={logoSrc}
              alt={logoAlt}
              onLoad={measureNavTargets}
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
            <img src={logoSrc} alt={logoAlt} />
            <div>
              <strong>{brandTitle}</strong>
              {brandSubtitle ? <small>{brandSubtitle}</small> : null}
            </div>
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
            <a href="tel:+919600804456">📞 +91 96008 04456</a>
            <a href="mailto:Sriyashealthcare@gmail.com">✉ Sriyashealthcare@gmail.com</a>
          </div>
        </div>
      </div>
    </>
  );
}
