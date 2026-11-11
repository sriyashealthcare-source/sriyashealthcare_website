import api from './api';

let publicHomepageCache = null;
let publicHomepagePromise = null;

export const homepageService = {
  /**
   * Fetch ONLY published homepage content for customers.
   * Uses short-lived in-memory deduplication so back-navigation is instant,
   * while allowing forced refresh when needed.
   */
  async getPublicHomepage({ force = false } = {}) {
    if (!force && publicHomepageCache) {
      return publicHomepageCache;
    }
    if (!force && publicHomepagePromise) {
      return publicHomepagePromise;
    }

    publicHomepagePromise = api
      .get('/homepage')
      .then((res) => {
        publicHomepageCache = res.data;
        publicHomepagePromise = null;
        return res.data;
      })
      .catch((err) => {
        publicHomepagePromise = null;
        throw err;
      });

    return publicHomepagePromise;
  },

  clearPublicCache() {
    publicHomepageCache = null;
    publicHomepagePromise = null;
  },

  // Admin Homepage Editor Endpoints
  async getAdminHomepage() {
    const response = await api.get('/admin/homepage');
    return response.data;
  },

  async getAdminPreview() {
    const response = await api.get('/admin/homepage/preview');
    return response.data;
  },

  async saveDraft(draft) {
    const response = await api.put('/admin/homepage/draft', { draft });
    return response.data;
  },

  async publishHomepage(draft = null) {
    const payload = draft ? { draft } : {};
    const response = await api.post('/admin/homepage/publish', payload);
    this.clearPublicCache();
    return response.data;
  },

  async discardDraft() {
    const response = await api.post('/admin/homepage/discard');
    return response.data;
  },

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/admin/homepage/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default homepageService;

