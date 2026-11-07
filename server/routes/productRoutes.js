const express = require('express');
const {
  getPublicProducts,
  getPublicProductBySlug,
  getPublicProductById,
  getPublicProductsByBrand,
  getPublicProductsByCategory,
  getAdminProducts,
  getAdminProductById,
  createProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct
} = require('../controllers/productController');
const { protectAdmin } = require('../middleware/authMiddleware');
const { uploadProductFiles } = require('../middleware/uploadMiddleware');
const { validateProductInput } = require('../middleware/validationMiddleware');

const publicProductRouter = express.Router();
publicProductRouter.get('/', getPublicProducts);
publicProductRouter.get('/slug/:slug', getPublicProductBySlug);
publicProductRouter.get('/brand/:brand', getPublicProductsByBrand);
publicProductRouter.get('/category/:category', getPublicProductsByCategory);
publicProductRouter.get('/:id', getPublicProductById);

const adminProductRouter = express.Router();
adminProductRouter.use(protectAdmin);
adminProductRouter.get('/', getAdminProducts);
adminProductRouter.get('/:id', getAdminProductById);
adminProductRouter.post('/', uploadProductFiles, validateProductInput, createProduct);
adminProductRouter.put('/:id', uploadProductFiles, updateProduct);
adminProductRouter.patch('/:id/status', toggleProductStatus);
adminProductRouter.delete('/:id', deleteProduct);

module.exports = {
  publicProductRouter,
  adminProductRouter
};

