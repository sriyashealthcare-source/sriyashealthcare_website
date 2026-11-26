import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import { useEnquiry } from '../../context/EnquiryContext';
import ProductCard from '../../components/product/ProductCard';
import GlobalSearchBar from '../../components/common/GlobalSearchBar';
import SeoHead from '../../components/common/SeoHead';
import { resolveAssetUrl } from '../../utils/session';
import { SRIYAS_EMBLEM_URL } from '../../utils/cloudinaryAssets';

function normalizeSearchText(str) {
  if (!str) return '';
  return String(str)
    .replace(/[™®©]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export default function PartnerProducts({ categorySlugProp = null, subcategorySlugProp = null }) {
  const params = useParams();
  const partnerSlug = params.partnerSlug;
  const routeCatSlug = params.categorySlug;
  const routeSubSlug = params.subcategorySlug;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryCat = (searchParams.get('category') || '').trim();
  const querySub = (searchParams.get('subcategory') || '').trim();

  const effectiveCategorySlug = categorySlugProp || routeCatSlug || queryCat || null;
  const effectiveSubcategorySlug = subcategorySlugProp || routeSubSlug || querySub || null;

  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { setPageBrand } = useEnquiry();

  useEffect(() => {
    let isMounted = true;

    async function loadPartnerData() {
      if (!partnerSlug) return;

      // Handle legacy redirects
      if (partnerSlug === 'peters') {
        navigate('/products/ams', { replace: true });
        return;
      }
      if (partnerSlug === 'liquiband') {
        navigate('/products/ams/medical-adhesives', { replace: true });
        return;
      }
      if (partnerSlug === 'gentacoll') {
        navigate('/products/ams/wound-dressings', { replace: true });
        return;
      }
      if (partnerSlug === 'sterilene-mesh') {
        navigate('/products/ams/surgical-kit-hernia', { replace: true });
        return;
      }
      if (partnerSlug === 'peters-c-section-kit') {
        navigate('/products/ams/surgical-kit-obstetrics', { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError('');

        let brandData = null;
        try {
          const brandRes = await productService.getPublicBrandBySlug(partnerSlug);
          if (brandRes?.brand) {
            brandData = brandRes.brand;
          }
        } catch (brandErr) {
          // If brand not found, check if partnerSlug might be an old direct product slug
          try {
            const prodRes = await productService.getPublicProductBySlug(partnerSlug);
            const legacyProd = prodRes?.product;
            if (legacyProd && isMounted) {
              const targetBrandSlug = legacyProd.brand?.slug || 'ams';
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
        setPageBrand(brandData);

        // Fetch products and categories for this partner
        const [productsRes, categoriesRes] = await Promise.all([
          productService.getPublicProducts({ brand: brandData.slug || brandData._id }),
          productService.getPublicCategories({ brand: brandData.slug || brandData._id })
        ]);

        if (!isMounted) return;
        setProducts(productsRes?.products || []);
        setCategories(categoriesRes?.categories || []);
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
      setPageBrand(null);
    };
  }, [partnerSlug, navigate]);

  // Top-level categories (no parentCategory)
  const topLevelCategories = useMemo(() => {
    return categories
      .filter((c) => !c.parentCategory)
      .sort((a, b) => (Number(a.displayOrder) || 99) - (Number(b.displayOrder) || 99));
  }, [categories]);

  // Identify active category from effectiveCategorySlug
  const activeCategory = useMemo(() => {
    if (!effectiveCategorySlug) return null;
    const target = effectiveCategorySlug.toLowerCase();
    return (
      categories.find(
        (c) =>
          String(c.slug || '').toLowerCase() === target ||
          String(c._id) === effectiveCategorySlug
      ) || null
    );
  }, [categories, effectiveCategorySlug]);

  // Subcategories belonging to the active category
  const activeCategorySubcategories = useMemo(() => {
    if (!activeCategory) return [];
    const catId = String(activeCategory._id);
    return categories
      .filter((c) => {
        const pId = c.parentCategory ? String(c.parentCategory._id || c.parentCategory) : null;
        return pId === catId;
      })
      .sort((a, b) => (Number(a.displayOrder) || 99) - (Number(b.displayOrder) || 99));
  }, [categories, activeCategory]);

  const hasSubcategories = useMemo(() => {
    if (!activeCategory) return false;
    return (
      activeCategorySubcategories.length > 0 ||
      activeCategory.hasSubcategories === true ||
      activeCategory.has_subcategories === true
    );
  }, [activeCategory, activeCategorySubcategories]);

  // Identify active subcategory from effectiveSubcategorySlug
  const activeSubcategory = useMemo(() => {
    if (!effectiveSubcategorySlug || !activeCategory) return null;
    const target = effectiveSubcategorySlug.toLowerCase();
    return (
      activeCategorySubcategories.find(
        (s) =>
          String(s.slug || '').toLowerCase() === target ||
          String(s._id) === effectiveSubcategorySlug
      ) || null
    );
  }, [activeCategorySubcategories, effectiveSubcategorySlug]);

  // Helper: count products under a specific subcategory
  const getSubcategoryProductCount = (subId) => {
    const idStr = String(subId);
    return products.filter((p) => {
      const pSub = String(p.subcategory?._id || p.subcategory || '');
      return pSub === idStr;
    }).length;
  };

  // Helper: count products under a top-level category (including all child subcategories)
  const getCategoryProductCount = (cat) => {
    const catIdStr = String(cat._id);
    const childIds = new Set(
      categories
        .filter((c) => String(c.parentCategory?._id || c.parentCategory) === catIdStr)
        .map((c) => String(c._id))
    );
    return products.filter((p) => {
      const pCat = String(p.category?._id || p.category || '');
      const pSub = String(p.subcategory?._id || p.subcategory || '');
      return pCat === catIdStr || childIds.has(pSub) || pSub === catIdStr;
    }).length;
  };

  // Filtered products:
  // 1. If searching: search across ALL products under this brand!
  // 2. If at Level 3 (Subcategory View): products strictly for activeSubcategory
  // 3. If at Level 2 (Standard Category Product Grid, Case B): products for activeCategory
  const filteredProducts = useMemo(() => {
    let result = products;

    if (searchQuery.trim()) {
      const q = normalizeSearchText(searchQuery);
      const tokens = q.split(/\s+/).filter(Boolean);

      result = result.filter((p) => {
        const name = normalizeSearchText(p.name);
        const spec = normalizeSearchText(p.shortSpecification);
        const cat = normalizeSearchText(p.category?.name || p.cardCategory);
        const sub = normalizeSearchText(p.subcategory?.name);
        const desc = normalizeSearchText(p.description);
        const keywords = Array.isArray(p.keywords) ? normalizeSearchText(p.keywords.join(' ')) : '';
        const specsText = Array.isArray(p.specifications)
          ? normalizeSearchText(p.specifications.map((s) => `${s.key || ''} ${s.value || ''}`).join(' '))
          : '';
        const combined = `${name} ${spec} ${cat} ${sub} ${desc} ${keywords} ${specsText}`;

        return tokens.every((token) => combined.includes(token));
      });
      return result;
    }

    if (activeSubcategory) {
      const subIdStr = String(activeSubcategory._id);
      result = result.filter((p) => {
        const pSub = String(p.subcategory?._id || p.subcategory || '');
        return pSub === subIdStr;
      });
    } else if (activeCategory && !hasSubcategories) {
      const catIdStr = String(activeCategory._id);
      result = result.filter((p) => {
        const pCat = String(p.category?._id || p.category || '');
        return pCat === catIdStr;
      });
    }

    // Sort by product displayOrder
    return [...result].sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
  }, [products, searchQuery, activeSubcategory, activeCategory, hasSubcategories]);

  // Current Level Determination
  const isSearchMode = Boolean(searchQuery.trim());
  const isLevel3SubcategoryView = !isSearchMode && Boolean(activeCategory && hasSubcategories && activeSubcategory);
  const isLevel2SubBrandWithSubcategories = !isSearchMode && Boolean(activeCategory && hasSubcategories && !activeSubcategory);
  const isLevel2StandardCategoryProductGrid = !isSearchMode && Boolean(activeCategory && !hasSubcategories);
  const isLevel1BrandView = !isSearchMode && !activeCategory;

  const brandLogoUrl = brand?.logoUrl ? resolveAssetUrl(brand.logoUrl) : '';
  const brandName = brand ? brand.name : partnerSlug || 'Partner';

  // Dynamic SEO metadata
  let seoTitle = `${brandName} Surgical & Medical Products | Sriyas Healthcare`;
  let seoDesc = brand?.description || `Explore authorized ${brandName} medical products distributed by Sriyas Healthcare.`;
  let canonicalPath = `/products/${encodeURIComponent(partnerSlug || '')}`;

  if (activeSubcategory && activeCategory) {
    seoTitle = `${activeSubcategory.name} - ${activeCategory.name} | ${brandName} | Sriyas Healthcare`;
    seoDesc = activeSubcategory.description || `Clinical specifications and sizes for ${activeSubcategory.name}.`;
    canonicalPath = `/products/${encodeURIComponent(partnerSlug)}/${encodeURIComponent(activeCategory.slug)}/${encodeURIComponent(activeSubcategory.slug)}`;
  } else if (activeCategory) {
    seoTitle = `${activeCategory.name} - ${brandName} | Sriyas Healthcare`;
    seoDesc = activeCategory.description || `Explore the ${activeCategory.name} range under ${brandName}.`;
    canonicalPath = `/products/${encodeURIComponent(partnerSlug)}/${encodeURIComponent(activeCategory.slug)}`;
  }

  return (
    <>
      <SeoHead
        title={seoTitle}
        description={seoDesc}
        canonicalPath={canonicalPath}
        ogImage={brandLogoUrl}
        ogType="website"
      />

      <section className="partner-products-page" id="partner-products-page" aria-label="Partner Products">
        {/* Breadcrumb Navigation Bar */}
        <div className="partner-top-bar">
          <nav className="partner-breadcrumbs" aria-label="Breadcrumbs">
            <Link to="/" className="breadcrumb-link">
              Home
            </Link>
            <span className="breadcrumb-sep">/</span>
            <Link to="/products" className="breadcrumb-link">
              Products
            </Link>
            <span className="breadcrumb-sep">/</span>

            {/* Level 1: Brand */}
            {activeCategory ? (
              <Link to={`/products/${encodeURIComponent(partnerSlug)}`} className="breadcrumb-link">
                {brandName}
              </Link>
            ) : (
              <span className="breadcrumb-current">{brandName}</span>
            )}

            {/* Level 2: Category / Sub-Brand */}
            {activeCategory && (
              <>
                <span className="breadcrumb-sep">/</span>
                {activeSubcategory ? (
                  <Link
                    to={`/products/${encodeURIComponent(partnerSlug)}/${encodeURIComponent(activeCategory.slug)}`}
                    className="breadcrumb-link"
                  >
                    {activeCategory.name}
                  </Link>
                ) : (
                  <span className="breadcrumb-current">{activeCategory.name}</span>
                )}
              </>
            )}

            {/* Level 3: Subcategory */}
            {activeSubcategory && (
              <>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">{activeSubcategory.name}</span>
              </>
            )}
          </nav>

          {/* Contextual Back Button */}
          {activeSubcategory ? (
            <Link
              to={`/products/${encodeURIComponent(partnerSlug)}/${encodeURIComponent(activeCategory.slug)}`}
              className="back-to-partners-btn"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back to {activeCategory.name}</span>
            </Link>
          ) : activeCategory ? (
            <Link
              to={`/products/${encodeURIComponent(partnerSlug)}`}
              className="back-to-partners-btn"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back to {brandName} Categories</span>
            </Link>
          ) : (
            <Link to="/products" className="back-to-partners-btn" id="btn-back-to-partners">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back to All Partners</span>
            </Link>
          )}
        </div>

        {loading && (
          <div className="state-container" style={{ minHeight: '450px' }}>
            <div className="spinner" />
            <div className="state-title">Loading Catalogue</div>
            <p className="state-desc">Fetching clinical products and category structures...</p>
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
            {/* ═══════════════════════════════════════════════════════════
                HEADER BANNER (Dual Branding for Sub-Brands, Standard for Brands)
                ═══════════════════════════════════════════════════════════ */}
            <div className="partner-hero-banner">
              <div className="partner-hero-content">
                {/* Logo Box */}
                <div className="partner-hero-logo-box">
                  {isLevel2SubBrandWithSubcategories || isLevel3SubcategoryView ? (
                    // Dual Branding / Sub-Brand Logo
                    activeCategory?.logoUrl || activeCategory?.logo_url ? (
                      <div className="dual-brand-lockup">
                        <img
                          src={resolveAssetUrl(activeCategory.logoUrl || activeCategory.logo_url)}
                          alt={`${activeCategory.name} logo`}
                          className="subbrand-logo-frame"
                        />
                      </div>
                    ) : brandLogoUrl ? (
                      <img src={brandLogoUrl} alt={`${brand.name} logo`} className="partner-hero-logo" />
                    ) : (
                      <div className="partner-hero-fallback-badge">
                        <span className="partner-hero-fallback-icon" aria-hidden="true">{brand.icon || '🔬'}</span>
                        <span className="partner-hero-fallback-name">{activeCategory?.name || brand.name}</span>
                      </div>
                    )
                  ) : brandLogoUrl ? (
                    <img src={brandLogoUrl} alt={`${brand.name} logo`} className="partner-hero-logo" />
                  ) : (
                    <div className="partner-hero-fallback-badge">
                      <span className="partner-hero-fallback-icon" aria-hidden="true">{brand.icon || '🔬'}</span>
                      <span className="partner-hero-fallback-name">{brand.name}</span>
                    </div>
                  )}
                </div>

                {/* Banner Text */}
                <div className="partner-hero-text">
                  <div className="partner-hero-eyebrow">
                    {isLevel3SubcategoryView
                      ? `${activeCategory?.name || brand.name} · SURGICAL SUBCATEGORY`
                      : isLevel2SubBrandWithSubcategories
                      ? `SUB-BRAND CATALOGUE · ${brand.name}`
                      : isLevel2StandardCategoryProductGrid
                      ? `${brand.name} · CLINICAL CATEGORY`
                      : 'PARTNER PRODUCT CATALOGUE'}
                  </div>

                  <h1 className="partner-hero-title">
                    {isLevel3SubcategoryView
                      ? activeSubcategory.name
                      : isLevel2SubBrandWithSubcategories || isLevel2StandardCategoryProductGrid
                      ? activeCategory.name
                      : `${brand.name} Products`}
                  </h1>

                  <p className="partner-hero-desc">
                    {isLevel3SubcategoryView
                      ? activeSubcategory.description || activeCategory?.description || brand.description
                      : isLevel2SubBrandWithSubcategories || isLevel2StandardCategoryProductGrid
                      ? activeCategory.description || brand.description
                      : brand.description}
                  </p>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                SEARCH TOOLBAR
                ═══════════════════════════════════════════════════════════ */}
            <div className="catalog-toolbar partner-toolbar">
              <GlobalSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery('')}
                placeholder={`Search across all ${brand.name} products...`}
                ariaLabel={`Search across all ${brand.name} products`}
                id="partner-products-search-input"
              />
            </div>

            {/* ═══════════════════════════════════════════════════════════
                LIVE SEARCH RESULTS (When user is searching across the brand)
                ═══════════════════════════════════════════════════════════ */}
            {isSearchMode ? (
              <div className="partner-products-container">
                <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div className="partner-search-count-badge">
                    Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'product' : 'products'} matching &ldquo;{searchQuery}&rdquo; under {brand.name}
                  </div>
                  <button
                    type="button"
                    className="subcat-reset-btn"
                    onClick={() => setSearchQuery('')}
                  >
                    ✕ Clear Search &amp; Return to Step View
                  </button>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="state-container" style={{ minHeight: '260px' }}>
                    <div className="state-title">No Matching Products</div>
                    <p className="state-desc">No products under {brand.name} matched &ldquo;{searchQuery}&rdquo;.</p>
                    <button
                      type="button"
                      className="hero-cta"
                      style={{ border: 'none', padding: '10px 24px' }}
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  <div className="prod-grid" role="list">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product._id || product.slug} product={product} partnerSlug={brand.slug} />
                    ))}
                  </div>
                )}
              </div>
            ) : isLevel1BrandView ? (
              /* ═══════════════════════════════════════════════════════════
                 STEP 1: BRAND VIEW (SHOW ONLY TOP-LEVEL CATEGORY CARDS)
                 ═══════════════════════════════════════════════════════════ */
              <div className="drilldown-container">
                <div className="drilldown-header">
                  <div className="drilldown-eyebrow">
                    <span>◈</span>
                    <span>CLINICAL PRODUCT PORTFOLIOS</span>
                  </div>
                  <h2 className="drilldown-title">Browse {brand.name} Categories</h2>
                  <p className="drilldown-desc">
                    Select a specialized clinical category below to explore verified medical ranges and surgical device specifications.
                  </p>
                </div>

                {topLevelCategories.length === 0 ? (
                  <div className="state-container" style={{ minHeight: '320px' }}>
                    <div className="state-title">No Categories Listed Yet</div>
                    <p className="state-desc">Categories for {brand.name} are currently being added. Please check back soon.</p>
                  </div>
                ) : (
                  <div className="drilldown-category-grid" role="list">
                    {topLevelCategories.map((cat) => {
                      const catTotalProducts = getCategoryProductCount(cat);
                      const catChildSubs = categories.filter(
                        (s) => String(s.parentCategory?._id || s.parentCategory) === String(cat._id)
                      );
                      const rawLogo = cat.logoUrl || cat.logo_url || (cat.logoImage && cat.logoImage.url) || '';
                      const catLogo = typeof rawLogo === 'string' && rawLogo.trim() !== '' ? rawLogo.trim() : null;

                      return (
                        <Link
                          key={cat._id}
                          to={`/products/${encodeURIComponent(partnerSlug)}/${encodeURIComponent(cat.slug)}`}
                          className={`drilldown-category-card ${!catLogo ? 'drilldown-category-card--no-logo' : ''}`}
                          role="listitem"
                          aria-label={`View ${cat.name} product portfolio`}
                        >
                          <div className={`drilldown-category-card-header ${!catLogo ? 'drilldown-category-card-header--no-logo' : ''}`}>
                            {catLogo && (
                              <div className="drilldown-cat-logo-wrap">
                                <img
                                  src={resolveAssetUrl(catLogo)}
                                  alt={`${cat.name} logo`}
                                  className="drilldown-cat-logo"
                                />
                              </div>
                            )}

                            {catChildSubs.length > 0 ? (
                              <span className="drilldown-cat-type-pill">
                                {catChildSubs.length} Subcategories
                              </span>
                            ) : (
                              <span className="drilldown-cat-type-pill">
                                Category Range
                              </span>
                            )}
                          </div>

                          <h3 className="drilldown-category-title">{cat.name}</h3>

                          <p className="drilldown-category-desc">
                            {cat.description ||
                              cat.heroTitle ||
                              `Specialized clinical solutions and medical instrumentation manufactured under international standards.`}
                          </p>

                          <div className="drilldown-category-footer">
                            <span className="drilldown-count-badge">
                              {catChildSubs.length > 0
                                ? `${catChildSubs.length} Subcategories · ${catTotalProducts} Products`
                                : `${catTotalProducts} Clinical Products`}
                            </span>
                            <span className="drilldown-cta-link">
                              <span>View Range</span>
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : isLevel2SubBrandWithSubcategories ? (
              /* ═══════════════════════════════════════════════════════════
                 STEP 2 (CASE A): CATEGORY / SUB-BRAND VIEW (SHOW ONLY SUBCATEGORY TILES)
                 ═══════════════════════════════════════════════════════════ */
              <div className="drilldown-container">
                <Link
                  to={`/products/${encodeURIComponent(partnerSlug)}`}
                  className="drilldown-back-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>← Back to {brand.name} Categories</span>
                </Link>

                <div className="drilldown-header">
                  <div className="drilldown-eyebrow">
                    <span>◈</span>
                    <span>{activeCategory.name.toUpperCase()} · {activeCategorySubcategories.length} PRODUCT SUBCATEGORIES</span>
                  </div>
                  <h2 className="drilldown-title">Choose a Product Subcategory</h2>
                  <p className="drilldown-desc">
                    Click any subcategory below to inspect individual surgical codes, specifications, packaging sizes, and clinical applications.
                  </p>
                </div>

                <div className="drilldown-subcat-grid" role="list">
                  {activeCategorySubcategories.map((sub, idx) => {
                    const subCount = getSubcategoryProductCount(sub._id);
                    const numeral = String(idx + 1).padStart(2, '0');
                    const rawSubLogo = sub.logoUrl || sub.logo_url || (sub.logoImage && sub.logoImage.url) || '';
                    const subLogo = typeof rawSubLogo === 'string' && rawSubLogo.trim() !== '' ? rawSubLogo.trim() : null;

                    return (
                      <Link
                        key={sub._id}
                        to={`/products/${encodeURIComponent(partnerSlug)}/${encodeURIComponent(activeCategory.slug)}/${encodeURIComponent(sub.slug)}`}
                        className={`drilldown-subcat-card ${subLogo ? 'drilldown-subcat-card--with-logo' : ''}`}
                        role="listitem"
                        aria-label={`View products in ${sub.name}`}
                      >
                        {subLogo ? (
                          <div className="drilldown-subcat-card-header">
                            <div className="drilldown-cat-logo-wrap">
                              <img
                                src={resolveAssetUrl(subLogo)}
                                alt={`${sub.name} logo`}
                                className="drilldown-cat-logo"
                              />
                            </div>
                            <span className="drilldown-subcat-numeral">{numeral}</span>
                          </div>
                        ) : (
                          <div className="drilldown-subcat-numeral">{numeral}</div>
                        )}

                        <h3 className="drilldown-subcat-title">{sub.name}</h3>
                        <p className="drilldown-subcat-desc">
                          {sub.description ||
                            sub.heroTitle ||
                            `Verified surgical devices and precision wound-closure solutions.`}
                        </p>
                        <div className="drilldown-subcat-footer">
                          <span className="drilldown-subcat-count">{subCount} Products</span>
                          <span className="drilldown-subcat-cta">
                            <span>View Products</span>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : isLevel3SubcategoryView ? (
              /* ═══════════════════════════════════════════════════════════
                 STEP 3 (CASE A): SUBCATEGORY PRODUCT GRID + SIBLING SWITCHER
                 ═══════════════════════════════════════════════════════════ */
              <div className="partner-products-container">
                <Link
                  to={`/products/${encodeURIComponent(partnerSlug)}/${encodeURIComponent(activeCategory.slug)}`}
                  className="drilldown-back-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>← Back to {activeCategory.name} Subcategories</span>
                </Link>

                {/* Sibling Subcategories Switcher Pills */}
                {activeCategorySubcategories.length > 1 && (
                  <div className="sibling-subcat-switcher" role="tablist" aria-label="Sibling Subcategories">
                    {activeCategorySubcategories.map((sibling) => {
                      const isActive = String(sibling._id) === String(activeSubcategory._id);
                      const sCount = getSubcategoryProductCount(sibling._id);

                      return (
                        <Link
                          key={sibling._id}
                          to={`/products/${encodeURIComponent(partnerSlug)}/${encodeURIComponent(activeCategory.slug)}/${encodeURIComponent(sibling.slug)}`}
                          role="tab"
                          aria-selected={isActive}
                          className={`sibling-subcat-pill ${isActive ? 'active' : ''}`}
                        >
                          <span>{sibling.name}</span>
                          <span className="sibling-subcat-pill-count">({sCount})</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Product Grid */}
                {filteredProducts.length === 0 ? (
                  <div className="state-container" style={{ minHeight: '300px' }}>
                    <div className="state-title">No Products in this Subcategory</div>
                    <p className="state-desc">
                      Products for {activeSubcategory.name} are currently being updated in our clinical database.
                    </p>
                    <Link
                      to={`/products/${encodeURIComponent(partnerSlug)}/${encodeURIComponent(activeCategory.slug)}`}
                      className="detail-back"
                    >
                      ← Back to {activeCategory.name}
                    </Link>
                  </div>
                ) : (
                  <div className="prod-grid" role="list">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product._id || product.slug} product={product} partnerSlug={brand.slug} />
                    ))}
                  </div>
                )}
              </div>
            ) : isLevel2StandardCategoryProductGrid ? (
              /* ═══════════════════════════════════════════════════════════
                 STEP 2 (CASE B): STANDARD CATEGORY PRODUCT GRID (NO SUBCATEGORIES)
                 ═══════════════════════════════════════════════════════════ */
              <div className="partner-products-container">
                <Link
                  to={`/products/${encodeURIComponent(partnerSlug)}`}
                  className="drilldown-back-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>← Back to {brand.name} Categories</span>
                </Link>

                <div className="drilldown-header" style={{ marginBottom: '22px' }}>
                  <div className="drilldown-eyebrow">
                    <span>◈</span>
                    <span>{activeCategory.name.toUpperCase()} RANGE</span>
                  </div>
                  <h2 className="drilldown-title">{activeCategory.name}</h2>
                  {activeCategory.description && (
                    <p className="drilldown-desc">{activeCategory.description}</p>
                  )}
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="state-container" style={{ minHeight: '300px' }}>
                    <div className="state-title">No Products in this Category</div>
                    <p className="state-desc">Products for this category are being updated.</p>
                  </div>
                ) : (
                  <div className="prod-grid" role="list">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product._id || product.slug} product={product} partnerSlug={brand.slug} />
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
