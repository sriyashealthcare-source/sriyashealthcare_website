import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import { resolveAssetUrl } from '../../utils/session';
import GlobalSearchBar from '../../components/common/GlobalSearchBar';

export default function Partners() {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = (searchParams.get('q') || '').trim();

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [selectedBrandFilter, setSelectedBrandFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState('relevance');

  // Track if search query came from URL initial load
  const isFirstMount = useRef(true);

  useEffect(() => {
    document.title = 'Our Partners & Products | Sriyas Healthcare Pvt Ltd';

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content =
      'Explore world-class healthcare, surgical, and medical manufacturer partners and products represented by Sriyas Healthcare across India.';
  }, []);

  // Fetch initial partners and categories directory
  const fetchDirectory = async () => {
    try {
      setLoading(true);
      setError('');
      const [brandsRes, catsRes] = await Promise.all([
        productService.getPublicBrands(),
        productService.getPublicCategories().catch(() => ({ categories: [] }))
      ]);

      const activeBrands = (brandsRes?.brands || []).filter(b => b.isActive !== false);
      setBrands(activeBrands);
      setCategories(catsRes?.categories || []);
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
    fetchDirectory();
  }, []);

  // Keep search input synced if user clicks back/forward in browser history
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const currentQ = (searchParams.get('q') || '').trim();
    if (currentQ !== searchQuery) {
      setSearchQuery(currentQ);
      setDebouncedQuery(currentQ);
    }
  }, [searchParams]);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchQuery.trim();
      setDebouncedQuery(trimmed);

      // Update URL query parameter
      if (trimmed.length >= 2) {
        setSearchParams({ q: trimmed }, { replace: true });
      } else {
        const nextParams = new URLSearchParams(searchParams);
        if (nextParams.has('q')) {
          nextParams.delete('q');
          setSearchParams(nextParams, { replace: true });
        }
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, setSearchParams]);

  // Execute global search when debouncedQuery changes
  useEffect(() => {
    let isCancelled = false;

    async function executeSearch() {
      if (debouncedQuery.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        setSearchError('');
        return;
      }

      try {
        setIsSearching(true);
        setSearchError('');
        const res = await productService.searchPublicProducts({
          q: debouncedQuery,
          limit: 100
        });

        if (!isCancelled) {
          setSearchResults(res?.products || []);
        }
      } catch (err) {
        if (!isCancelled) {
          setSearchError(
            err.response?.data?.message ||
              'Unable to complete search at this moment. Please try again.'
          );
        }
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }

    executeSearch();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSearchResults([]);
    setSelectedBrandFilter('all');
    setSelectedCategoryFilter('all');
    setSortOption('relevance');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    setSearchParams(nextParams, { replace: true });
  };

  // Derive distinct brands available in results (or all active brands)
  const availableBrandsForFilter = useMemo(() => {
    const map = new Map();
    for (const b of brands) {
      map.set(b.slug, b.name);
    }
    for (const p of searchResults) {
      if (p.brand?.slug && p.brand?.name && !map.has(p.brand.slug)) {
        map.set(p.brand.slug, p.brand.name);
      }
    }
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [brands, searchResults]);

  // Derive distinct categories available in results
  const availableCategoriesForFilter = useMemo(() => {
    const map = new Map();
    for (const p of searchResults) {
      if (p.category && typeof p.category === 'object' && p.category.name) {
        map.set(p.category.slug || String(p.category._id), p.category.name);
      } else if (p.cardCategory) {
        map.set(p.cardCategory, p.cardCategory);
      }
    }
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }));
  }, [searchResults]);

  // Client-side filtering & sorting of retrieved results
  const displayedResults = useMemo(() => {
    if (debouncedQuery.length < 2) return [];

    let list = [...searchResults];

    // Filter by brand
    if (selectedBrandFilter !== 'all') {
      list = list.filter(p => {
        const pBrandSlug = p.brand?.slug || (typeof p.brand === 'string' ? p.brand : '');
        const pBrandId = String(p.brand?._id || p.brand || '');
        return pBrandSlug === selectedBrandFilter || pBrandId === selectedBrandFilter;
      });
    }

    // Filter by category
    if (selectedCategoryFilter !== 'all') {
      list = list.filter(p => {
        const pCatSlug = p.category?.slug || '';
        const pCatId = String(p.category?._id || p.category || '');
        const pCardCat = String(p.cardCategory || '').toLowerCase();
        return (
          pCatSlug === selectedCategoryFilter ||
          pCatId === selectedCategoryFilter ||
          pCardCat === selectedCategoryFilter.toLowerCase()
        );
      });
    }

    // Sort results
    if (sortOption === 'name-asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortOption === 'name-desc') {
      list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortOption === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [searchResults, debouncedQuery, selectedBrandFilter, selectedCategoryFilter, sortOption]);

  const isSearchActive = debouncedQuery.length >= 2;

  return (
    <section className="partners-page" id="partners-page" aria-label="Our Partners and Products">
      {/* ─── 1. GLOBAL SEARCH HERO SECTION ─── */}
      <div className="products-global-search-hero">
        <div className="partners-eyebrow">AUTHORIZED MEDICAL DISTRIBUTOR</div>
        <h1 className="products-search-heading">Find the Right Healthcare Product</h1>
        <p className="products-search-sub">
          Search across our complete surgical and medical product catalogue.
        </p>

        <GlobalSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={handleClearSearch}
          placeholder="Search products, categories or manufacturers..."
          isLoading={isSearching}
          id="global-product-search-input"
          ariaLabel="Search surgical and medical products across all manufacturers"
        />
      </div>

      <div className="partners-container">
        {/* ─── 2. ACTIVE SEARCH RESULTS VIEW ─── */}
        {isSearchActive && (
          <div className="search-results-section" aria-live="polite">
            {/* Search error state */}
            {searchError && (
              <div className="state-container" style={{ minHeight: '260px', marginBottom: '32px' }}>
                <div className="state-title">Search Error</div>
                <p className="state-desc">{searchError}</p>
                <button
                  type="button"
                  onClick={() => setDebouncedQuery(searchQuery.trim())}
                  className="hero-cta"
                  style={{ border: 'none' }}
                >
                  Retry Search
                </button>
              </div>
            )}

            {/* Results summary bar with count and quick filters */}
            {!searchError && (
              <div className="search-results-summary-bar">
                <div className="search-results-count">
                  {isSearching ? (
                    <span>Searching our clinical product catalogue...</span>
                  ) : (
                    <span>
                      Found <strong>{displayedResults.length}</strong>{' '}
                      {displayedResults.length === 1 ? 'product' : 'products'} matching &ldquo;
                      <strong>{debouncedQuery}</strong>&rdquo;
                      {(selectedBrandFilter !== 'all' || selectedCategoryFilter !== 'all') && (
                        <span> (filtered from {searchResults.length} total matches)</span>
                      )}
                    </span>
                  )}
                </div>

                <div className="search-results-filters">
                  {/* Filter by Partner / Brand */}
                  <select
                    className="search-filter-select"
                    value={selectedBrandFilter}
                    onChange={(e) => setSelectedBrandFilter(e.target.value)}
                    aria-label="Filter by Manufacturer"
                  >
                    <option value="all">All Manufacturers</option>
                    {availableBrandsForFilter.map((b) => (
                      <option key={b.slug} value={b.slug}>
                        {b.name}
                      </option>
                    ))}
                  </select>

                  {/* Filter by Category */}
                  {availableCategoriesForFilter.length > 0 && (
                    <select
                      className="search-filter-select"
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      aria-label="Filter by Category"
                    >
                      <option value="all">All Categories</option>
                      {availableCategoriesForFilter.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Sort Dropdown */}
                  <select
                    className="search-filter-select"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    aria-label="Sort products by"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="name-asc">Name (A – Z)</option>
                    <option value="name-desc">Name (Z – A)</option>
                    <option value="newest">Newest First</option>
                  </select>

                  {/* Reset Filters / Clear Search */}
                  {(selectedBrandFilter !== 'all' ||
                    selectedCategoryFilter !== 'all' ||
                    sortOption !== 'relevance') && (
                    <button
                      type="button"
                      className="search-reset-link"
                      onClick={() => {
                        setSelectedBrandFilter('all');
                        setSelectedCategoryFilter('all');
                        setSortOption('relevance');
                      }}
                      title="Reset filters"
                    >
                      Reset Filters
                    </button>
                  )}

                  <button
                    type="button"
                    className="search-reset-link"
                    onClick={handleClearSearch}
                    title="Clear search query"
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            )}

            {/* Empty search results state */}
            {!isSearching && !searchError && displayedResults.length === 0 && (
              <div className="state-container" style={{ minHeight: '320px', marginBottom: '40px' }}>
                <div className="state-title">No Matching Products Found</div>
                <p className="state-desc">
                  We could not find any products matching &ldquo;<strong>{debouncedQuery}</strong>&rdquo;.
                  <br />
                  Try checking your spelling, using broader clinical keywords (e.g., <em>suture</em>,{' '}
                  <em>mesh</em>, <em>glue</em>, <em>hemostat</em>), or select a partner from the directory below.
                </p>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="hero-cta"
                  style={{ border: 'none', margin: '8px auto' }}
                >
                  Clear Search &amp; View Partners
                </button>
              </div>
            )}

            {/* Search Results Grid */}
            {!searchError && displayedResults.length > 0 && (
              <div className="global-search-results-grid" role="list" aria-label="Search Results">
                {displayedResults.map((product) => {
                  const primaryImg =
                    (product.images || []).find((img) => img.isPrimary) ||
                    (product.images || [])[0];
                  const imgUrl = primaryImg
                    ? resolveAssetUrl(primaryImg.url)
                    : product.imageUrl
                    ? resolveAssetUrl(product.imageUrl)
                    : '';

                  const brandSlug =
                    product.brand?.slug ||
                    (typeof product.brand === 'string' ? product.brand : 'peters');
                  const brandName = product.brand?.name || 'Partner Brand';
                  const brandLogo = product.brand?.logoUrl
                    ? resolveAssetUrl(product.brand.logoUrl)
                    : '';

                  const catName =
                    product.category?.name || product.cardCategory || 'Healthcare Product';
                  const productSlug = product.slug || product.legacyId || product._id;
                  const productPath = `/products/${encodeURIComponent(brandSlug)}/${encodeURIComponent(
                    productSlug
                  )}`;

                  return (
                    <Link
                      key={product._id || product.slug}
                      to={productPath}
                      className="global-search-card"
                      role="listitem"
                      aria-label={`View clinical details for ${product.name}`}
                    >
                      <div className="global-search-card-thumb-wrap">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={product.name}
                            className="global-search-card-thumb"
                            loading="lazy"
                          />
                        ) : (
                          <div className="partner-card-fallback-badge" aria-hidden="true">
                            <span className="partner-card-fallback-icon">🔬</span>
                          </div>
                        )}
                      </div>

                      <div className="global-search-card-body">
                        <div className="global-search-card-meta">
                          <span className="global-search-card-brand-badge">
                            {brandLogo ? (
                              <img
                                src={brandLogo}
                                alt=""
                                className="global-search-card-brand-logo"
                              />
                            ) : null}
                            <span>{brandName}</span>
                          </span>

                          <span className="global-search-card-cat" title={catName}>
                            {catName}
                          </span>
                        </div>

                        <h3 className="global-search-card-title">{product.name}</h3>

                        <p className="global-search-card-desc">
                          {product.shortSpecification ||
                            product.description ||
                            `Premium medical and clinical solution distributed by Sriyas Healthcare.`}
                        </p>

                        <div className="global-search-card-footer">
                          <span className="global-search-card-cta">
                            <span>View Details</span>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M3 8h10M9 4l4 4-4 4"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── 3. PARTNER DIRECTORY (Standard view when search is empty or as footer alternative) ─── */}
        {(!isSearchActive || displayedResults.length === 0) && (
          <div className="partners-directory-section" style={{ marginTop: isSearchActive ? '48px' : '0' }}>
            <div className="section-header partners-page-header">
              <div className="partners-eyebrow">AUTHORIZED MEDICAL DISTRIBUTOR</div>
              <h2>OUR PARTNERS</h2>
              <p>
                We partner with world-class manufacturers to bring premium surgical and healthcare products
                to providers across India. Select a partner below to explore their dedicated product catalogue.
              </p>
              <div className="gold-accent-line" />
            </div>

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
                <button
                  type="button"
                  onClick={fetchDirectory}
                  className="hero-cta"
                  style={{ border: 'none' }}
                >
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
        )}
      </div>
    </section>
  );
}
