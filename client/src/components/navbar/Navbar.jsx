import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

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

  return (
    <nav
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      id="navbar"
      role="navigation"
      aria-label="Main Navigation"
    >
      <Link to="/" className="nav-logo" aria-label="Sriyas Healthcare Home">
        <div className="nav-logo-brand">
          <img src="/assets/logos/sriyas-emblem.png" alt="Sriyas Healthcare emblem" />
          <span className="nav-logo-text">
            SRIYAS HEALTHCARE<small>PVT LTD</small>
          </span>
        </div>
        <span className="nav-tagline">Empowering Healthcare with Care and Innovation</span>
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

