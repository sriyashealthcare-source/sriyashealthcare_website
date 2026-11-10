import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { resolveAssetUrl } from '../../utils/session';

export default function Partners() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Our Partners | Sriyas Healthcare Pvt Ltd';

    // Set meta description for SEO
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content =
      'Explore world-class healthcare and surgical manufacturer partners represented by Sriyas Healthcare across India.';
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await productService.getPublicBrands();
      const activeBrands = (response?.brands || []).filter(b => b.isActive !== false);
      setBrands(activeBrands);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load our partner manufacturers at this moment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  return (
    <section className="partners-page" id="partners-page" aria-label="Our Manufacturer Partners">
      <div className="section-header partners-page-header">
        <div className="partners-eyebrow">AUTHORIZED MEDICAL DISTRIBUTOR</div>
        <h2>OUR PARTNERS</h2>
        <p>
          We partner with world-class manufacturers to bring premium surgical and healthcare products
          to providers across India. Select a partner below to explore their dedicated product catalogue.
        </p>
        <div className="gold-accent-line" />
      </div>

      <div className="partners-container">
        {loading && (
          <div className="state-container" style={{ minHeight: '380px' }}>
            <div className="spinner" />
            <div className="state-title">Loading Partner Directory</div>
            <p className="state-desc">Connecting to verified healthcare manufacturers...</p>
          </div>
        )}

        {error && !loading && (
          <div className="state-container" style={{ minHeight: '380px' }}>
            <div className="state-title">Unable to Load Partners</div>
            <p className="state-desc">{error}</p>
            <button type="button" onClick={fetchPartners} className="hero-cta" style={{ border: 'none' }}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && brands.length === 0 && (
          <div className="state-container" style={{ minHeight: '380px' }}>
            <div className="state-title">No Partners Available</div>
            <p className="state-desc">
              Our partner catalogue is currently being updated. Please check back shortly or contact our team directly.
            </p>
            <Link to="/contact" className="hero-cta">
              Contact Us
            </Link>
          </div>
        )}

        {!loading && !error && brands.length > 0 && (
          <div className="partners-grid" role="list">
            {brands.map((brand) => {
              const brandLogoUrl = brand.logoUrl ? resolveAssetUrl(brand.logoUrl) : '';
              const count = brand.productCount;
              const hasCount = count !== undefined && count !== null;

              return (
                <Link
                  key={brand._id || brand.slug}
                  to={`/products/${encodeURIComponent(brand.slug)}`}
                  className="partner-card"
                  role="listitem"
                  aria-label={`View ${brand.name} product catalogue`}
                >
                  <div className="partner-card-header">
                    <div className="partner-card-logo-wrap">
                      {brandLogoUrl ? (
                        <img
                          src={brandLogoUrl}
                          alt={`${brand.name} logo`}
                          className="partner-card-logo"
                          loading="lazy"
                        />
                      ) : (
                        <div className="partner-card-fallback-badge">
                          <span className="partner-card-fallback-icon" aria-hidden="true">
                            {brand.icon || '🔬'}
                          </span>
                          <span className="partner-card-fallback-text">{brand.name}</span>
                        </div>
                      )}
                    </div>

                    {hasCount && (
                      <span className="partner-count-badge">
                        {count} {count === 1 ? 'Product' : 'Products'}
                      </span>
                    )}
                  </div>

                  <div className="partner-card-body">
                    <h3 className="partner-card-title">{brand.name}</h3>

                    {brand.description ? (
                      <p className="partner-card-desc">{brand.description}</p>
                    ) : (
                      <p className="partner-card-desc partner-card-desc-placeholder">
                        Explore precision healthcare and surgical solutions engineered by {brand.name}.
                      </p>
                    )}
                  </div>

                  <div className="partner-card-footer">
                    <span className="partner-card-cta">
                      <span>Explore Products</span>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path
                          d="M3.75 9h10.5M9.75 4.5L14.25 9l-4.5 4.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

