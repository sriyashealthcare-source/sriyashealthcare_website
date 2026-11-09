import api from './api';
import { getVisitorSessionId, getVisitorId } from '../utils/session';

export const enquiryService = {
  // Public customer enquiry submission
  async submitEnquiry(formData) {
    const payload = {
      ...formData,
      visitorSessionId: getVisitorSessionId(),
      visitorId: getVisitorId(),
      sourcePage: window.location.pathname
    };
    const response = await api.post('/enquiries', payload);
    return response.data;
  },

  // Protected Admin functions
  async getEnquiries(params = {}) {
    const response = await api.get('/admin/enquiries', { params });
    return response.data;
  },

  async getEnquiryById(id) {
    const response = await api.get(`/admin/enquiries/${id}`);
    return response.data;
  },

  async updateStatus(id, status, priority) {
    const response = await api.patch(`/admin/enquiries/${id}/status`, { status, priority });
    return response.data;
  },

  async addNote(id, note) {
    const response = await api.post(`/admin/enquiries/${id}/notes`, { note });
    return response.data;
  },

  getExportCsvUrl() {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const token = sessionStorage.getItem('sriyas_admin_token') || '';
    return `${baseUrl}/admin/enquiries/export?token=${encodeURIComponent(token)}`;
  }
};

