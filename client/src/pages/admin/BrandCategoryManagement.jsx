import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { productService } from '../../services/productService';
import { resolveAssetUrl } from '../../utils/session';

export default function BrandCategoryManagement() {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Brand Modal / Form state
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandName, setBrandName] = useState('');
  const [brandSpecialty, setBrandSpecialty] = useState('');
  const [brandIsActive, setBrandIsActive] = useState(true);
  const [brandTabLabel, setBrandTabLabel] = useState('');
  const [brandIcon, setBrandIcon] = useState('🔬');
  const [brandDescription, setBrandDescription] = useState('');
  const [brandOrder, setBrandOrder] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [brandLogoPublicId, setBrandLogoPublicId] = useState('');
  const [brandLogoPreview, setBrandLogoPreview] = useState('');
  const [brandLogoFile, setBrandLogoFile] = useState(null);
  const [brandLogoMarkedForRemoval, setBrandLogoMarkedForRemoval] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [logoFeedback, setLogoFeedback] = useState(null);
  const logoFileInputRef = useRef(null);

  // Brand SEO Fields
  const [brandSeoTitle, setBrandSeoTitle] = useState('');
  const [brandSeoDescription, setBrandSeoDescription] = useState('');
  const [brandLogoAlt, setBrandLogoAlt] = useState('');

  // Category Modal / Form state
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catBrandId, setCatBrandId] = useState('');
  const [catParentId, setCatParentId] = useState('');
  const [catHeroTitle, setCatHeroTitle] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catGradient, setCatGradient] = useState('linear-gradient(135deg,#1a3a5c,#2d6b9e)');
  const [catHeroFile, setCatHeroFile] = useState(null);
  const [catLogoFile, setCatLogoFile] = useState(null);
  const [catLogoUrl, setCatLogoUrl] = useState('');
  const [catOrder, setCatOrder] = useState('');

  const [catBrandFilter, setCatBrandFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    document.title = 'Brands & Categories | Sriyas Healthcare Admin';
  }, []);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [bRes, cRes] = await Promise.all([
        productService.getAdminBrands(),
        productService.getAdminCategories()
      ]);
      setBrands(bRes.brands || []);
      setCategories(cRes.categories || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load brands and categories.', true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Brand Handlers
  const openAddBrand = () => {
    setEditingBrand(null);
    setBrandName('');
    setBrandSpecialty('');
    setBrandIsActive(true);
    setBrandTabLabel('');
    setBrandIcon('🔬');
    setBrandDescription('');
    setBrandOrder(String(brands.length + 1));
    setBrandLogoUrl('');
    setBrandLogoPublicId('');
    setBrandLogoPreview('');
    setBrandLogoFile(null);
    setBrandLogoMarkedForRemoval(false);
    setUploadingLogo(false);
    setUploadProgress(0);
    setLogoFeedback(null);
    setBrandSeoTitle('');
    setBrandSeoDescription('');
    setBrandLogoAlt('');
    setBrandModalOpen(true);
  };

  const openEditBrand = (b) => {
    setEditingBrand(b);
    setBrandName(b.name || '');
    setBrandSpecialty(b.specialty || '');
    setBrandIsActive(b.isActive !== false);
    setBrandTabLabel(b.tabLabel || b.name || '');
    setBrandIcon(b.icon || '🔬');
    setBrandDescription(b.description || '');
    setBrandOrder(b.displayOrder !== undefined ? String(b.displayOrder) : '');
    setBrandLogoUrl(b.logoUrl || '');
    setBrandLogoPublicId(b.logoPublicId || '');
    setBrandLogoPreview(b.logoUrl ? resolveAssetUrl(b.logoUrl) : '');
    setBrandLogoFile(null);
    setBrandLogoMarkedForRemoval(false);
    setUploadingLogo(false);
    setUploadProgress(0);
    setLogoFeedback(null);
    setBrandSeoTitle(b.seoTitle || '');
    setBrandSeoDescription(b.seoDescription || '');
    setBrandLogoAlt(b.logoAlt || (b.name ? `${b.name} logo` : ''));
    setBrandModalOpen(true);
  };

  const handleLogoFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

    if (!validTypes.includes(file.type) && !isSvg) {
      setLogoFeedback({
        type: 'error',
        text: 'Unsupported file type. Please upload a PNG, JPG, JPEG, WEBP, or SVG image.'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoFeedback({
        type: 'error',
        text: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 5 MB.`
      });
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setBrandLogoPreview(localUrl);
    setBrandLogoFile(file);
    setBrandLogoMarkedForRemoval(false);
    setLogoFeedback({ type: 'info', text: 'Uploading logo to Cloudinary...' });
    setUploadingLogo(true);
    setUploadProgress(0);

    try {
      const res = await productService.uploadBrandLogo(file, (percent) => {
        setUploadProgress(percent);
      });
      if (res?.logo?.url) {
        setBrandLogoUrl(res.logo.url);
        setBrandLogoPublicId(res.logo.publicId || '');
        setBrandLogoPreview(resolveAssetUrl(res.logo.url));
        setLogoFeedback({
          type: 'success',
          text: '✓ Logo uploaded to Cloudinary successfully. Click "Save Brand" to persist.'
        });
      } else {
        throw new Error(res?.message || 'Upload succeeded but no image URL was returned.');
      }
    } catch (err) {
      setLogoFeedback({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to upload logo image to Cloudinary.'
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setBrandLogoUrl('');
    setBrandLogoPublicId('');
    setBrandLogoPreview('');
    setBrandLogoFile(null);
    setBrandLogoMarkedForRemoval(true);
    setLogoFeedback({
      type: 'info',
      text: 'Logo removed. Click "Save Brand" to apply changes.'
    });
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (uploadingLogo) {
      showToast('Please wait for the logo upload to finish before saving.', true);
      return;
    }

    try {
      const payload = {
        name: brandName.trim(),
        specialty: brandSpecialty.trim(),
        isActive: brandIsActive,
        tabLabel: (brandTabLabel || brandName).trim(),
        icon: brandIcon.trim() || '🔬',
        description: brandDescription.trim(),
        seoTitle: brandSeoTitle.trim(),
        seoDescription: brandSeoDescription.trim(),
        logoAlt: brandLogoAlt.trim(),
        displayOrder: brandOrder !== '' ? Number(brandOrder) : undefined,
        logoUrl: brandLogoMarkedForRemoval ? '' : brandLogoUrl,
        logoPublicId: brandLogoMarkedForRemoval ? '' : brandLogoPublicId,
        removeLogo: brandLogoMarkedForRemoval
      };
      if (editingBrand) {
        const res = await productService.updateBrand(editingBrand._id, payload);
        showToast(res.message || 'Brand updated.');
      } else {
        const res = await productService.createBrand(payload);
        showToast(res.message || 'Brand created.');
      }
      setBrandModalOpen(false);
      loadAll();
      window.dispatchEvent(new CustomEvent('sriyas:brands-updated'));
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not save brand.', true);
    }
  };

  const handleToggleBrand = async (b) => {
    try {
      const res = await productService.toggleBrandStatus(b._id, !b.isActive);
      showToast(res.message || 'Brand status updated.');
      loadAll();
      window.dispatchEvent(new CustomEvent('sriyas:brands-updated'));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update brand status.', true);
    }
  };

  // Category Handlers
  const openAddCategory = (parentCat = null) => {
    setEditingCategory(null);
    setCatName('');
    const defaultBrand = parentCat
      ? String(parentCat.brand?._id || parentCat.brand || '')
      : (catBrandFilter || brands[0]?._id || '');
    setCatBrandId(defaultBrand);
    setCatParentId(parentCat ? String(parentCat._id) : '');
    setCatHeroTitle('');
    setCatDescription('');
    setCatGradient('linear-gradient(135deg,#1a3a5c,#2d6b9e)');
    setCatHeroFile(null);
    setCatLogoFile(null);
    setCatLogoUrl('');
    setCatOrder(String(categories.length + 1));
    setCatModalOpen(true);
  };

  const openEditCategory = (c) => {
    setEditingCategory(c);
    setCatName(c.name || '');
    setCatBrandId(String(c.brand?._id || c.brand || ''));
    setCatParentId(c.parentCategory ? String(c.parentCategory._id || c.parentCategory) : '');
    setCatHeroTitle(c.heroTitle || c.name || '');
    setCatDescription(c.description || '');
    setCatGradient(c.heroGradient || 'linear-gradient(135deg,#1a3a5c,#2d6b9e)');
    setCatHeroFile(null);
    setCatLogoFile(null);
    setCatLogoUrl(c.logoUrl || c.logo_url || c.logoImage?.url || '');
    setCatOrder(c.displayOrder !== undefined ? String(c.displayOrder) : '');
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', catName.trim());
      formData.append('brand', catBrandId);
      formData.append('parentCategory', catParentId || '');
      formData.append('heroTitle', (catHeroTitle || catName).trim());
      formData.append('description', catDescription.trim());
      formData.append('heroGradient', catGradient.trim());
      if (catOrder !== '') {
        formData.append('displayOrder', String(catOrder));
      }
      if (catHeroFile) {
        formData.append('heroImage', catHeroFile);
      }
      if (catLogoFile) {
        formData.append('logo', catLogoFile);
      }
      formData.append('logoUrl', (catLogoUrl || '').trim());

      if (editingCategory) {
        const res = await productService.updateCategory(editingCategory._id, formData);
        showToast(res.message || 'Category updated.');
      } else {
        const res = await productService.createCategory(formData);
        showToast(res.message || 'Category created.');
      }
      setCatModalOpen(false);
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not save category.', true);
    }
  };

  const handleToggleCategory = async (c) => {
    try {
      const res = await productService.toggleCategoryStatus(c._id, !c.isActive);
      showToast(res.message || 'Category status updated.');
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update category status.', true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'brand') {
        const res = await productService.deleteBrand(deleteTarget.item._id);
        showToast(res.message || 'Brand deleted.');
        window.dispatchEvent(new CustomEvent('sriyas:brands-updated'));
      } else {
        const res = await productService.deleteCategory(deleteTarget.item._id);
        showToast(res.message || 'Category deleted.');
      }
      setDeleteTarget(null);
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Cannot delete item.', true);
      setDeleteTarget(null);
    }
  };

  const filteredCategories = catBrandFilter
    ? categories.filter(c => String(c.brand?._id || c.brand) === String(catBrandFilter))
    : categories;

  // Hierarchical list: Main categories with their subcategories directly nested below
  const hierarchicalCategories = useMemo(() => {
    const mainCats = filteredCategories.filter(c => !c.parentCategory);
    const subCats = filteredCategories.filter(c => Boolean(c.parentCategory));
    const result = [];

    mainCats.forEach(main => {
      const children = subCats.filter(sub => {
        const pId = String(sub.parentCategory?._id || sub.parentCategory);
        return pId === String(main._id);
      });
      result.push({ ...main, isSub: false, subCount: children.length });
      children.forEach(child => {
        result.push({ ...child, isSub: true, parentName: main.name });
      });
    });

    // Also include any subcategories whose parent wasn't in mainCats
    subCats.forEach(sub => {
      const pId = String(sub.parentCategory?._id || sub.parentCategory);
      if (!mainCats.some(m => String(m._id) === pId)) {
        const parentDoc = categories.find(c => String(c._id) === pId);
        result.push({ ...sub, isSub: true, parentName: parentDoc?.name || 'Parent Category' });
      }
    });

    return result;
  }, [filteredCategories, categories]);

  return (
    <div className="fade-in-up">
      <div className="admin-page-header">
        <div>
          <h1>Brands &amp; Categories Management</h1>
          <p>
            Manage partner brands and product category sections displayed on the customer website.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" className="adm-btn adm-btn-secondary" onClick={openAddBrand}>
            + Add Brand
          </button>
          <button type="button" className="adm-btn adm-btn-primary" onClick={openAddCategory}>
            + Add Category
          </button>
        </div>
      </div>

      {loading ? (
        <div className="state-container">
          <div className="spinner" />
          <div className="state-title">Loading Brands &amp; Categories...</div>
        </div>
      ) : (
        <>
          {/* BRANDS SECTION */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Partner Brands ({brands.length})</h2>
              <button
                type="button"
                className="adm-btn adm-btn-primary adm-btn-sm"
                onClick={openAddBrand}
              >
                + Add Brand
              </button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Logo</th>
                    <th>Brand</th>
                    <th>Slug</th>
                    <th>Categories</th>
                    <th>Products</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b) => (
                    <tr key={b._id}>
                      <td>{b.displayOrder}</td>
                      <td>
                        <div className="admin-brand-table-logo-box">
                          {b.logoUrl ? (
                            <img
                              src={resolveAssetUrl(b.logoUrl)}
                              alt={`${b.name} logo`}
                              className="admin-brand-table-logo"
                            />
                          ) : (
                            <div className="admin-brand-table-logo-fallback" title="No logo uploaded (displays brand name fallback)">
                              <span>{b.icon || '🔬'}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-prod-name">
                          {b.name}
                        </div>
                        {b.specialty && (
                          <div style={{ fontSize: '0.75rem', color: '#a9822c', fontWeight: 600, marginTop: '2px' }}>
                            🏷️ {b.specialty}
                          </div>
                        )}
                        {b.description && (
                          <div className="admin-prod-sub">
                            {b.description.slice(0, 75)}
                            {b.description.length > 75 ? '...' : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        <code>{b.slug}</code>
                      </td>
                      <td>{b.categoryCount || 0}</td>
                      <td>
                        <strong>{b.activeProductCount || 0}</strong> active ({b.productCount || 0}{' '}
                        total)
                      </td>
                      <td>
                        <span className={`status-badge ${b.isActive ? 'active' : 'inactive'}`}>
                          {b.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            gap: '6px',
                            justifyContent: 'flex-end'
                          }}
                        >
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => openEditBrand(b)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => handleToggleBrand(b)}
                          >
                            {b.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-danger adm-btn-sm"
                            onClick={() => setDeleteTarget({ type: 'brand', item: b })}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CATEGORIES SECTION */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">
                Product Categories &amp; Subcategories ({hierarchicalCategories.length})
              </h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  className="admin-select"
                  value={catBrandFilter}
                  onChange={(e) => setCatBrandFilter(e.target.value)}
                  aria-label="Filter categories by brand"
                >
                  <option value="">All Brands</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="adm-btn adm-btn-primary adm-btn-sm"
                  onClick={() => openAddCategory()}
                >
                  + Add Category
                </button>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Category Name &amp; Hierarchy</th>
                    <th>Brand</th>
                    <th>Products</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hierarchicalCategories.map((c) => (
                    <tr
                      key={c._id}
                      style={c.isSub ? { background: 'rgba(212, 175, 55, 0.03)' } : undefined}
                    >
                      <td>{c.displayOrder}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {c.isSub && (
                            <span
                              style={{
                                color: 'var(--gold-deep)',
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                fontSize: '1rem',
                                paddingLeft: '16px'
                              }}
                            >
                              ↳
                            </span>
                          )}
                          <div>
                            <div className="admin-prod-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              {(c.logoUrl || c.logo_url) && (
                                <img
                                  src={c.logoUrl || c.logo_url}
                                  alt={c.name}
                                  style={{
                                    height: '24px',
                                    maxWidth: '48px',
                                    objectFit: 'contain',
                                    borderRadius: '4px',
                                    background: '#ffffff',
                                    padding: '2px',
                                    border: '1px solid #e2e8f0'
                                  }}
                                />
                              )}
                              <span>{c.name}</span>
                              {c.isSub ? (
                                <span
                                  className="status-badge"
                                  style={{
                                    background: 'rgba(212, 175, 55, 0.12)',
                                    color: '#8a6d1c',
                                    borderColor: 'rgba(212, 175, 55, 0.35)',
                                    fontSize: '0.7rem',
                                    padding: '2px 8px'
                                  }}
                                >
                                  Subcategory of {c.parentName}
                                </span>
                              ) : (
                                c.subCount > 0 && (
                                  <span
                                    className="status-badge"
                                    style={{
                                      background: 'rgba(13, 30, 56, 0.06)',
                                      color: 'var(--ink)',
                                      fontSize: '0.7rem',
                                      padding: '2px 8px'
                                    }}
                                  >
                                    {c.subCount} {c.subCount === 1 ? 'Subcategory' : 'Subcategories'}
                                  </span>
                                )
                              )}
                            </div>
                            <div className="admin-prod-sub">
                              Banner: {c.heroTitle || c.name}
                              {c.description ? ` — ${c.description.slice(0, 60)}...` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{c.brand?.name || '—'}</td>
                      <td>
                        <strong>{c.activeProductCount || 0}</strong> active ({c.productCount || 0}{' '}
                        total)
                      </td>
                      <td>
                        <span className={`status-badge ${c.isActive ? 'active' : 'inactive'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            gap: '6px',
                            justifyContent: 'flex-end',
                            flexWrap: 'wrap'
                          }}
                        >
                          {!c.isSub && (
                            <button
                              type="button"
                              className="adm-btn adm-btn-secondary adm-btn-sm"
                              style={{ borderColor: 'var(--gold-deep)', color: 'var(--gold-deep)', fontWeight: 600 }}
                              onClick={() => openAddCategory(c)}
                              title={`Add a new subcategory directly under "${c.name}"`}
                            >
                              + Subcategory
                            </button>
                          )}
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => openEditCategory(c)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => handleToggleCategory(c)}
                          >
                            {c.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-danger adm-btn-sm"
                            onClick={() => setDeleteTarget({ type: 'category', item: c })}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* BRAND ADD/EDIT MODAL */}
      {brandModalOpen && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-dialog" style={{ maxWidth: '640px' }}>
            <h3>{editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Add Partner Brand'}</h3>
            <form onSubmit={handleSaveBrand} style={{ marginTop: '14px' }}>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label htmlFor="bm-name">Brand Name *</label>
                  <input
                    id="bm-name"
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Peters Surgical"
                    required
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="bm-icon">Tab Icon</label>
                  <input
                    id="bm-icon"
                    type="text"
                    value={brandIcon}
                    onChange={(e) => setBrandIcon(e.target.value)}
                    placeholder="🔬"
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="admin-field">
                  <label htmlFor="bm-tab">Tab Label</label>
                  <input
                    id="bm-tab"
                    type="text"
                    value={brandTabLabel}
                    onChange={(e) => setBrandTabLabel(e.target.value)}
                    placeholder="Shown on brand tab button"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="bm-order">Display Order</label>
                  <input
                    id="bm-order"
                    type="number"
                    value={brandOrder}
                    onChange={(e) => setBrandOrder(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="admin-field">
                  <label htmlFor="bm-specialty">
                    Portfolio Specialty / Footer Subtitle
                  </label>
                  <input
                    id="bm-specialty"
                    type="text"
                    value={brandSpecialty}
                    onChange={(e) => setBrandSpecialty(e.target.value)}
                    placeholder="e.g. Sutures & Mesh, Tissue Adhesives, Haemostasis"
                  />
                  <small style={{ fontSize: '0.74rem', color: 'var(--text-mute)', display: 'block', marginTop: '3px' }}>
                    Rendered in global footer: <strong>{brandName || 'Brand'} ({brandSpecialty || 'Specialty'})</strong>
                  </small>
                </div>
                <div className="admin-field" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, marginTop: '16px' }}>
                    <input
                      type="checkbox"
                      checked={brandIsActive}
                      onChange={(e) => setBrandIsActive(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#a9822c', cursor: 'pointer' }}
                    />
                    Active Partner (Shown in Footer &amp; Website)
                  </label>
                  <small style={{ fontSize: '0.74rem', color: 'var(--text-mute)', marginLeft: '26px' }}>
                    Uncheck to hide this partner from the footer and public product directory.
                  </small>
                </div>
              </div>

              <div className="admin-field">
                <label htmlFor="bm-desc">Brand Description</label>
                <textarea
                  id="bm-desc"
                  rows={3}
                  value={brandDescription}
                  onChange={(e) => setBrandDescription(e.target.value)}
                  placeholder="Brief overview of this partner brand..."
                />
              </div>

              {/* DEDICATED BRAND LOGO IMAGE UPLOADER */}
              <div className="admin-field" style={{ marginTop: '14px' }}>
                <label>Brand Logo Image (Manufacturer Logo)</label>
                <div className="admin-brand-logo-control">
                  <div className="admin-brand-logo-preview-box">
                    {brandLogoPreview ? (
                      <img
                        src={brandLogoPreview}
                        alt="Brand logo preview"
                        className="admin-brand-logo-preview-img"
                      />
                    ) : (
                      <div className="admin-brand-logo-empty">
                        <span className="admin-brand-logo-empty-icon">{brandIcon || '🔬'}</span>
                        <span className="admin-brand-logo-empty-text">No logo uploaded</span>
                        <small className="admin-brand-logo-empty-sub">
                          The public website will display a clean fallback badge with "{brandName || 'Brand Name'}"
                        </small>
                      </div>
                    )}
                  </div>

                  <div className="admin-brand-logo-actions-wrap">
                    <div className="admin-brand-logo-btn-row">
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                        style={{ display: 'none' }}
                        onChange={handleLogoFileSelect}
                        id="brand-logo-file-input"
                      />

                      <button
                        type="button"
                        className="adm-btn adm-btn-secondary"
                        disabled={uploadingLogo}
                        onClick={() => logoFileInputRef.current?.click()}
                        id="btn-upload-brand-logo"
                      >
                        {uploadingLogo
                          ? `Uploading ${uploadProgress}%...`
                          : brandLogoPreview
                          ? 'Replace Logo'
                          : 'Upload Logo'}
                      </button>

                      {brandLogoPreview && !uploadingLogo && (
                        <button
                          type="button"
                          className="adm-btn adm-btn-danger"
                          onClick={handleRemoveLogo}
                          id="btn-remove-brand-logo"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>

                    {uploadingLogo && (
                      <div className="admin-brand-upload-progress">
                        <div
                          className="admin-brand-upload-progress-bar"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}

                    {logoFeedback && (
                      <div className={`admin-brand-feedback admin-brand-feedback--${logoFeedback.type}`}>
                        {logoFeedback.text}
                      </div>
                    )}

                    <div className="admin-field-hint">
                      Supported formats: <strong>PNG, JPG, JPEG, WEBP, SVG</strong>. Max size: <strong>5 MB</strong>.<br />
                      Uploaded image is stored securely on Cloudinary and displayed across the website.
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── BRAND SEO & SEARCH VISIBILITY ─── */}
              <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid rgba(169, 130, 44, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.15rem' }}>🌐</span>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--ink)' }}>
                    Brand SEO &amp; Google Preview
                  </h4>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: 'var(--text-mute)' }}>
                  Customize how this manufacturer&apos;s product catalogue appears in Google search results.
                </p>

                {/* Google Snippet Card */}
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #DFE1E5',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  fontFamily: 'arial, sans-serif'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <img src="/favicon.png" alt="" width="16" height="16" style={{ borderRadius: '50%' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', color: '#202124', fontWeight: 500, lineHeight: 1.2 }}>
                        Sriyas Healthcare
                      </span>
                      <span style={{ fontSize: '11px', color: '#4D5156', lineHeight: 1.2 }}>
                        https://sriyashealthcare.com/products/{editingBrand?.slug || (brandName ? brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'brand-slug')}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '16px', color: '#1A0DAB', lineHeight: 1.3, marginBottom: '3px', cursor: 'pointer' }}>
                    {brandSeoTitle || `${brandName || 'Brand'} Surgical & Medical Products | Sriyas Healthcare`}
                  </div>

                  <div style={{ fontSize: '13px', color: '#4D5156', lineHeight: 1.45 }}>
                    {brandSeoDescription || (brandDescription ? `${brandName}: ${brandDescription.slice(0, 130)}... Distributed by Sriyas Healthcare.` : `Explore authorized ${brandName || 'manufacturer'} surgical sutures, devices and hospital supplies from Sriyas Healthcare.`)}
                  </div>
                </div>

                <div className="admin-field" style={{ marginBottom: '12px' }}>
                  <label htmlFor="bm-seo-title">
                    Custom SEO Title (Optional)
                    <span style={{ float: 'right', fontSize: '0.74rem', color: 'var(--text-mute)' }}>
                      {brandSeoTitle.length} chars (40–60 optimal)
                    </span>
                  </label>
                  <input
                    id="bm-seo-title"
                    type="text"
                    value={brandSeoTitle}
                    onChange={(e) => setBrandSeoTitle(e.target.value)}
                    placeholder={`${brandName || 'Brand'} Surgical & Medical Products | Sriyas Healthcare`}
                  />
                </div>

                <div className="admin-field" style={{ marginBottom: '12px' }}>
                  <label htmlFor="bm-seo-desc">
                    Custom Meta Description (Optional)
                    <span style={{ float: 'right', fontSize: '0.74rem', color: 'var(--text-mute)' }}>
                      {brandSeoDescription.length} chars (120–160 optimal)
                    </span>
                  </label>
                  <textarea
                    id="bm-seo-desc"
                    rows={2}
                    value={brandSeoDescription}
                    onChange={(e) => setBrandSeoDescription(e.target.value)}
                    placeholder="Concise summary of this manufacturer portfolio for Google search snippets."
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="bm-logo-alt">
                    Logo Alt Text (Accessibility &amp; SEO)
                  </label>
                  <input
                    id="bm-logo-alt"
                    type="text"
                    value={brandLogoAlt}
                    onChange={(e) => setBrandLogoAlt(e.target.value)}
                    placeholder={`${brandName || 'Manufacturer'} official logo`}
                  />
                </div>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={() => setBrandModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  {editingBrand ? 'Save Brand' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY ADD/EDIT MODAL */}
      {catModalOpen && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-dialog" style={{ maxWidth: '560px' }}>
            <h3>
              {editingCategory
                ? (editingCategory.parentCategory ? `Edit Subcategory: ${editingCategory.name}` : `Edit Category: ${editingCategory.name}`)
                : (catParentId ? 'Add Subcategory' : 'Add Product Category')}
            </h3>
            <form onSubmit={handleSaveCategory} style={{ marginTop: '14px' }}>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label htmlFor="cm-name">
                    {catParentId ? 'Subcategory Name *' : 'Category Name *'}
                  </label>
                  <input
                    id="cm-name"
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder={catParentId ? 'e.g. Absorbable Hemostats or PGA Braided' : 'e.g. Synthetic Absorbable Sutures'}
                    required
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="cm-brand">Assigned Brand *</label>
                  <select
                    id="cm-brand"
                    value={catBrandId}
                    onChange={(e) => {
                      setCatBrandId(e.target.value);
                      setCatParentId('');
                    }}
                    required
                  >
                    <option value="">Select Brand...</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PARENT CATEGORY DROPDOWN */}
              <div className="admin-field" style={{ marginBottom: '14px' }}>
                <label htmlFor="cm-parent">
                  Parent Category (Optional — leave blank for main category)
                </label>
                <select
                  id="cm-parent"
                  value={catParentId}
                  onChange={(e) => {
                    const nextPId = e.target.value;
                    setCatParentId(nextPId);
                    if (nextPId) {
                      const pDoc = categories.find(c => String(c._id) === nextPId);
                      if (pDoc && pDoc.brand) {
                        setCatBrandId(String(pDoc.brand._id || pDoc.brand));
                      }
                    }
                  }}
                >
                  <option value="">-- None (Top-Level Main Category) --</option>
                  {categories
                    .filter((c) => {
                      const isNotSelf = !editingCategory || String(c._id) !== String(editingCategory._id);
                      const isTopLevel = !c.parentCategory;
                      const matchesBrand = !catBrandId || String(c.brand?._id || c.brand) === String(catBrandId);
                      return isNotSelf && isTopLevel && matchesBrand;
                    })
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.brand?.name ? `[${c.brand.name}] ` : ''}{c.name}
                      </option>
                    ))}
                </select>
                <small style={{ fontSize: '0.74rem', color: 'var(--text-mute)', display: 'block', marginTop: '3px' }}>
                  {catParentId ? (
                    <strong style={{ color: 'var(--gold-deep)' }}>
                      ↳ Creating as a nested Subcategory under selected parent category.
                    </strong>
                  ) : (
                    'Leave blank to create a main category under the brand.'
                  )}
                </small>
              </div>

              <div className="admin-form-grid">
                <div className="admin-field">
                  <label htmlFor="cm-hero-title">Banner Heading</label>
                  <input
                    id="cm-hero-title"
                    type="text"
                    value={catHeroTitle}
                    onChange={(e) => setCatHeroTitle(e.target.value)}
                    placeholder="e.g. Synthetic Absorbable Sutures"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="cm-order">Display Order</label>
                  <input
                    id="cm-order"
                    type="number"
                    value={catOrder}
                    onChange={(e) => setCatOrder(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-field">
                <label htmlFor="cm-desc">Banner Subtitle / Description</label>
                <textarea
                  id="cm-desc"
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="High-performance sutures with predictable absorption..."
                />
              </div>

              <div className="admin-form-grid" style={{ marginBottom: '14px' }}>
                <div className="admin-field">
                  <label htmlFor="cm-logo">Category / Sub-Brand Logo File (Optional)</label>
                  <input
                    id="cm-logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => setCatLogoFile(e.target.files?.[0] || null)}
                  />
                  <small style={{ fontSize: '0.74rem', color: 'var(--text-mute)', display: 'block', marginTop: '2px' }}>
                    Optional badge/logo for categories acting as sub-brands (e.g. Dolphin Sutures).
                  </small>
                </div>
                <div className="admin-field">
                  <label htmlFor="cm-logo-url">Or Category Logo URL</label>
                  <input
                    id="cm-logo-url"
                    type="text"
                    value={catLogoUrl}
                    onChange={(e) => setCatLogoUrl(e.target.value)}
                    placeholder="e.g. /images/brands/dolphin-sutures-logo.webp"
                  />
                  {catLogoUrl && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={catLogoUrl}
                        alt="Logo preview"
                        style={{ height: '32px', maxWidth: '80px', objectFit: 'contain', border: '1px solid #ddd', padding: '2px 4px', borderRadius: '4px', background: '#fff' }}
                      />
                      <button
                        type="button"
                        className="adm-btn adm-btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '2px 8px', height: 'auto', minHeight: '26px' }}
                        onClick={() => {
                          setCatLogoUrl('');
                          setCatLogoFile(null);
                        }}
                      >
                        Clear Logo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="admin-field">
                  <label htmlFor="cm-grad">Banner CSS Gradient</label>
                  <input
                    id="cm-grad"
                    type="text"
                    value={catGradient}
                    onChange={(e) => setCatGradient(e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="cm-img">Banner Background Image (Optional)</label>
                  <input
                    id="cm-img"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setCatHeroFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  onClick={() => setCatModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary">
                  {editingCategory ? 'Save Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-dialog">
            <h3>
              Delete {deleteTarget.type === 'brand' ? 'Brand' : 'Category'}: &ldquo;
              {deleteTarget.item.name}&rdquo;?
            </h3>
            <p>
              {deleteTarget.item.productCount > 0
                ? `Note: "${deleteTarget.item.name}" currently has ${deleteTarget.item.productCount} assigned product(s). Deletion is blocked while products are assigned — please deactivate it instead or reassign its products first.`
                : `Are you sure you want to delete "${deleteTarget.item.name}"?`}
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="adm-btn adm-btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="adm-btn adm-btn-danger"
                onClick={handleConfirmDelete}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`admin-toast ${toast.isError ? 'error' : ''}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
}

