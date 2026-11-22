const express = require('express');
const { protectAdmin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const {
  getPublicContactInfo,
  getAdminContactInfo,
  updateAdminContactInfo,
  uploadContactImage
} = require('../controllers/contactController');

const publicContactRouter = express.Router();
const adminContactRouter = express.Router();

// Public Route — Active corporate contact information only
publicContactRouter.get('/', getPublicContactInfo);

// Protected Administrator Routes — Manage corporate contact information
adminContactRouter.use(protectAdmin);
adminContactRouter.get('/', getAdminContactInfo);
adminContactRouter.put('/', updateAdminContactInfo);
adminContactRouter.post('/upload-image', upload.single('image'), uploadContactImage);

module.exports = {
  publicContactRouter,
  adminContactRouter
};
