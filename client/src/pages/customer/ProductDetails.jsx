import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { analyticsService } from '../../services/analyticsService';
import ImageGallery from '../../components/product-details/ImageGallery';
import { resolveAssetUrl } from '../../utils/session';

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const trackedRef = useRef('');

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError('');
        let res;
        try {
          res = await productService.getPublicProductBySlug(slug);
        } catch (_) {
          res = await productService.getPublicProductById(slug);
        }

        if (!isMounted) return;
        const prod = res?.product || null;
        if (!prod) {
          setError('The requested product could not be found.');
          return;
        }

        setProduct(prod);
        document.title = `${prod.name} | Sriyas Healthcare Pvt Ltd`;

        // Record persistent product view event once per product detail visit
        if (trackedRef.current !== String(prod._id)) {
          trackedRef.current = String(prod._id);
          analyticsService.trackProductView(
            prod._id,
            location.state?.fromBrand
              ? `brand:${location.state.fromBrand}`
              : document.referrer || 'catalogue'
          );
        }
      } catch (err) {
        if (!isMounted) return;
        setError(
          err.response?.data?.message || 'Product not found or no longer available.'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const brandSlug =
    product?.brand?.slug || location.state?.fromBrand || 'peters';
  const brandLabel = product?.brand?.name
    ? `${product.brand.name} Products`
    : 'Products';

  const handleBack = () => {
    navigate(`/products?brand=${encodeURIComponent(brandSlug)}`);
  };

  if (loading) {
    return (
      <section className="univ-detail" aria-label="Loading Product Details">
        <div className="state-container">
          <div className="spinner" />
          <div className="state-title">Loading Product Details</div>
          <p className="state-desc">Fetching clinical specifications and gallery...</p>
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="univ-detail" aria-label="Product Not Found">
        <div className="state-container">
          <div className="state-title">Product Not Available</div>
          <p className="state-desc">
            {error || 'The product you are looking for may have been moved or archived.'}
          </p>
          <Link to="/products" className="hero-cta">
            Return to Product Catalogue
          </Link>
        </div>
      </section>
    );
  }

  const brochureUrl = product.brochure?.url
    ? resolveAssetUrl(product.brochure.url)
    : '';
  const brochureFilename =
    product.brochure?.filename || `${product.slug || 'Product'}_Brochure.pdf`;
  const detailCategoryLabel =
    product.detailCategory ||
    (product.category?.name && product.cardCategory
      ? `${product.category.name} · ${product.cardCategory}`
      : product.category?.name || product.cardCategory || '');

  return (
    <section className="univ-detail" id="univ-detail" aria-label="Product Details">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <button type="button" className="detail-back" onClick={handleBack}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M11 14L6 9l5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span id="detail-back-label">Back to {brandLabel}</span>
        </button>
      </div>

      <div className="detail-grid">
        <ImageGallery images={product.images || []} productName={product.name} />

        <div className="detail-info-box">
          {detailCategoryLabel && (
            <div className="detail-cat-tag" id="ud-cat">
              {detailCategoryLabel}
            </div>
          )}
          <h2 id="ud-name">{product.name}</h2>
          {product.description && (
            <p className="detail-desc-text" id="ud-desc">
              {product.description}
            </p>
          )}

          <div className="detail-sep" />

          {Array.isArray(product.features) && product.features.length > 0 && (
            <div id="ud-features-wrap">
              <div className="detail-sec-lbl">Key Features</div>
              <ul className="detail-sec-list" id="ud-features">
                {product.features.map((feat, idx) => (
                  <li key={idx}>{feat}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(product.specifications) && product.specifications.length > 0 && (
            <div id="ud-specs-wrap">
              <div className="detail-sec-lbl">Specifications</div>
              <ul className="detail-sec-list" id="ud-specs">
                {product.specifications.map((spec, idx) => {
                  const text =
                    typeof spec === 'string'
                      ? spec
                      : spec.name
                      ? `${spec.name}: ${spec.value}`
                      : spec.value;
                  return <li key={idx}>{text}</li>;
                })}
              </ul>
            </div>
          )}

          {Array.isArray(product.applications) && product.applications.length > 0 && (
            <div id="ud-apps-wrap">
              <div className="detail-sec-lbl">Applications / Uses</div>
              <ul className="detail-sec-list" id="ud-apps">
                {product.applications.map((app, idx) => (
                  <li key={idx}>{app}</li>
                ))}
              </ul>
            </div>
          )}

          {brochureUrl && (
            <div className="detail-pdf-bar" id="ud-pdf-bar">
              <a
                id="ud-pdf-view"
                href={brochureUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-pdf"
                onClick={() => analyticsService.trackBrochureDownload(product._id, product.name)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect
                    x="2"
                    y="1"
                    width="9"
                    height="14"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M5 5.5h5M5 8.5h4"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                View Product Brochure
              </a>

              <a
                id="ud-pdf-dl"
                href={brochureUrl}
                download={brochureFilename}
                className="btn-pdf"
                onClick={() => analyticsService.trackBrochureDownload(product._id, product.name)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 2v8M5 8l3 3 3-3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 13h12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Download Brochure
              </a>
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            <Link
              to="/contact"
              state={{ productId: product._id, productName: product.name }}
              className="hero-cta"
              style={{ display: 'inline-flex', padding: '12px 28px', fontSize: '0.9rem' }}
            >
              ✉ Enquire About This Product
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

