const express = require('express');
const { protectAdmin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const {
  getPublicHomepage,
  getAdminHomepage,
  getAdminHomepagePreview,
  saveHomepageDraft,
  publishHomepage,
  discardHomepageDraft,
  uploadHomepageImage,
  getHomepageMediaLibrary
} = require('../controllers/homepageController');

const publicHomepageRouter = express.Router();
const adminHomepageRouter = express.Router();

// Public Route — Published homepage only
publicHomepageRouter.get('/', getPublicHomepage);

// Admin Protected Routes — Website Management -> Homepage Editor
adminHomepageRouter.use(protectAdmin);
adminHomepageRouter.get('/', getAdminHomepage);
adminHomepageRouter.get('/preview', getAdminHomepagePreview);
adminHomepageRouter.get('/media-library', getHomepageMediaLibrary);
adminHomepageRouter.put('/draft', saveHomepageDraft);
adminHomepageRouter.post('/publish', publishHomepage);
adminHomepageRouter.post('/discard', discardHomepageDraft);
adminHomepageRouter.post('/upload-image', upload.single('image'), uploadHomepageImage);

module.exports = {
  publicHomepageRouter,
  adminHomepageRouter
};
