const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Product = require('../models/Product');

function makeSlug(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/brands (Public)
const getPublicBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
    res.status(200).json({
      success: true,
      count: brands.length,
      brands
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/brands (Admin)
const getAdminBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({}).sort({ displayOrder: 1, name: 1 });
    const allProducts = await Product.find({ deletedAt: null });
    const allCategories = await Category.find({});

    const enriched = brands.map(b => {
      const bObj = typeof b.toObject === 'function' ? b.toObject() : { ...b };
      const bId = String(bObj._id);
      bObj.productCount = allProducts.filter(p => String(p.brand) === bId).length;
      bObj.activeProductCount = allProducts.filter(p => String(p.brand) === bId && p.isActive).length;
      bObj.categoryCount = allCategories.filter(c => String(c.brand) === bId).length;
      return bObj;
    });

    res.status(200).json({
      success: true,
      count: enriched.length,
      brands: enriched
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/brands
const createBrand = async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    const slug = (req.body.slug || makeSlug(name)).trim().toLowerCase();
    const tabLabel = (req.body.tabLabel || name).trim();
    const icon = (req.body.icon || '🔬').trim();
    const description = (req.body.description || '').trim();
    const logoUrl = (req.body.logoUrl || '').trim();
    const isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : true;

    const existing = await Brand.findOne({ $or: [{ slug }, { name }] });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A brand with that name or slug already exists.'
      });
    }

    const totalBrands = await Brand.countDocuments({});
    const displayOrder = req.body.displayOrder !== undefined ? Number(req.body.displayOrder) : totalBrands + 1;

    const brand = await Brand.create({
      name,
      slug,
      tabLabel,
      icon,
      description,
      logoUrl,
      displayOrder,
      isActive
    });

    res.status(201).json({
      success: true,
      message: 'Brand created successfully.',
      brand
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/brands/:id
const updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found.'
      });
    }

    const name = req.body.name !== undefined ? req.body.name.trim() : brand.name;
    const slug = req.body.slug !== undefined ? req.body.slug.trim().toLowerCase() : brand.slug;
    const tabLabel = req.body.tabLabel !== undefined ? req.body.tabLabel.trim() : brand.tabLabel;
    const icon = req.body.icon !== undefined ? req.body.icon.trim() : brand.icon;
    const description = req.body.description !== undefined ? req.body.description.trim() : brand.description;
    const logoUrl = req.body.logoUrl !== undefined ? req.body.logoUrl.trim() : brand.logoUrl;
    const displayOrder = req.body.displayOrder !== undefined ? Number(req.body.displayOrder) : brand.displayOrder;
    const isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : brand.isActive;

    const updated = await Brand.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          slug,
          tabLabel,
          icon,
          description,
          logoUrl,
          displayOrder,
          isActive
        }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Brand updated successfully.',
      brand: updated
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/brands/:id/status
const toggleBrandStatus = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found.'
      });
    }

    const nextStatus = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !brand.isActive;
    const updated = await Brand.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: nextStatus } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Brand "${updated.name}" is now ${updated.isActive ? 'Active' : 'Inactive'}.`,
      brand: updated
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/brands/:id
const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found.'
      });
    }

    const assignedProductsCount = await Product.countDocuments({
      brand: brand._id,
      deletedAt: null
    });

    if (assignedProductsCount > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete "${brand.name}" because ${assignedProductsCount} active/existing product(s) are assigned to it. Deactivate the brand instead or reassign its products first.`
      });
    }

    await Brand.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: `Brand "${brand.name}" deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicBrands,
  getAdminBrands,
  createBrand,
  updateBrand,
  toggleBrandStatus,
  deleteBrand
};

