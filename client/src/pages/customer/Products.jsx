import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import ProductCard from '../../components/product/ProductCard';
import { resolveAssetUrl } from '../../utils/session';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedBrand = searchParams.get('brand') || '';

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeBrandSlug, setActiveBrandSlug] = useState(requestedBrand || 'peters');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Product Catalogue | Sriyas Healthcare Pvt Ltd';
  }, []);

  const fetchCatalogue = async () => {
    try {
      setLoading(true);
      setError('');
      const [brandsRes, catsRes, prodsRes] = await Promise.all([
        productService.getPublicBrands(),
        productService.getPublicCategories(),
        productService.getPublicProducts()
      ]);

      const activeBrands = brandsRes.brands || [];
      const activeCats = catsRes.categories || [];
      const activeProds = prodsRes.products || [];

      setBrands(activeBrands);
      setCategories(activeCats);
      setProducts(activeProds);

      if (requestedBrand && activeBrands.some(b => b.slug === requestedBrand)) {
        setActiveBrandSlug(requestedBrand);
      } else if (activeBrands.length > 0 && !activeBrands.some(b => b.slug === activeBrandSlug)) {
        setActiveBrandSlug(activeBrands[0].slug);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load the product catalogue at this moment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogue();
  }, []);

  useEffect(() => {
    if (requestedBrand && brands.some(b => b.slug === requestedBrand)) {
      setActiveBrandSlug(requestedBrand);
    }
  }, [requestedBrand, brands]);

  const handleSelectBrand = (slug) => {
    setActiveBrandSlug(slug);
    setSearchQuery('');
    setSearchParams({ brand: slug }, { replace: true });
  };

  const activeBrand = useMemo(
    () => brands.find(b => b.slug === activeBrandSlug) || brands[0] || null,
    [brands, activeBrandSlug]
  );

  // Filter products when search is active vs normal brand view
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    return products.filter(p => {
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.shortSpecification || '').toLowerCase().includes(q) ||
        (p.cardCategory || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.brand?.name || '').toLowerCase().includes(q) ||
        (p.category?.name || '').toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery]);

  // Group products by category for the currently selected brand
  const brandCategorySections = useMemo(() => {
    if (!activeBrand) return [];
    const brandIdStr = String(activeBrand._id);
    const brandProducts = products.filter(
      p => String(p.brand?._id || p.brand) === brandIdStr
    );

    const brandCats = categories.filter(
      c => String(c.brand?._id || c.brand) === brandIdStr
    );

    const sections = [];
    const groupedCategoryIds = new Set();

    for (const cat of brandCats) {
      const catIdStr = String(cat._id);
      const prodsInCat = brandProducts.filter(
        p => String(p.category?._id || p.category) === catIdStr
      );
      if (prodsInCat.length > 0) {
        sections.push({
          category: cat,
          products: prodsInCat
        });
        groupedCategoryIds.add(catIdStr);
      }
    }

    // Include any products assigned to categories not yet in brandCats
    const remainingProds = brandProducts.filter(
      p => !groupedCategoryIds.has(String(p.category?._id || p.category))
    );
    if (remainingProds.length > 0) {
      const fallbackMap = {};
      for (const p of remainingProds) {
        const cObj = p.category || { _id: 'other', name: p.cardCategory || 'Other Products' };
        const cid = String(cObj._id || cObj.name);
        if (!fallbackMap[cid]) {
          fallbackMap[cid] = { category: cObj, products: [] };
        }
        fallbackMap[cid].products.push(p);
      }
      sections.push(...Object.values(fallbackMap));
    }

    return sections;
  }, [activeBrand, categories, products]);

  return (
    <section className="products-section" id="products-section" aria-label="Product Catalog">
      <div className="section-header">
        <h2>OUR PARTNERS</h2>
        <p>
          We partner with world-class manufacturers to bring premium surgical and healthcare products
          to providers across India.
        </p>
      </div>

      {/* PARTNER LOGOS */}
      <div className="partner-logos-row" aria-label="Partner Brand Logos">
        <button
          type="button"
          className="partner-logo-item"
          onClick={() => handleSelectBrand('peters')}
          title="View Peters Surgical Products"
        >
          <img
            src="/assets/logos/peters-surgical.png"
            alt="Peters Surgical"
            className="partner-logo-img logo-peters"
            loading="lazy"
          />
        </button>
        <button
          type="button"
          className="partner-logo-item"
          onClick={() => handleSelectBrand('liquiband')}
          title="View LiquiBand® Products"
        >
          <img
            src="/assets/logos/liquiband.png"
            alt="LiquiBand®"
            className="partner-logo-img logo-liquiband"
            loading="lazy"
          />
        </button>
        <button
          type="button"
          className="partner-logo-item"
          onClick={() => handleSelectBrand('liquiband')}
          title="Advanced Medical Solutions"
        >
          <img
            src="/assets/logos/advanced-medical-solutions.png"
            alt="Advanced Medical Solutions"
            className="partner-logo-img logo-ams"
            loading="lazy"
          />
        </button>
        <button
          type="button"
          className="partner-logo-item"
          onClick={() => handleSelectBrand('gore')}
          title="View W.L. Gore & Associates Products"
        >
          <img
            src="/assets/logos/gore.png"
            alt="W. L. Gore & Associates"
            className="partner-logo-img logo-gore"
            loading="lazy"
          />
        </button>
      </div>

      {/* BRAND TABS */}
      {brands.length > 0 && (
        <div className="brand-tabs" role="tablist" aria-label="Product Brand Selection">
          {brands.map((brand) => {
            const isSelected = activeBrand?.slug === brand.slug && !searchQuery.trim();
            return (
              <button
                key={brand._id || brand.slug}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`brand-tab ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectBrand(brand.slug)}
              >
                <span>{brand.icon || '🔬'}</span>
                <span>{brand.tabLabel || brand.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="catalog-toolbar">
        <div className="catalog-search-box">
          <span className="catalog-search-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            className="catalog-search-input"
            placeholder="Search surgical sutures, meshes, adhesives, biomaterials..."
            aria-label="Search products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="catalog-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="state-container">
          <div className="spinner" />
          <div className="state-title">Loading Product Catalogue</div>
          <p className="state-desc">Retrieving surgical &amp; medical solutions...</p>
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="state-container">
          <div className="state-title">Unable to Load Products</div>
          <p className="state-desc">{error}</p>
          <button type="button" className="hero-cta" onClick={fetchCatalogue}>
            Retry Loading
          </button>
        </div>
      )}

      {/* SEARCH RESULTS VIEW */}
      {!loading && !error && searchResults !== null && (
        <div className="cat-section fade-in-up">
          <div className="cat-label">
            <span>
              Search Results for &ldquo;{searchQuery.trim()}&rdquo; ({searchResults.length})
            </span>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gold-deep)',
                cursor: 'pointer',
                fontFamily: 'var(--font-brand)',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="state-container">
              <div className="state-title">No Matching Products Found</div>
              <p className="state-desc">
                No active products matched &ldquo;{searchQuery}&rdquo;. Try searching by product name,
                brand, or material (e.g. PGA, PTFE, LiquiBand, Sorbact).
              </p>
            </div>
          ) : (
            <div className="prod-grid">
              {searchResults.map((product) => (
                <ProductCard key={product._id || product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* STANDARD BRAND PANEL VIEW */}
      {!loading && !error && searchResults === null && activeBrand && (
        <div
          className="brand-panel active"
          id={`brand-${activeBrand.slug}`}
          key={activeBrand.slug}
        >
          {brandCategorySections.length === 0 ? (
            <div className="state-container">
              <div className="state-title">No Active Products in {activeBrand.name}</div>
              <p className="state-desc">
                Products under this partner brand will appear here once published.
              </p>
            </div>
          ) : (
            brandCategorySections.map(({ category, products: catProducts }) => {
              const heroImgUrl = category.heroImage?.url
                ? resolveAssetUrl(category.heroImage.url)
                : '';
              const gradient =
                category.heroGradient || 'linear-gradient(135deg,#1a3a5c,#2d6b9e)';

              return (
                <div className="cat-section" key={category._id || category.slug || category.name}>
                  {(category.heroTitle || category.description || heroImgUrl) && (
                    <div className="cat-hero" style={{ background: gradient }}>
                      {heroImgUrl && (
                        <img
                          src={heroImgUrl}
                          alt={category.heroTitle || category.name}
                          loading="lazy"
                        />
                      )}
                      <div className="cat-hero-text">
                        <h3>{category.heroTitle || category.name}</h3>
                        {category.description && <p>{category.description}</p>}
                      </div>
                    </div>
                  )}

                  <div className="cat-label">{category.name}</div>

                  <div className="prod-grid">
                    {catProducts.map((product) => (
                      <ProductCard key={product._id || product.slug} product={product} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}

