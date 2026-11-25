import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import PartnerProducts from './PartnerProducts';
import ProductDetails from './ProductDetails';

/**
 * Dispatches `/products/:partnerSlug/:slug` cleanly:
 * - If `:slug` matches a Category (e.g. `dolphin-sutures`, `medical-adhesives`, etc.),
 *   it renders the progressive drill-down Category View (`PartnerProducts`).
 * - If `:slug` matches a Product (e.g. `surgical-kit-hernia`, `liquiband-optima`, etc.),
 *   it renders `ProductDetails`.
 */
export default function PartnerCategoryOrProductDispatcher() {
  const { partnerSlug, categoryOrProductSlug } = useParams();
  const [resolvedType, setResolvedType] = useState(null); // 'category' | 'product'

  useEffect(() => {
    let isMounted = true;
    async function resolveSlug() {
      if (!partnerSlug || !categoryOrProductSlug) return;
      try {
        // Fetch categories for this brand to see if slug is a category
        const res = await productService.getPublicCategories({ brand: partnerSlug });
        const categories = res?.categories || [];
        const isCat = categories.some(
          c =>
            String(c.slug || '').toLowerCase() === categoryOrProductSlug.toLowerCase() ||
            String(c._id) === categoryOrProductSlug
        );

        if (!isMounted) return;
        if (isCat) {
          setResolvedType('category');
        } else {
          setResolvedType('product');
        }
      } catch (_) {
        // If categories fetch fails, fallback to product
        if (isMounted) setResolvedType('product');
      }
    }

    resolveSlug();
    return () => {
      isMounted = false;
    };
  }, [partnerSlug, categoryOrProductSlug]);

  if (!resolvedType) {
    return (
      <div className="state-container" style={{ minHeight: '400px' }}>
        <div className="spinner" />
        <div className="state-title">Loading Catalogue</div>
      </div>
    );
  }

  if (resolvedType === 'category') {
    return <PartnerProducts categorySlugProp={categoryOrProductSlug} />;
  }

  return <ProductDetails />;
}
