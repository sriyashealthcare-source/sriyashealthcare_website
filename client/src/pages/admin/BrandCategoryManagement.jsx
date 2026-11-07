import React, { useState, useEffect, useCallback } from 'react';
import { productService } from '../../services/productService';

export default function BrandCategoryManagement() {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Brand Modal / Form state
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandName, setBrandName] = useState('');
  const [brandTabLabel, setBrandTabLabel] = useState('');
  const [brandIcon, setBrandIcon] = useState('🔬');
  const [brandDescription, setBrandDescription] = useState('');
  const [brandOrder, setBrandOrder] = useState('');

  // Category Modal / Form state
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catBrandId, setCatBrandId] = useState('');
  const [catHeroTitle, setCatHeroTitle] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catGradient, setCatGradient] = useState('linear-gradient(135deg,#1a3a5c,#2d6b9e)');
  const [catHeroFile, setCatHeroFile] = useState(null);
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
    setBrandTabLabel('');
    setBrandIcon('🔬');
    setBrandDescription('');
    setBrandOrder(String(brands.length + 1));
    setBrandModalOpen(true);
  };

  const openEditBrand = (b) => {
    setEditingBrand(b);
    setBrandName(b.name || '');
    setBrandTabLabel(b.tabLabel || b.name || '');
    setBrandIcon(b.icon || '🔬');
    setBrandDescription(b.description || '');
    setBrandOrder(b.displayOrder !== undefined ? String(b.displayOrder) : '');
    setBrandModalOpen(true);
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: brandName.trim(),
        tabLabel: (brandTabLabel || brandName).trim(),
        icon: brandIcon.trim() || '🔬',
        description: brandDescription.trim(),
        displayOrder: brandOrder !== '' ? Number(brandOrder) : undefined
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
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not save brand.', true);
    }
  };

  const handleToggleBrand = async (b) => {
    try {
      const res = await productService.toggleBrandStatus(b._id, !b.isActive);
      showToast(res.message || 'Brand status updated.');
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update brand status.', true);
    }
  };

  // Category Handlers
  const openAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatBrandId(brands[0]?._id || '');
    setCatHeroTitle('');
    setCatDescription('');
    setCatGradient('linear-gradient(135deg,#1a3a5c,#2d6b9e)');
    setCatHeroFile(null);
    setCatOrder(String(categories.length + 1));
    setCatModalOpen(true);
  };

  const openEditCategory = (c) => {
    setEditingCategory(c);
    setCatName(c.name || '');
    setCatBrandId(String(c.brand?._id || c.brand || ''));
    setCatHeroTitle(c.heroTitle || c.name || '');
    setCatDescription(c.description || '');
    setCatGradient(c.heroGradient || 'linear-gradient(135deg,#1a3a5c,#2d6b9e)');
    setCatHeroFile(null);
    setCatOrder(c.displayOrder !== undefined ? String(c.displayOrder) : '');
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', catName.trim());
      formData.append('brand', catBrandId);
      formData.append('heroTitle', (catHeroTitle || catName).trim());
      formData.append('description', catDescription.trim());
      formData.append('heroGradient', catGradient.trim());
      if (catOrder !== '') {
        formData.append('displayOrder', String(catOrder));
      }
      if (catHeroFile) {
        formData.append('heroImage', catHeroFile);
      }

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

  const visibleCategories = catBrandFilter
    ? categories.filter(c => String(c.brand?._id || c.brand) === String(catBrandFilter))
    : categories;

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
                        <div className="admin-prod-name">
                          {b.icon} {b.name}
                        </div>
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
                Product Categories ({visibleCategories.length})
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
                  onClick={openAddCategory}
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
                    <th>Category Name &amp; Banner</th>
                    <th>Brand</th>
                    <th>Products</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCategories.map((c) => (
                    <tr key={c._id}>
                      <td>{c.displayOrder}</td>
                      <td>
                        <div className="admin-prod-name">{c.name}</div>
                        <div className="admin-prod-sub">
                          Banner: {c.heroTitle || c.name}
                          {c.description ? ` — ${c.description.slice(0, 60)}...` : ''}
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
                            justifyContent: 'flex-end'
                          }}
                        >
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
          <div className="admin-modal-dialog" style={{ maxWidth: '520px' }}>
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
              {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add Product Category'}
            </h3>
            <form onSubmit={handleSaveCategory} style={{ marginTop: '14px' }}>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label htmlFor="cm-name">Category Label *</label>
                  <input
                    id="cm-name"
                    type="text"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Synthetic Absorbable Sutures"
                    required
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="cm-brand">Assigned Brand *</label>
                  <select
                    id="cm-brand"
                    value={catBrandId}
                    onChange={(e) => setCatBrandId(e.target.value)}
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

