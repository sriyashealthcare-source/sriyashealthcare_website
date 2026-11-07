import api from './api';

export const productService = {
  // Public Endpoints
  async getPublicProducts(params = {}) {
    const response = await api.get('/products', { params });
    return response.data;
  },

  async getPublicProductBySlug(slug) {
    const response = await api.get(`/products/slug/${encodeURIComponent(slug)}`);
    return response.data;
  },

  async getPublicProductById(id) {
    const response = await api.get(`/products/${encodeURIComponent(id)}`);
    return response.data;
  },

  async getPublicBrands() {
    const response = await api.get('/brands');
    return response.data;
  },

  async getPublicCategories(params = {}) {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  // Admin Product Endpoints
  async getAdminProducts(params = {}) {
    const response = await api.get('/admin/products', { params });
    return response.data;
  },

  async getAdminProductById(id) {
    const response = await api.get(`/admin/products/${encodeURIComponent(id)}`);
    return response.data;
  },

  async createProduct(formData) {
    const response = await api.post('/admin/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async updateProduct(id, formData) {
    const response = await api.put(`/admin/products/${encodeURIComponent(id)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async toggleProductStatus(id, payload = {}) {
    const response = await api.patch(`/admin/products/${encodeURIComponent(id)}/status`, payload);
    return response.data;
  },

  async deleteProduct(id, permanent = false) {
    const response = await api.delete(`/admin/products/${encodeURIComponent(id)}`, {
      params: permanent ? { permanent: 'true' } : {}
    });
    return response.data;
  },

  // Admin Brand Endpoints
  async getAdminBrands() {
    const response = await api.get('/admin/brands');
    return response.data;
  },

  async createBrand(payload) {
    const response = await api.post('/admin/brands', payload);
    return response.data;
  },

  async updateBrand(id, payload) {
    const response = await api.put(`/admin/brands/${encodeURIComponent(id)}`, payload);
    return response.data;
  },

  async toggleBrandStatus(id, isActive) {
    const response = await api.patch(`/admin/brands/${encodeURIComponent(id)}/status`, { isActive });
    return response.data;
  },

  async deleteBrand(id) {
    const response = await api.delete(`/admin/brands/${encodeURIComponent(id)}`);
    return response.data;
  },

  // Admin Category Endpoints
  async getAdminCategories() {
    const response = await api.get('/admin/categories');
    return response.data;
  },

  async createCategory(payloadOrFormData) {
    const isFormData = payloadOrFormData instanceof FormData;
    const response = await api.post(
      '/admin/categories',
      payloadOrFormData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    );
    return response.data;
  },

  async updateCategory(id, payloadOrFormData) {
    const isFormData = payloadOrFormData instanceof FormData;
    const response = await api.put(
      `/admin/categories/${encodeURIComponent(id)}`,
      payloadOrFormData,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}
    );
    return response.data;
  },

  async toggleCategoryStatus(id, isActive) {
    const response = await api.patch(`/admin/categories/${encodeURIComponent(id)}/status`, { isActive });
    return response.data;
  },

  async deleteCategory(id) {
    const response = await api.delete(`/admin/categories/${encodeURIComponent(id)}`);
    return response.data;
  }
};

