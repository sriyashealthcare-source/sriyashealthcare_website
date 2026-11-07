import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { resolveAssetUrl } from '../../utils/session';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('order');

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    document.title = 'Manage Products | Sriyas Healthcare Admin';
  }, []);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3800);
  };

  useEffect(() => {
    async function loadMeta() {
      try {
        const [bRes, cRes] = await Promise.all([
          productService.getAdminBrands(),
          productService.getAdminCategories()
        ]);
        setBrands(bRes.brands || []);
        setCategories(cRes.categories || []);
      } catch (err) {
        console.error('Error loading brands/categories:', err);
      }
    }
    loadMeta();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productService.getAdminProducts({
        search: search.trim(),
        brand: selectedBrand,
        category: selectedCategory,
        status: statusFilter,
        sort: sortBy,
        limit: 100
      });
      setProducts(res.products || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load products.', true);
    } finally {
      setLoading(false);
    }
  }, [search, selectedBrand, selectedCategory, statusFilter, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleStatus = async (product) => {
    try {
      const payload = product.deletedAt
        ? { restore: true }
        : { isActive: !product.isActive };
      const res = await productService.toggleProductStatus(product._id, payload);
      showToast(res.message || 'Product status updated.');
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update status.', true);
    }
  };

  const handleConfirmArchive = async () => {
    if (!confirmTarget) return;
    try {
      const res = await productService.deleteProduct(
        confirmTarget.product._id,
        confirmTarget.permanent
      );
      showToast(res.message || 'Product archived.');
      setConfirmTarget(null);
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed.', true);
    }
  };

  const filteredCategoryOptions = selectedBrand
    ? categories.filter(c => String(c.brand?._id || c.brand) === String(selectedBrand))
    : categories;

  return (
    <div className="fade-in-up">
      <div className="admin-page-header">
        <div>
          <h1>Product Catalogue Management</h1>
          <p>
            Add, edit, activate, or archive surgical and medical products. Changes reflect
            immediately on the public website.
          </p>
        </div>
        <Link to="/admin/products/add" className="adm-btn adm-btn-primary">
          + Add New Product
        </Link>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="admin-card">
        <div className="admin-filters-row" style={{ marginBottom: 0 }}>
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search by product name, specification, brand, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />

          <select
            className="admin-select"
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              setSelectedCategory('');
            }}
            aria-label="Filter by brand"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {filteredCategoryOptions.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All Non-Archived</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="archived">Archived</option>
          </select>

          <select
            className="admin-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort products"
          >
            <option value="order">Sort: Display Order</option>
            <option value="newest">Sort: Newest First</option>
            <option value="most-viewed">Sort: Most Viewed</option>
            <option value="alphabetical">Sort: Alphabetical (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            Catalogue Items ({products.length})
          </h2>
        </div>

        {loading ? (
          <div className="state-container">
            <div className="spinner" />
            <div className="state-title">Loading Products...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="state-container">
            <div className="state-title">No Products Found</div>
            <p className="state-desc">
              No products matched your current filter settings.
            </p>
            <button
              type="button"
              className="adm-btn adm-btn-secondary"
              onClick={() => {
                setSearch('');
                setSelectedBrand('');
                setSelectedCategory('');
                setStatusFilter('all');
                setSortBy('order');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Gallery / PDF</th>
                  <th>Views</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const primaryImg =
                    (p.images || []).find(i => i.isPrimary) || (p.images || [])[0];
                  const thumbUrl = primaryImg ? resolveAssetUrl(primaryImg.url) : '';
                  const isArchived = Boolean(p.deletedAt);

                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="admin-prod-cell">
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={p.name}
                              className="admin-prod-thumb"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="admin-prod-thumb"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                color: 'var(--text-mute)'
                              }}
                            >
                              N/A
                            </div>
                          )}
                          <div>
                            <div className="admin-prod-name">{p.name}</div>
                            <div className="admin-prod-sub">
                              {p.cardCategory || p.shortSpecification?.slice(0, 48)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>{p.brand?.name || '—'}</td>

                      <td>{p.category?.name || p.cardCategory || '—'}</td>

                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-mute)' }}>
                          {(p.images || []).length} img
                          {p.brochure?.url ? ' · 📄 PDF' : ''}
                        </span>
                      </td>

                      <td style={{ fontWeight: 600 }}>{p.viewCount || 0}</td>

                      <td>
                        {isArchived ? (
                          <span className="status-badge archived">Archived</span>
                        ) : p.isActive ? (
                          <span className="status-badge active">Active</span>
                        ) : (
                          <span className="status-badge inactive">Inactive</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            gap: '6px',
                            alignItems: 'center',
                            justifyContent: 'flex-end'
                          }}
                        >
                          <Link
                            to={`/admin/products/edit/${p._id}`}
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            className="adm-btn adm-btn-secondary adm-btn-sm"
                            onClick={() => handleToggleStatus(p)}
                          >
                            {isArchived
                              ? 'Restore'
                              : p.isActive
                              ? 'Disable'
                              : 'Enable'}
                          </button>

                          {!isArchived ? (
                            <button
                              type="button"
                              className="adm-btn adm-btn-danger adm-btn-sm"
                              onClick={() =>
                                setConfirmTarget({ product: p, permanent: false })
                              }
                            >
                              Archive
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="adm-btn adm-btn-danger adm-btn-sm"
                              onClick={() =>
                                setConfirmTarget({ product: p, permanent: true })
                              }
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmTarget && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div className="admin-modal-dialog">
            <h3 id="confirm-modal-title">
              {confirmTarget.permanent ? 'Permanently Delete Product?' : 'Archive Product?'}
            </h3>
            <p>
              {confirmTarget.permanent
                ? `Are you sure you want to permanently remove "${confirmTarget.product.name}"? Historical view analytics will still be preserved.`
                : `Archiving "${confirmTarget.product.name}" will hide it from the public customer website while preserving all product details and view analytics. You can restore it anytime.`}
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="adm-btn adm-btn-secondary"
                onClick={() => setConfirmTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="adm-btn adm-btn-danger"
                onClick={handleConfirmArchive}
              >
                {confirmTarget.permanent ? 'Permanently Delete' : 'Archive Product'}
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

