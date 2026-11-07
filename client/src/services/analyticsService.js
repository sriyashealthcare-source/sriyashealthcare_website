import api from './api';
import { getVisitorSessionId, shouldRecordProductView } from '../utils/session';

export const analyticsService = {
  async trackProductView(productIdOrSlug, source = '') {
    if (!productIdOrSlug) return null;
    if (!shouldRecordProductView(String(productIdOrSlug))) {
      return { deduplicated: true };
    }
    try {
      const visitorSessionId = getVisitorSessionId();
      const response = await api.post('/analytics/product-view', {
        productId: productIdOrSlug,
        visitorSessionId,
        source: source || document.referrer || window.location.pathname
      });
      return response.data;
    } catch (_) {
      return null;
    }
  },

  async getOverview(params = {}) {
    const response = await api.get('/admin/analytics/overview', { params });
    return response.data;
  },

  async getProductsAnalytics(params = {}) {
    const response = await api.get('/admin/analytics/products', { params });
    return response.data;
  },

  async getBrandsAnalytics(params = {}) {
    const response = await api.get('/admin/analytics/brands', { params });
    return response.data;
  },

  async getCategoriesAnalytics(params = {}) {
    const response = await api.get('/admin/analytics/categories', { params });
    return response.data;
  },

  async getTrends(params = {}) {
    const response = await api.get('/admin/analytics/trends', { params });
    return response.data;
  },

  async getRecentViews(params = {}) {
    const response = await api.get('/admin/analytics/recent-views', { params });
    return response.data;
  }
};

