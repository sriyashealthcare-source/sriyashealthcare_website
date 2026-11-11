import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useHomepageScroll } from '../../context/HomepageScrollContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const {
    isHomepage,
    isMorphEnabled,
    scrollProgress,
    registerNavImgRef,
    registerNavTextRef,
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

  const isProductsActive =
    location.pathname.startsWith('/products') || location.pathname.startsWith('/product/');

  const isHeroTopTransparent = isMorphEnabled && scrollProgress < 0.72;
  const isEmblemDocked = !isMorphEnabled || scrollProgress >= 0.985;

  // Text cross-fades cleanly in the final 28% of the morph journey
  const navTextOpacity = !isMorphEnabled
    ? 1
    : scrollProgress <= 0.72
      ? 0
      : Math.min(1, (scrollProgress - 0.72) / 0.25);

  return (
    <nav
      className={`navbar ${scrolled && !isHeroTopTransparent ? 'scrolled' : ''} ${
        isHomepage && isHeroTopTransparent ? 'navbar--hero-top' : ''
      }`}
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
      >
        <div className="nav-logo-brand">
          <img
            ref={registerNavImgRef}
            src={brandMedia?.url || '/assets/logos/sriyas-emblem.png'}
            alt={brandMedia?.alt || 'Sriyas Healthcare emblem'}
            style={{ opacity: isEmblemDocked ? 1 : 0 }}
          />
          <span
            ref={registerNavTextRef}
            className="nav-logo-text"
            style={{ opacity: navTextOpacity }}
          >
            SRIYAS HEALTHCARE<small>PVT LTD</small>
          </span>
        </div>
        <span
          className="nav-tagline"
          style={{ opacity: navTextOpacity }}
        >
          Empowering Healthcare with Care and Innovation
        </span>
      </Link>

      <ul className="nav-links">
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
    </nav>
  );
}

