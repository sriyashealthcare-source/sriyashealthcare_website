import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { analyticsService } from '../../services/analyticsService';
import { useEnquiry } from '../../context/EnquiryContext';
import ImageGallery from '../../components/product-details/ImageGallery';
import ProductCard from '../../components/product/ProductCard';
import SeoHead from '../../components/common/SeoHead';
import { resolveAssetUrl } from '../../utils/session';

export default function ProductDetails() {
  const { partnerSlug, productSlug, slug } = useParams();
  const effectiveProductSlug = productSlug || slug;

  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const trackedRef = useRef('');
  const { setPageProduct, openDrawer } = useEnquiry();

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!effectiveProductSlug) return;
      try {
        setLoading(true);
        setError('');
        let res;
        try {
          res = await productService.getPublicProductBySlug(effectiveProductSlug);
        } catch (_) {
          res = await productService.getPublicProductById(effectiveProductSlug);
        }

        if (!isMounted) return;
        const prod = res?.product || null;
        if (!prod) {
          setError('The requested product could not be found or has been archived.');
          return;
        }

        setProduct(prod);
        setPageProduct(prod);

        // Fetch related products from the same brand
        if (prod.brand) {
          const brandId = prod.brand.slug || prod.brand._id || prod.brand;
          productService.getPublicProducts({ brand: brandId })
            .then((bRes) => {
              if (isMounted && bRes?.products) {
                const others = bRes.products.filter(p => String(p._id) !== String(prod._id));
                setRelatedProducts(others.slice(0, 3));
              }
            })
            .catch(() => {});
        }

        // Record persistent product view event once per product detail visit
        if (trackedRef.current !== String(prod._id)) {
          trackedRef.current = String(prod._id);
          analyticsService.trackProductView(
            prod._id,
            partnerSlug || location.state?.fromBrand
              ? `brand:${partnerSlug || location.state?.fromBrand}`
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
      setPageProduct(null);
    };
  }, [effectiveProductSlug, partnerSlug, location.state]);

  const brandSlug =
    product?.brand?.slug ||
    partnerSlug ||
    location.state?.fromBrand ||
    '';
  const brandName = product?.brand?.name || (brandSlug ? brandSlug.toUpperCase() : 'Partner');
  const brandLabel = brandName ? `${brandName} Products` : 'All Products';
  const backUrl = brandSlug ? `/products/${encodeURIComponent(brandSlug)}` : '/products';

  if (loading) {
    return (
      <section className="univ-detail" aria-label="Loading Product Details">
        <div className="state-container" style={{ minHeight: '480px' }}>
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
        <div className="state-container" style={{ minHeight: '480px' }}>
          <div className="state-title">Product Not Available</div>
          <p className="state-desc">
            {error || 'The product you are looking for may have been moved or archived.'}
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {brandSlug ? (
              <Link to={`/products/${encodeURIComponent(brandSlug)}`} className="hero-cta">
                Back to {brandName} Products
              </Link>
            ) : null}
            <Link to="/products" className="detail-back" style={{ marginBottom: 0 }}>
              Return to Partner Directory
            </Link>
          </div>
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

  const seoTitle =
    product.seoTitle ||
    `${product.name} | ${brandName} | Sriyas Healthcare`;
  const seoDesc =
    product.seoDescription ||
    (product.description
      ? `${product.name} from ${brandName}: ${product.description.slice(0, 140)}... Distributed by Sriyas Healthcare.`
      : `Explore technical specifications and hospital enquiries for ${product.name} (${brandName}) from Sriyas Healthcare Chennai.`);
  const canonicalPath = `/products/${encodeURIComponent(brandSlug)}/${encodeURIComponent(product.slug || '')}`;

  const primaryImgObj =
    (product.images || []).find((img) => img.isPrimary) || (product.images || [])[0];
  const primaryImgUrl = primaryImgObj?.url ? resolveAssetUrl(primaryImgObj.url) : '';

  const jsonLdSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sriyashealthcare.com/' },
        { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://sriyashealthcare.com/products' },
        ...(brandSlug
          ? [
              {
                '@type': 'ListItem',
                position: 3,
                name: brandName,
                item: `https://sriyashealthcare.com/products/${encodeURIComponent(brandSlug)}`
              }
            ]
          : []),
        {
          '@type': 'ListItem',
          position: brandSlug ? 4 : 3,
          name: product.name,
          item: `https://sriyashealthcare.com/products/${encodeURIComponent(brandSlug)}/${encodeURIComponent(product.slug)}`
        }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: primaryImgUrl || 'https://sriyashealthcare.com/assets/logos/sriyas-emblem.png',
      description: product.description || product.shortSpecification || seoDesc,
      brand: {
        '@type': 'Brand',
        name: brandName
      },
      sku: product.legacyId || product.slug,
      category: detailCategoryLabel,
      url: `https://sriyashealthcare.com/products/${encodeURIComponent(brandSlug)}/${encodeURIComponent(product.slug)}`
    }
  ];

  return (
    <>
      <SeoHead
        title={seoTitle}
        description={seoDesc}
        canonicalPath={canonicalPath}
        ogImage={primaryImgUrl}
        ogType="product"
        schema={jsonLdSchemas}
      />

      <section className="univ-detail" id="univ-detail" aria-label="Product Details">
      <div style={{ maxWidth: '1100px', margin: '0 auto 28px' }}>
        {/* Breadcrumb Navigation: Home > Products > Partner Name > Product Name */}
        <nav className="partner-breadcrumbs" aria-label="Breadcrumbs" style={{ marginBottom: '16px' }}>
          <Link to="/" className="breadcrumb-link">
            Home
          </Link>
          <span className="breadcrumb-sep">/</span>
          <Link to="/products" className="breadcrumb-link">
            Products
          </Link>
          {brandSlug && (
            <>
              <span className="breadcrumb-sep">/</span>
              <Link to={`/products/${encodeURIComponent(brandSlug)}`} className="breadcrumb-link">
                {brandName}
              </Link>
            </>
          )}
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        {/* Back to Partner Products Button */}
        <Link to={backUrl} className="detail-back" id="detail-back-btn">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M11 14L6 9l5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span id="detail-back-label">Back to {brandLabel}</span>
        </Link>
      </div>

      <div className="detail-grid">
        <ImageGallery images={product.images || []} productName={product.name} />

        <div className="detail-info-box">
          {detailCategoryLabel && (
            <div className="detail-cat-tag" id="ud-cat">
              {detailCategoryLabel}
            </div>
          )}
          <h1 className="detail-prod-title" id="ud-name">
            {product.name}
          </h1>
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
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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

          <div style={{ marginTop: '28px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="hero-cta"
              id="enquire-prod-btn"
              onClick={() => openDrawer({ product })}
              style={{ display: 'inline-flex', padding: '13px 32px', fontSize: '0.92rem', cursor: 'pointer', border: 'none' }}
            >
              ✉ Enquire About This Product
            </button>
            <Link
              to="/contact"
              state={{ productId: product._id, productName: product.name }}
              className="detail-back"
              style={{ marginBottom: 0, padding: '12px 20px', textDecoration: 'none' }}
            >
              Full Contact Page
            </Link>
          </div>
        </div>
      </div>

      {/* Related Products from the same manufacturer/category */}
      {Array.isArray(relatedProducts) && relatedProducts.length > 0 && (
        <div style={{ maxWidth: '1100px', margin: '48px auto 0' }} className="related-products-section">
          <div className="eyebrow" style={{ textAlign: 'left', marginBottom: '8px' }}>
            MORE FROM {brandName.toUpperCase()}
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--ink)', margin: '0 0 24px' }}>
            Related Surgical &amp; Healthcare Products
          </h2>
          <div className="prod-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {relatedProducts.map((rp) => (
              <ProductCard key={rp._id} product={rp} partnerSlug={brandSlug} />
            ))}
          </div>
        </div>
      )}
    </section>
  </>
  );
}
