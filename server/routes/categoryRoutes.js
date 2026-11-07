const express = require('express');
const {
  getPublicCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory
} = require('../controllers/categoryController');
const { protectAdmin } = require('../middleware/authMiddleware');
const { uploadCategoryHero } = require('../middleware/uploadMiddleware');
const { validateCategoryInput } = require('../middleware/validationMiddleware');

const publicCategoryRouter = express.Router();
publicCategoryRouter.get('/', getPublicCategories);

const adminCategoryRouter = express.Router();
adminCategoryRouter.use(protectAdmin);
adminCategoryRouter.get('/', getAdminCategories);
adminCategoryRouter.post('/', uploadCategoryHero, validateCategoryInput, createCategory);
adminCategoryRouter.put('/:id', uploadCategoryHero, validateCategoryInput, updateCategory);
adminCategoryRouter.patch('/:id/status', toggleCategoryStatus);
adminCategoryRouter.delete('/:id', deleteCategory);

module.exports = {
  publicCategoryRouter,
  adminCategoryRouter
};

