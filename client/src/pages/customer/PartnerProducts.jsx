import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import ProductCard from '../../components/product/ProductCard';
import { resolveAssetUrl } from '../../utils/session';

export default function PartnerProducts() {
  const { partnerSlug } = useParams();
  const navigate = useNavigate();

  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadPartnerData() {
      if (!partnerSlug) return;
      try {
        setLoading(true);
        setError('');

        // Step 1: Attempt to load the brand details
        let brandData = null;
        try {
          const brandRes = await productService.getPublicBrandBySlug(partnerSlug);
          if (brandRes?.brand) {
            brandData = brandRes.brand;
          }
        } catch (brandErr) {
          // If brand not found, check if partnerSlug might be an old direct product slug (backward compatibility)
          try {
            const prodRes = await productService.getPublicProductBySlug(partnerSlug);
            const legacyProd = prodRes?.product;
            if (legacyProd && isMounted) {
              const targetBrandSlug = legacyProd.brand?.slug || 'peters';
              navigate(`/products/${encodeURIComponent(targetBrandSlug)}/${encodeURIComponent(legacyProd.slug)}`, {
                replace: true
              });
              return;
            }
          } catch (_) {
            // Not a product either
          }

          if (isMounted) {
            setError(
              brandErr.response?.data?.message ||
                `The partner "${partnerSlug}" could not be found or is inactive.`
            );
            setLoading(false);
          }
          return;
        }

        if (!isMounted) return;
        setBrand(brandData);

        // SEO metadata
        document.title = `${brandData.name} Products | Sriyas Healthcare Pvt Ltd`;
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.head.appendChild(metaDesc);
        }
        metaDesc.content = `Explore surgical and medical products from ${brandData.name} through Sriyas Healthcare across India.`;

        // Step 2: Fetch products and categories belonging strictly to this partner
        const [productsRes, categoriesRes] = await Promise.all([
          productService.getPublicProducts({ brand: brandData.slug || brandData._id }),
          productService.getPublicCategories({ brand: brandData.slug || brandData._id })
        ]);

        if (!isMounted) return;

        const partnerProducts = productsRes?.products || [];
        setProducts(partnerProducts);

        // Identify available categories strictly for this partner's products
        const partnerCats = categoriesRes?.categories || [];
        setCategories(partnerCats);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err.response?.data?.message ||
            'Unable to load products for this partner. Please try again later.'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPartnerData();

    return () => {
      isMounted = false;
    };
  }, [partnerSlug, navigate]);

  // Distinct category filter options derived from active categories & products
  const categoryFilterOptions = useMemo(() => {
    const list = [{ id: 'all', name: 'All Categories' }];
    const seenCatIds = new Set();

    // From populated category collection
    for (const cat of categories) {
      const cid = String(cat._id);
      if (!seenCatIds.has(cid)) {
        seenCatIds.add(cid);
        list.push({ id: cid, name: cat.name });
      }
    }

    // Also include any fallback cardCategory labels from products
    for (const p of products) {
      const cObj = p.category;
      if (cObj && typeof cObj === 'object' && cObj._id) {
        const cid = String(cObj._id);
        if (!seenCatIds.has(cid)) {
          seenCatIds.add(cid);
          list.push({ id: cid, name: cObj.name || p.cardCategory });
        }
      } else if (p.cardCategory && !list.some(item => item.name === p.cardCategory)) {
        list.push({ id: `card-${p.cardCategory}`, name: p.cardCategory });
      }
    }

    return list;
  }, [categories, products]);

  // Filtered products by category and search query
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(p => {
        const pCatId = String(p.category?._id || p.category || '');
        if (selectedCategory.startsWith('card-')) {
          const cardName = selectedCategory.replace('card-', '');
          return p.cardCategory === cardName || pCatId === cardName;
        }
        return pCatId === selectedCategory;
      });
    }

    // Filter by search query within this partner's products
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(p => {
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.shortSpecification || '').toLowerCase().includes(q) ||
          (p.cardCategory || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.category?.name || '').toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [products, selectedCategory, searchQuery]);

  const brandLogoUrl = brand?.logoUrl ? resolveAssetUrl(brand.logoUrl) : '';

  return (
    <section className="partner-products-page" id="partner-products-page" aria-label="Partner Products">
      <div className="partner-top-bar">
        {/* Breadcrumb Navigation */}
        <nav className="partner-breadcrumbs" aria-label="Breadcrumbs">
          <Link to="/" className="breadcrumb-link">
            Home
          </Link>
          <span className="breadcrumb-sep">/</span>
          <Link to="/products" className="breadcrumb-link">
            Products
          </Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{brand ? brand.name : partnerSlug}</span>
        </nav>

        {/* Back to All Partners Button */}
        <Link to="/products" className="back-to-partners-btn" id="btn-back-to-partners">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M11 14L6 9l5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Back to All Partners</span>
        </Link>
      </div>

      {loading && (
        <div className="state-container" style={{ minHeight: '450px' }}>
          <div className="spinner" />
          <div className="state-title">Loading Partner Catalogue</div>
          <p className="state-desc">Fetching clinical products and specifications...</p>
        </div>
      )}

      {error && !loading && (
        <div className="state-container" style={{ minHeight: '450px' }}>
          <div className="state-title">Partner Not Found</div>
          <p className="state-desc">{error}</p>
          <Link to="/products" className="hero-cta">
            Return to All Partners
          </Link>
        </div>
      )}

      {!loading && !error && brand && (
        <>
          {/* A. Partner Header */}
          <div className="partner-hero-banner">
            <div className="partner-hero-content">
              <div className="partner-hero-logo-box">
                {brandLogoUrl ? (
                  <img
                    src={brandLogoUrl}
                    alt={`${brand.name} logo`}
                    className="partner-hero-logo"
                  />
                ) : (
                  <div className="partner-hero-fallback-icon" aria-hidden="true">
                    <span>{brand.icon || '🔬'}</span>
                  </div>
                )}
              </div>

              <div className="partner-hero-text">
                <div className="partner-hero-eyebrow">PARTNER PRODUCT CATALOGUE</div>
                <h1 className="partner-hero-title">{brand.name} Products</h1>
                {brand.description && (
                  <p className="partner-hero-desc">{brand.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* B. Filter and Search Toolbar */}
          <div className="catalog-toolbar partner-toolbar">
            <div className="catalog-search-box">
              <svg
                className="search-icon"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search within ${brand.name} products...`}
                aria-label={`Search within ${brand.name} products`}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills (if multiple categories exist) */}
            {categoryFilterOptions.length > 2 && (
              <div className="partner-category-pills" role="tablist" aria-label="Product categories">
                {categoryFilterOptions.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === cat.id}
                    className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* C. Product Grid or Empty State */}
          <div className="partner-products-container">
            {products.length === 0 ? (
              <div className="state-container" style={{ minHeight: '320px' }}>
                <div className="state-title">No Products Listed Yet</div>
                <p className="state-desc">
                  Products for {brand.name} are currently being added to our clinical catalogue.
                  Please check back soon or contact our medical supply specialists.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/products" className="detail-back" style={{ marginBottom: 0 }}>
                    ← Back to All Partners
                  </Link>
                  <Link to="/contact" className="hero-cta" style={{ display: 'inline-flex', padding: '10px 24px' }}>
                    Contact Support
                  </Link>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="state-container" style={{ minHeight: '280px' }}>
                <div className="state-title">No Matching Products</div>
                <p className="state-desc">
                  No {brand.name} products matched your search or category filter.
                </p>
                <button
                  type="button"
                  className="hero-cta"
                  style={{ border: 'none', padding: '10px 24px' }}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="prod-grid" role="list">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product._id || product.slug}
                    product={product}
                    partnerSlug={brand.slug}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

