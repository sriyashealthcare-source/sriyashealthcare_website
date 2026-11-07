import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import ProductForm from '../../components/admin/ProductForm';

export default function AddProduct() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.title = 'Add New Product | Sriyas Healthcare Admin';
  }, []);

  const handleCreate = async (formData) => {
    try {
      setSubmitting(true);
      const res = await productService.createProduct(formData);
      setToast({
        message: res.message || 'Product created successfully!',
        isError: false
      });
      setTimeout(() => {
        navigate('/admin/products');
      }, 900);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to create product.',
        isError: true
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in-up">
      <div className="admin-page-header">
        <div>
          <h1>Add New Product</h1>
          <p>
            Create a new surgical or medical product. Active products appear immediately on the
            customer website under their assigned Brand and Category.
          </p>
        </div>
        <Link to="/admin/products" className="adm-btn adm-btn-secondary">
          ← Back to Products
        </Link>
      </div>

      <ProductForm
        onSubmit={handleCreate}
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

