import api from './api';
import { getVisitorSessionId, getVisitorId, shouldRecordProductView, trackAnalyticsEvent } from '../utils/session';

export const analyticsService = {
  async trackProductView(productIdOrSlug, source = '') {
    if (!productIdOrSlug) return null;
    if (!shouldRecordProductView(String(productIdOrSlug))) {
      return { deduplicated: true };
    }
    try {
      const visitorSessionId = getVisitorSessionId();
      const visitorId = getVisitorId();
      const response = await api.post('/analytics/event', {
        eventType: 'product_view',
        productId: productIdOrSlug,
        visitorId,
        sessionId: visitorSessionId,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        metadata: { source: source || document.referrer || 'direct' }
      });
      return response.data;
    } catch (_) {
      return null;
    }
  },

  async trackBrochureDownload(productId, productName) {
    return trackAnalyticsEvent('brochure_download', {
      productId,
      productNameSnapshot: productName
    });
  },

  async getOverview(params = {}) {
    const response = await api.get('/admin/analytics/overview', { params });
    return response.data;
  },

  async getVisitors(params = {}) {
    const response = await api.get('/admin/analytics/visitors', { params });
    return response.data;
  },

  async getJourneys(params = {}) {
    const response = await api.get('/admin/analytics/journeys', { params });
    return response.data;
  },

  async getTrafficSources(params = {}) {
    const response = await api.get('/admin/analytics/traffic-sources', { params });
    return response.data;
  },

  async getDeviceAnalytics(params = {}) {
    const response = await api.get('/admin/analytics/devices', { params });
    return response.data;
  },

  async getReports(params = {}) {
    const response = await api.get('/admin/analytics/reports', { params });
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
