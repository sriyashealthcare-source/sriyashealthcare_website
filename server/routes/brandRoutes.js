const express = require('express');
const {
  getPublicBrands,
  getPublicBrandBySlug,
  getAdminBrands,
  createBrand,
  updateBrand,
  toggleBrandStatus,
  deleteBrand
} = require('../controllers/brandController');
const { protectAdmin } = require('../middleware/authMiddleware');
const { uploadBrandLogo } = require('../middleware/uploadMiddleware');
const { validateBrandInput } = require('../middleware/validationMiddleware');

const publicBrandRouter = express.Router();
publicBrandRouter.get('/', getPublicBrands);
publicBrandRouter.get('/:slug', getPublicBrandBySlug);

const adminBrandRouter = express.Router();
adminBrandRouter.use(protectAdmin);
adminBrandRouter.get('/', getAdminBrands);
adminBrandRouter.post('/', uploadBrandLogo, validateBrandInput, createBrand);
adminBrandRouter.put('/:id', uploadBrandLogo, validateBrandInput, updateBrand);
adminBrandRouter.patch('/:id/status', toggleBrandStatus);
adminBrandRouter.delete('/:id', deleteBrand);

module.exports = {
  publicBrandRouter,
  adminBrandRouter
};

