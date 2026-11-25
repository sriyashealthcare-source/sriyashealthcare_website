import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { analyticsService } from '../../services/analyticsService';
import { useEnquiry } from '../../context/EnquiryContext';
import ImageGallery from '../../components/product-details/ImageGallery';
import ProductCard from '../../components/product/ProductCard';
import SeoHead from '../../components/common/SeoHead';
import { resolveAssetUrl } from '../../utils/session';
import { SRIYAS_EMBLEM_URL } from '../../utils/cloudinaryAssets';

export default function ProductDetails() {
  const { partnerSlug, productSlug, slug, categoryOrProductSlug } = useParams();
  const rawProductSlug = productSlug || slug || categoryOrProductSlug;
  // Handle backward compatibility / renamed product slugs
  const effectiveProductSlug =
    rawProductSlug === 'sterilene-mesh'
      ? 'surgical-kit-hernia'
      : rawProductSlug === 'peters-c-section-kit'
      ? 'surgical-kit-obstetrics'
      : rawProductSlug;

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
  const backUrl = (brandSlug && product?.category?.slug && product?.subcategory?.slug)
    ? `/products/${encodeURIComponent(brandSlug)}/${encodeURIComponent(product.category.slug)}/${encodeURIComponent(product.subcategory.slug)}`
    : (brandSlug && product?.category?.slug)
    ? `/products/${encodeURIComponent(brandSlug)}/${encodeURIComponent(product.category.slug)}`
    : brandSlug
    ? `/products/${encodeURIComponent(brandSlug)}`
    : '/products';

  const backLabel = product?.subcategory?.name
    ? `Back to ${product.subcategory.name}`
    : product?.category?.name
    ? `Back to ${product.category.name}`
    : `Back to ${brandLabel}`;

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
    (product.category?.name && product.subcategory?.name
      ? `${product.category.name} · ${product.subcategory.name}`
      : product.category?.name && product.cardCategory
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

  const breadcrumbElements = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sriyashealthcare.com/' },
    { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://sriyashealthcare.com/products' }
  ];
  let curPos = 3;
  if (brandSlug) {
    breadcrumbElements.push({
      '@type': 'ListItem',
      position: curPos++,
      name: brandName,
      item: `https://sriyashealthcare.com/products/${encodeURIComponent(brandSlug)}`
    });
  }
  if (product.category?.name) {
    breadcrumbElements.push({
      '@type': 'ListItem',
      position: curPos++,
      name: product.category.name,
      item: `https://sriyashealthcare.com/products?brand=${encodeURIComponent(brandSlug)}`
    });
  }
  if (product.subcategory?.name) {
    breadcrumbElements.push({
      '@type': 'ListItem',
      position: curPos++,
      name: product.subcategory.name,
      item: `https://sriyashealthcare.com/products?brand=${encodeURIComponent(brandSlug)}`
    });
  }
  breadcrumbElements.push({
    '@type': 'ListItem',
    position: curPos++,
    name: product.name,
    item: `https://sriyashealthcare.com/products/${encodeURIComponent(brandSlug)}/${encodeURIComponent(product.slug)}`
  });

  const jsonLdSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbElements
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: primaryImgUrl || SRIYAS_EMBLEM_URL,
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
        {/* Breadcrumb Navigation: Home > Products > Partner Name > Category > Subcategory > Product Name */}
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
          {product.category?.name && (
            <>
              <span className="breadcrumb-sep">/</span>
              <Link
                to={`/products/${encodeURIComponent(brandSlug)}/${encodeURIComponent(product.category.slug || product.category._id)}`}
                className="breadcrumb-link"
              >
                {product.category.name}
              </Link>
            </>
          )}
          {product.subcategory?.name && (
            <>
              <span className="breadcrumb-sep">/</span>
              <Link
                to={`/products/${encodeURIComponent(brandSlug)}/${encodeURIComponent(product.category?.slug || product.category?._id)}/${encodeURIComponent(product.subcategory.slug || product.subcategory._id)}`}
                className="breadcrumb-link"
              >
                {product.subcategory.name}
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
          <span id="detail-back-label">{backLabel}</span>
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

          {/* System Components Breakdown / SKU Matrix (for YelloPort® Elite and modular systems) */}
          {product.skuMatrix && (
            <div id="ud-sku-matrix-wrap" style={{ marginTop: '24px' }}>
              <div className="detail-sec-lbl" style={{ color: 'var(--gold, #c5a059)' }}>
                System Components Breakdown &amp; SKU Matrix
              </div>

              {/* 1. Universal Seal */}
              {Array.isArray(product.skuMatrix.universalSeal) && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink, #1b2a3a)', marginBottom: '8px' }}>
                    1. Single-Use Universal Seal (Single-use only component)
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sku-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ background: '#f5f0e6', borderBottom: '1px solid #dfba66' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Component</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Diameter</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Quantity</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Product Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.skuMatrix.universalSeal.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #ede5d3' }}>
                            <td style={{ padding: '8px 10px' }}>{item.component || item.description || 'Universal Seal'}</td>
                            <td style={{ padding: '8px 10px' }}>{item.diameter}</td>
                            <td style={{ padding: '8px 10px' }}>{item.qty}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#9a762e' }}>{item.productCode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. Reusable Cannula */}
              {Array.isArray(product.skuMatrix.cannula) && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink, #1b2a3a)', marginBottom: '8px' }}>
                    2. Reusable Cannula (Micro-Ribbed)
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sku-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ background: '#f5f0e6', borderBottom: '1px solid #dfba66' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Diameter</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Working Length</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Product Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.skuMatrix.cannula.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #ede5d3' }}>
                            <td style={{ padding: '8px 10px' }}>{item.diameter}</td>
                            <td style={{ padding: '8px 10px' }}>{item.workingLength}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#9a762e' }}>{item.productCode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. Reusable Trocar Obturator */}
              {Array.isArray(product.skuMatrix.obturator) && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink, #1b2a3a)', marginBottom: '8px' }}>
                    3. Reusable Trocar Obturator
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sku-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ background: '#f5f0e6', borderBottom: '1px solid #dfba66' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Style</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Diameter</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>75mm Code</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>105mm Code</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>150mm Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.skuMatrix.obturator.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #ede5d3' }}>
                            <td style={{ padding: '8px 10px' }}>{item.style}</td>
                            <td style={{ padding: '8px 10px' }}>{item.diameter}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#9a762e' }}>{item.length75}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#9a762e' }}>{item.length105}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#9a762e' }}>{item.length150}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. Reusable Hasson Adaptor & Seals */}
              {Array.isArray(product.skuMatrix.hasson) && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink, #1b2a3a)', marginBottom: '8px' }}>
                    4. Reusable Hasson Adaptor &amp; Seals
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sku-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ background: '#f5f0e6', borderBottom: '1px solid #dfba66' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Component</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Diameter</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Hasson Adaptor Code</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Seals (Qty 5) Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.skuMatrix.hasson.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #ede5d3' }}>
                            <td style={{ padding: '8px 10px' }}>{item.component}</td>
                            <td style={{ padding: '8px 10px' }}>{item.diameter}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#9a762e' }}>{item.adaptorCode}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#9a762e' }}>{item.sealsQty5Code}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
