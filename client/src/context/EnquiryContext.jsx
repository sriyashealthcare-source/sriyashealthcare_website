import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { productService } from '../services/productService';

const EnquiryContext = createContext(null);

export function EnquiryProvider({ children }) {
  const location = useLocation();

  // Drawer visibility state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Explicitly selected / context product and brand for the drawer
  const [drawerProduct, setDrawerProduct] = useState(null);
  const [drawerBrand, setDrawerBrand] = useState(null);
  const [drawerPrefillMessage, setDrawerPrefillMessage] = useState('');

  // Page-level registered entities (reported by ProductDetails or PartnerProducts)
  const [pageProduct, setPageProduct] = useState(null);
  const [pageBrand, setPageBrand] = useState(null);

  // Cached list of all public brands and products for selector/search
  const [allBrands, setAllBrands] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  // Lazy-load brands and products once
  const loadCatalog = useCallback(async () => {
    if (catalogLoaded) return;
    try {
      const [brandsRes, prodsRes] = await Promise.all([
        productService.getPublicBrands().catch(() => ({ brands: [] })),
        productService.getPublicProducts({ limit: 100 }).catch(() => ({ products: [] }))
      ]);
      setAllBrands(brandsRes?.brands || []);
      setAllProducts(prodsRes?.products || []);
      setCatalogLoaded(true);
    } catch (_) {
      // Non-blocking
    }
  }, [catalogLoaded]);

  // Load catalog on first idle or route change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCatalog();
    }, 800);
    return () => clearTimeout(timer);
  }, [loadCatalog]);

  // Parse route on pathname changes to detect context if not explicitly registered
  const detectedRouteContext = useMemo(() => {
    const path = location.pathname;
    // Do not run on admin routes
    if (path.startsWith('/admin')) {
      return { type: 'admin', brandSlug: '', productSlug: '' };
    }

    // Match /products/:partnerSlug/:productSlug
    const productRouteMatch = path.match(/^\/products\/([^/]+)\/([^/]+)/);
    if (productRouteMatch) {
      return {
        type: 'product',
        brandSlug: productRouteMatch[1],
        productSlug: productRouteMatch[2]
      };
    }

    // Match /product/:slug
    const singleProductMatch = path.match(/^\/product\/([^/]+)/);
    if (singleProductMatch) {
      return {
        type: 'product',
        brandSlug: '',
        productSlug: singleProductMatch[1]
      };
    }

    // Match /products/:partnerSlug
    const partnerRouteMatch = path.match(/^\/products\/([^/]+)/);
    if (partnerRouteMatch && partnerRouteMatch[1] !== 'search') {
      return {
        type: 'brand',
        brandSlug: partnerRouteMatch[1],
        productSlug: ''
      };
    }

    if (path === '/products') {
      return { type: 'catalog', brandSlug: '', productSlug: '' };
    }

    return { type: 'general', brandSlug: '', productSlug: '' };
  }, [location.pathname]);

  // Automatically sync detected brand/product if not already registered
  useEffect(() => {
    if (detectedRouteContext.type !== 'product') {
      if (pageProduct) setPageProduct(null);
    }
    if (detectedRouteContext.type !== 'brand' && detectedRouteContext.type !== 'product') {
      if (pageBrand) setPageBrand(null);
    }
  }, [detectedRouteContext, pageProduct, pageBrand]);

  /**
   * Open the Enquiry Drawer
   * @param {Object} options - { product, brand, prefillMessage }
   */
  const openDrawer = useCallback((options = {}) => {
    loadCatalog();

    // 1. Check if explicit options passed
    if (options.product) {
      setDrawerProduct(options.product);
      setDrawerBrand(options.brand || options.product.brand || null);
      setDrawerPrefillMessage(
        options.prefillMessage || `I would like to know more about ${options.product.name} and request technical specifications/quotation.`
      );
    } else if (options.brand) {
      setDrawerProduct(null);
      setDrawerBrand(options.brand);
      setDrawerPrefillMessage(
        options.prefillMessage || `I would like to enquire about surgical products from ${options.brand.name}.`
      );
    } else if (pageProduct) {
      // 2. Use page-registered product (e.g. from ProductDetails component)
      setDrawerProduct(pageProduct);
      setDrawerBrand(pageProduct.brand || null);
      setDrawerPrefillMessage(
        `I would like to know more about ${pageProduct.name} and request technical specifications/quotation.`
      );
    } else if (pageBrand) {
      // 3. Use page-registered brand (e.g. from PartnerProducts component)
      setDrawerProduct(null);
      setDrawerBrand(pageBrand);
      setDrawerPrefillMessage(
        `I would like to enquire about surgical products from ${pageBrand.name}.`
      );
    } else if (detectedRouteContext.brandSlug) {
      // 4. Fallback lookup from catalog brands
      const foundBrand = allBrands.find(b => b.slug === detectedRouteContext.brandSlug);
      if (foundBrand) {
        setDrawerBrand(foundBrand);
        setDrawerProduct(null);
        setDrawerPrefillMessage(`I would like to enquire about surgical products from ${foundBrand.name}.`);
      } else {
        setDrawerProduct(null);
        setDrawerBrand(null);
        setDrawerPrefillMessage(options.prefillMessage || 'I would like to enquire about surgical supplies and healthcare solutions.');
      }
    } else {
      // 5. General healthcare enquiry
      setDrawerProduct(null);
      setDrawerBrand(null);
      setDrawerPrefillMessage(options.prefillMessage || 'I would like to enquire about surgical supplies and healthcare solutions.');
    }

    setIsDrawerOpen(true);
  }, [loadCatalog, pageProduct, pageBrand, detectedRouteContext, allBrands]);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    if (isDrawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }, [isDrawerOpen, closeDrawer, openDrawer]);

  const selectProduct = useCallback((product) => {
    setDrawerProduct(product);
    if (product?.brand) {
      setDrawerBrand(typeof product.brand === 'object' ? product.brand : { name: product.brand });
    }
    if (product) {
      setDrawerPrefillMessage(`I would like to know more about ${product.name} and request technical specifications/quotation.`);
    }
  }, []);

  const clearProduct = useCallback(() => {
    setDrawerProduct(null);
  }, []);

  const selectBrand = useCallback((brand) => {
    setDrawerBrand(brand);
  }, []);

  const clearBrand = useCallback(() => {
    setDrawerBrand(null);
    setDrawerProduct(null);
  }, []);

  const value = useMemo(() => ({
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    drawerProduct,
    drawerBrand,
    drawerPrefillMessage,
    setDrawerPrefillMessage,
    selectProduct,
    clearProduct,
    selectBrand,
    clearBrand,
    setPageProduct,
    setPageBrand,
    pageProduct,
    pageBrand,
    allBrands,
    allProducts,
    loadCatalog
  }), [
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    drawerProduct,
    drawerBrand,
    drawerPrefillMessage,
    selectProduct,
    clearProduct,
    selectBrand,
    clearBrand,
    setPageProduct,
    setPageBrand,
    pageProduct,
    pageBrand,
    allBrands,
    allProducts,
    loadCatalog
  ]);

  return (
    <EnquiryContext.Provider value={value}>
      {children}
    </EnquiryContext.Provider>
  );
}

export function useEnquiry() {
  const context = useContext(EnquiryContext);
  if (!context) {
    throw new Error('useEnquiry must be used within an EnquiryProvider');
  }
  return context;
}
