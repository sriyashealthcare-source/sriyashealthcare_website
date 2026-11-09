import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar/Navbar';
import Footer from '../components/footer/Footer';
import { initializeAnalyticsSession, trackAnalyticsEvent } from '../utils/session';

export default function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastTrackedPath = useRef('');

  useEffect(() => {
    initializeAnalyticsSession();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (lastTrackedPath.current !== location.pathname) {
      lastTrackedPath.current = location.pathname;
      // Slight delay so document.title has updated
      const timer = setTimeout(() => {
        trackAnalyticsEvent('page_view', {
          pagePath: location.pathname,
          pageTitle: document.title
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Support legacy hash links from the original single-file website
  useEffect(() => {
    const hash = location.hash;
    if (!hash) return;
    if (hash === '#home') {
      navigate('/', { replace: true });
    } else if (hash === '#products') {
      navigate('/products', { replace: true });
    } else if (hash.startsWith('#products-')) {
      const brand = hash.replace('#products-', '');
      navigate(`/products?brand=${encodeURIComponent(brand)}`, { replace: true });
    } else if (hash.startsWith('#detail-')) {
      const prodId = hash.replace('#detail-', '');
      navigate(`/products/${encodeURIComponent(prodId)}`, { replace: true });
    } else if (hash === '#contact') {
      navigate('/contact', { replace: true });
    }
  }, [location.hash, navigate]);

  return (
    <div className="customer-layout">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="customer-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

