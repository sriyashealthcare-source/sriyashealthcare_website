import api from './api';

let publicContactCache = null;
let publicContactPromise = null;

export const contactService = {
  /**
   * Fetch active, public corporate contact information for visitors.
   * Cached in memory with request deduplication to prevent repeated calls across components.
   */
  async getPublicContactInfo({ force = false } = {}) {
    if (!force && publicContactCache) {
      return publicContactCache;
    }
    if (!force && publicContactPromise) {
      return publicContactPromise;
    }

    publicContactPromise = api
      .get('/contact-information')
      .then((res) => {
        publicContactCache = res.data?.contact || null;
        publicContactPromise = null;
        return publicContactCache;
      })
      .catch((err) => {
        publicContactPromise = null;
        throw err;
      });

    return publicContactPromise;
  },

  clearCache() {
    publicContactCache = null;
    publicContactPromise = null;
  },

  /**
   * Fetch full contact document for the Administrator Dashboard.
   */
  async getAdminContactInfo() {
    const response = await api.get('/admin/contact-information');
    return response.data;
  },

  /**
   * Save updated contact information from Administrator Dashboard.
   * Automatically clears public cache so website updates immediately.
   */
  async updateContactInfo(payload) {
    const response = await api.put('/admin/contact-information', payload);
    contactService.clearCache();
    return response.data;
  },

  /**
   * Upload an office photograph to Cloudinary.
   */
  async uploadContactImage(file, alt = '') {
    const formData = new FormData();
    formData.append('image', file);
    if (alt) {
      formData.append('alt', alt);
    }
    const response = await api.post('/admin/contact-information/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
