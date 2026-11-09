const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const { uploadBuffer, deleteAsset, CLOUDINARY_FOLDERS } = require('../config/cloudinary');

function makeSlug(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/categories (Public)
const getPublicCategories = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.brand) {
      const bDoc = await Brand.findOne({
        $or: [{ _id: req.query.brand }, { slug: String(req.query.brand).toLowerCase() }]
      });
      if (bDoc) {
        filter.brand = bDoc._id;
      }
    }
    const categories = await Category.find(filter)
      .populate('brand', 'name slug tabLabel icon isActive')
      .sort({ displayOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/categories (Admin)
const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({})
      .populate('brand', 'name slug tabLabel icon isActive')
      .sort({ displayOrder: 1, name: 1 });

    const allProducts = await Product.find({ deletedAt: null });

    const enriched = categories.map(c => {
      const cObj = typeof c.toObject === 'function' ? c.toObject() : { ...c };
      const cId = String(cObj._id);
      cObj.productCount = allProducts.filter(p => String(p.category) === cId).length;
      cObj.activeProductCount = allProducts.filter(p => String(p.category) === cId && p.isActive).length;
      return cObj;
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      categories: enriched
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/categories
const createCategory = async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    let brandId = req.body.brand || null;
    let brandSlug = '';

    if (brandId) {
      const brandDoc = await Brand.findOne({
        $or: [{ _id: brandId }, { slug: String(brandId).toLowerCase() }]
      });
      if (brandDoc) {
        brandId = brandDoc._id;
        brandSlug = brandDoc.slug;
      }
    }

    const baseSlug = req.body.slug
      ? makeSlug(req.body.slug)
      : makeSlug(brandSlug ? `${brandSlug}-${name}` : name);

    let slug = baseSlug;
    const existing = await Category.findOne({ slug });
    if (existing) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const heroTitle = (req.body.heroTitle || name).trim();
    const description = (req.body.description || '').trim();
    const heroGradient = (req.body.heroGradient || 'linear-gradient(135deg,#1a3a5c,#2d6b9e)').trim();
    const isActive = req.body.isActive !== undefined ? String(req.body.isActive) !== 'false' : true;

    let heroImage = {
      url: (req.body.heroImageUrl || '').trim(),
      publicId: ''
    };

    if (req.file && req.file.buffer) {
      const uploaded = await uploadBuffer(req.file.buffer, req.file.originalname, CLOUDINARY_FOLDERS.categories, 'image');
      heroImage = {
        url: uploaded.url,
        publicId: uploaded.publicId,
        format: uploaded.format,
        width: uploaded.width,
        height: uploaded.height
      };
    }

    const totalCats = await Category.countDocuments({});
    const displayOrder = req.body.displayOrder !== undefined ? Number(req.body.displayOrder) : totalCats + 1;

    const created = await Category.create({
      name,
      slug,
      brand: brandId,
      heroTitle,
      description,
      heroGradient,
      heroImage,
      displayOrder,
      isActive
    });

    const populated = await Category.findById(created._id).populate('brand', 'name slug tabLabel icon isActive');

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category: populated
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    const name = req.body.name !== undefined ? req.body.name.trim() : category.name;
    let brandId = req.body.brand !== undefined ? req.body.brand : category.brand;
    if (brandId) {
      const brandDoc = await Brand.findOne({
        $or: [{ _id: brandId }, { slug: String(brandId).toLowerCase() }]
      });
      if (brandDoc) brandId = brandDoc._id;
    }

    const heroTitle = req.body.heroTitle !== undefined ? req.body.heroTitle.trim() : category.heroTitle;
    const description = req.body.description !== undefined ? req.body.description.trim() : category.description;
    const heroGradient = req.body.heroGradient !== undefined ? req.body.heroGradient.trim() : category.heroGradient;
    const displayOrder = req.body.displayOrder !== undefined ? Number(req.body.displayOrder) : category.displayOrder;
    const isActive = req.body.isActive !== undefined
      ? (typeof req.body.isActive === 'boolean' ? req.body.isActive : String(req.body.isActive) === 'true')
      : category.isActive;

    let heroImage = category.heroImage || { url: '', publicId: '', format: 'webp', width: 0, height: 0 };
    if (req.file && req.file.buffer) {
      if (heroImage.publicId) {
        await deleteAsset(heroImage.publicId, 'image', true);
      }
      const uploaded = await uploadBuffer(req.file.buffer, req.file.originalname, CLOUDINARY_FOLDERS.categories, 'image');
      heroImage = {
        url: uploaded.url,
        publicId: uploaded.publicId,
        format: uploaded.format,
        width: uploaded.width,
        height: uploaded.height
      };
    } else if (req.body.heroImageUrl !== undefined) {
      heroImage = {
        url: req.body.heroImageUrl.trim(),
        publicId: heroImage.publicId || '',
        format: heroImage.format || 'webp',
        width: heroImage.width || 0,
        height: heroImage.height || 0
      };
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          brand: brandId,
          heroTitle,
          description,
          heroGradient,
          heroImage,
          displayOrder,
          isActive
        }
      },
      { new: true }
    ).populate('brand', 'name slug tabLabel icon isActive');

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      category: updated
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/categories/:id/status
const toggleCategoryStatus = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    const nextStatus = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !category.isActive;
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: nextStatus } },
      { new: true }
    ).populate('brand', 'name slug tabLabel icon isActive');

    res.status(200).json({
      success: true,
      message: `Category "${updated.name}" is now ${updated.isActive ? 'Active' : 'Inactive'}.`,
      category: updated
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    const assignedProductsCount = await Product.countDocuments({
      category: category._id,
      deletedAt: null
    });

    if (assignedProductsCount > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete "${category.name}" because ${assignedProductsCount} active/existing product(s) belong to this category. Deactivate the category instead or reassign its products first.`
      });
    }

    if (category.heroImage && category.heroImage.publicId) {
      await deleteAsset(category.heroImage.publicId, 'image');
    }

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: `Category "${category.name}" deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory
};

