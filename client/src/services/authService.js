import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.token) {
      try {
        sessionStorage.setItem('sriyas_admin_token', response.data.token);
      } catch (_) {}
    }
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      try {
        sessionStorage.removeItem('sriyas_admin_token');
      } catch (_) {}
    }
  },

  async getCurrentAdmin() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updateProfile(payload) {
    const response = await api.put('/auth/profile', payload);
    return response.data;
  },

  async updatePassword(payload) {
    const response = await api.put('/auth/password', payload);
    return response.data;
  },

  async getHealthStatus() {
    const response = await api.get('/health');
    return response.data;
  }
};

