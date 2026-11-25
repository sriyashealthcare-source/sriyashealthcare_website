import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import ProductCard from '../../components/product/ProductCard';
import GlobalSearchBar from '../../components/common/GlobalSearchBar';
import { resolveAssetUrl } from '../../utils/session';
import { BRAND_LOGOS } from '../../utils/cloudinaryAssets';

function normalizeSearchText(str) {
  if (!str) return '';
  return String(str)
    .replace(/[™®©]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedBrand = searchParams.get('brand') || '';

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeBrandSlug, setActiveBrandSlug] = useState(requestedBrand || 'ams');
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
    if (!searchQuery.trim()) return null;
    const q = normalizeSearchText(searchQuery);
    const tokens = q.split(/\s+/).filter(Boolean);

    return products.filter(p => {
      const name = normalizeSearchText(p.name);
      const spec = normalizeSearchText(p.shortSpecification);
      const cat = normalizeSearchText(p.category?.name || p.cardCategory);
      const desc = normalizeSearchText(p.description);
      const brand = normalizeSearchText(p.brand?.name);
      const keywords = Array.isArray(p.keywords) ? normalizeSearchText(p.keywords.join(' ')) : '';
      const specsText = Array.isArray(p.specifications)
        ? normalizeSearchText(p.specifications.map(s => `${s.key || ''} ${s.value || ''}`).join(' '))
        : '';
      const combined = `${name} ${spec} ${cat} ${desc} ${brand} ${keywords} ${specsText}`;

      return tokens.every(token => combined.includes(token));
    });
  }, [products, searchQuery]);

  // Group products by category for the currently selected brand
  const brandCategorySections = useMemo(() => {
    if (!activeBrand) return [];
    const brandIdStr = String(activeBrand._id);
    const brandProducts = products.filter(
      p => String(p.brand?._id || p.brand) === brandIdStr
    );

    // Only top-level main categories for this brand
    const brandCats = categories
      .filter(c => String(c.brand?._id || c.brand) === brandIdStr && !c.parentCategory)
      .sort((a, b) => (Number(a.displayOrder) || 99) - (Number(b.displayOrder) || 99));

    const allSubcats = categories.filter(c => Boolean(c.parentCategory));

    const sections = [];
    const groupedCategoryIds = new Set();

    for (const cat of brandCats) {
      const catIdStr = String(cat._id);
      const subcategories = allSubcats
        .filter(s => String(s.parentCategory?._id || s.parentCategory) === catIdStr)
        .sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));

      const subcatIdSet = new Set(subcategories.map(s => String(s._id)));

      // Products in this category (either directly assigned to category, or assigned to one of its subcategories)
      const prodsInCat = brandProducts
        .filter(p => {
          const pCatId = String(p.category?._id || p.category || '');
          const pSubId = String(p.subcategory?._id || p.subcategory || '');
          return pCatId === catIdStr || subcatIdSet.has(pSubId);
        })
        .sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));

      if (prodsInCat.length > 0 || subcategories.length > 0) {
        sections.push({
          category: cat,
          subcategories,
          products: prodsInCat
        });
        groupedCategoryIds.add(catIdStr);
        subcategories.forEach(s => groupedCategoryIds.add(String(s._id)));
      }
    }

    // Include any products assigned to categories not yet in brandCats
    const remainingProds = brandProducts.filter(
      p =>
        !groupedCategoryIds.has(String(p.category?._id || p.category)) &&
        !groupedCategoryIds.has(String(p.subcategory?._id || p.subcategory))
    );
    if (remainingProds.length > 0) {
      const fallbackMap = {};
      for (const p of remainingProds) {
        const cObj = p.category || { _id: 'other', name: p.cardCategory || 'Other Products' };
        const cid = String(cObj._id || cObj.name);
        if (!fallbackMap[cid]) {
          fallbackMap[cid] = { category: cObj, subcategories: [], products: [] };
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
      {brands.length > 0 && (
        <div className="partner-logos-row" aria-label="Partner Brand Logos">
          {brands.map((b) => {
            const isSelected = activeBrand?.slug === b.slug && !searchQuery.trim();
            const logoSrc = resolveAssetUrl(b.logoUrl) || BRAND_LOGOS[b.slug] || BRAND_LOGOS[b.slug.replace('-healthcare', '')];
            return (
              <button
                key={b._id || b.slug}
                type="button"
                className={`partner-logo-item ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectBrand(b.slug)}
                title={`View ${b.name} Products`}
              >
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt={b.name}
                    className={`partner-logo-img logo-${b.slug}`}
                    loading="lazy"
                  />
                ) : (
                  <span className="partner-logo-text">{b.tabLabel || b.name}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

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
                {brand.logoUrl ? (
                  <img
                    src={resolveAssetUrl(brand.logoUrl)}
                    alt=""
                    className="brand-tab-logo"
                  />
                ) : (
                  <span>{brand.icon || '🔬'}</span>
                )}
                <span>{brand.tabLabel || brand.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="catalog-toolbar">
        <GlobalSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search surgical sutures, meshes, adhesives, biomaterials..."
          ariaLabel="Search products"
          id="products-catalogue-search-input"
        />
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
            brandCategorySections.map(({ category, subcategories, products: catProducts }) => (
              <CategorySectionView
                key={category._id || category.slug || category.name}
                category={category}
                subcategories={subcategories}
                products={catProducts}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}

function CategorySectionView({ category, subcategories = [], products = [] }) {
  const [activeSubId, setActiveSubId] = useState('all');

  const heroImgUrl = category.heroImage?.url
    ? resolveAssetUrl(category.heroImage.url)
    : '';
  const gradient =
    category.heroGradient || 'linear-gradient(135deg,#1a3a5c,#2d6b9e)';

  const displayedProducts = useMemo(() => {
    if (activeSubId === 'all') return products;
    return products.filter(p => {
      const pSubId = String(p.subcategory?._id || p.subcategory || '');
      return pSubId === activeSubId;
    });
  }, [products, activeSubId]);

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

      <div className="cat-header-row">
        <div className="cat-label">{category.name}</div>
        {products.length > 0 && (
          <span className="cat-count-pill">
            {products.length} {products.length === 1 ? 'Product' : 'Products'}
          </span>
        )}
      </div>

      {/* SUBCATEGORY TABS / FILTER CARDS */}
      {subcategories.length > 0 && (
        <div className="subcat-filter-wrapper" role="tablist" aria-label={`${category.name} subcategories`}>
          <button
            type="button"
            role="tab"
            aria-selected={activeSubId === 'all'}
            className={`subcat-tab-card ${activeSubId === 'all' ? 'active' : ''}`}
            onClick={() => setActiveSubId('all')}
          >
            <div className="subcat-tab-name">
              <span>All Products</span>
              <span className="subcat-badge">{products.length}</span>
            </div>
            <div className="subcat-tab-desc">View full {category.name} range</div>
          </button>

          {subcategories.map((sub) => {
            const countInSub = products.filter(
              p => String(p.subcategory?._id || p.subcategory || '') === String(sub._id)
            ).length;

            return (
              <button
                key={sub._id || sub.slug}
                type="button"
                role="tab"
                aria-selected={activeSubId === String(sub._id)}
                className={`subcat-tab-card ${activeSubId === String(sub._id) ? 'active' : ''}`}
                onClick={() => setActiveSubId(String(sub._id))}
              >
                <div className="subcat-tab-name">
                  <span>{sub.name}</span>
                  <span className="subcat-badge">{countInSub}</span>
                </div>
                {sub.description ? (
                  <div className="subcat-tab-desc">{sub.description}</div>
                ) : (
                  <div className="subcat-tab-desc">Clinical surgical products</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {displayedProducts.length === 0 ? (
        <div className="subcat-empty-state">
          <p>No products currently listed under this subcategory.</p>
          <button
            type="button"
            className="subcat-reset-btn"
            onClick={() => setActiveSubId('all')}
          >
            Show All Products in {category.name}
          </button>
        </div>
      ) : (
        <div className="prod-grid">
          {displayedProducts.map((product) => (
            <ProductCard key={product._id || product.slug} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

