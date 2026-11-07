import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import ProductForm from '../../components/admin/ProductForm';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.title = 'Edit Product | Sriyas Healthcare Admin';
  }, []);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await productService.getAdminProductById(id);
        setProduct(res.product || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load product for editing.');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      setSubmitting(true);
      const res = await productService.updateProduct(id, formData);
      setToast({
        message: res.message || 'Product updated successfully!',
        isError: false
      });
      setTimeout(() => {
        navigate('/admin/products');
      }, 900);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to update product.',
        isError: true
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="state-container">
        <div className="spinner" />
        <div className="state-title">Loading Product Information...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="state-container">
        <div className="state-title">Product Not Found</div>
        <p className="state-desc">{error || 'Unable to locate this product.'}</p>
        <Link to="/admin/products" className="adm-btn adm-btn-primary">
          Return to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div className="admin-page-header">
        <div>
          <h1>Edit Product: {product.name}</h1>
          <p>
            Modify product specifications, images, gallery, or brochure. Changes appear
            dynamically on the customer website.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {product.slug && (
            <a
              href={`/products/${product.slug}`}
              target="_blank"
              rel="noreferrer"
              className="adm-btn adm-btn-secondary"
            >
              View Live Page ↗
            </a>
          )}
          <Link to="/admin/products" className="adm-btn adm-btn-secondary">
            ← Back to Products
          </Link>
        </div>
      </div>

      <ProductForm
        initialData={product}
        onSubmit={handleUpdate}
        submitting={submitting}
        onCancel={() => navigate('/admin/products')}
      />

      {toast && (
        <div className={`admin-toast ${toast.isError ? 'error' : ''}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
}

