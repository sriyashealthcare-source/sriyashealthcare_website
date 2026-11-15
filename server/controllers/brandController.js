const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { uploadBuffer, deleteAsset, CLOUDINARY_FOLDERS } = require('../config/cloudinary');
const { isSafeSvg } = require('../middleware/uploadMiddleware');

function isObjectId(val) {
  return typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val) && mongoose.Types.ObjectId.isValid(val);
}

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
    const allProducts = await Product.find({ isActive: true, deletedAt: null }).select('brand');

    const enriched = brands.map(b => {
      const bObj = typeof b.toObject === 'function' ? b.toObject() : { ...b };
      const bId = String(bObj._id);
      bObj.productCount = allProducts.filter(p => String(p.brand) === bId).length;
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

// GET /api/brands/:slug (Public — by slug or ObjectId)
const getPublicBrandBySlug = async (req, res, next) => {
  try {
    const param = String(req.params.slug || req.params.id || '').trim();
    const or = [
      { slug: param.toLowerCase() },
      { name: param }
    ];
    if (isObjectId(param)) {
      or.unshift({ _id: param });
    }
    const brand = await Brand.findOne({
      isActive: true,
      $or: or
    });
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found or inactive.'
      });
    }

    const productCount = await Product.countDocuments({
      brand: brand._id,
      isActive: true,
      deletedAt: null
    });

    const brandObj = typeof brand.toObject === 'function' ? brand.toObject() : { ...brand };
    brandObj.productCount = productCount;

    res.status(200).json({
      success: true,
      brand: brandObj
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

// POST /api/admin/brands/upload-logo
const uploadBrandLogoImage = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No logo image file was provided. Please choose a PNG, JPG, JPEG, WEBP, or safe SVG file.'
      });
    }

    if (req.file.mimetype === 'image/svg+xml' || req.file.originalname.toLowerCase().endsWith('.svg')) {
      if (!isSafeSvg(req.file.buffer)) {
        return res.status(400).json({
          success: false,
          message: 'SVG file contains unsafe scripts or embedded elements and cannot be uploaded.'
        });
      }
    }

    const uploaded = await uploadBuffer(
      req.file.buffer,
      req.file.originalname,
      CLOUDINARY_FOLDERS.brands,
      'image'
    );

    res.status(200).json({
      success: true,
      message: 'Brand logo uploaded successfully.',
      logo: {
        url: uploaded.url,
        publicId: uploaded.publicId,
        format: uploaded.format,
        width: uploaded.width,
        height: uploaded.height
      }
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
    let logoUrl = (req.body.logoUrl || '').trim();
    let logoPublicId = (req.body.logoPublicId || '').trim();

    if (req.file && req.file.buffer) {
      if (req.file.mimetype === 'image/svg+xml' || req.file.originalname.toLowerCase().endsWith('.svg')) {
        if (!isSafeSvg(req.file.buffer)) {
          return res.status(400).json({
            success: false,
            message: 'SVG file contains unsafe scripts or embedded elements and cannot be uploaded.'
          });
        }
      }
      const uploaded = await uploadBuffer(req.file.buffer, req.file.originalname, CLOUDINARY_FOLDERS.brands, 'image');
      logoUrl = uploaded.url;
      logoPublicId = uploaded.publicId;
    }
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
    const seoTitle = (req.body.seoTitle || '').trim();
    const seoDescription = (req.body.seoDescription || '').trim();
    const logoAlt = (req.body.logoAlt || '').trim();

    const brand = await Brand.create({
      name,
      slug,
      tabLabel,
      icon,
      description,
      logoUrl,
      logoPublicId,
      seoTitle,
      seoDescription,
      logoAlt,
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
    const displayOrder = req.body.displayOrder !== undefined ? Number(req.body.displayOrder) : brand.displayOrder;
    const isActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : brand.isActive;

    const oldPublicId = brand.logoPublicId || '';
    let logoUrl = brand.logoUrl || '';
    let logoPublicId = oldPublicId;
    let shouldCleanupOldLogo = false;

    // Case 1: Direct file upload on update
    if (req.file && req.file.buffer) {
      if (req.file.mimetype === 'image/svg+xml' || req.file.originalname.toLowerCase().endsWith('.svg')) {
        if (!isSafeSvg(req.file.buffer)) {
          return res.status(400).json({
            success: false,
            message: 'SVG file contains unsafe scripts or embedded elements and cannot be uploaded.'
          });
        }
      }
      // Upload new logo first to ensure Cloudinary success before touching old asset
      const uploaded = await uploadBuffer(req.file.buffer, req.file.originalname, CLOUDINARY_FOLDERS.brands, 'image');
      logoUrl = uploaded.url;
      logoPublicId = uploaded.publicId;
      if (oldPublicId && oldPublicId !== logoPublicId) {
        shouldCleanupOldLogo = true;
      }
    }
    // Case 2: Explicit removal of brand logo
    else if (req.body.removeLogo === true || req.body.removeLogo === 'true' || (req.body.logoUrl === '' && !req.file)) {
      logoUrl = '';
      logoPublicId = '';
      if (oldPublicId) {
        shouldCleanupOldLogo = true;
      }
    }
    // Case 3: Logo URL updated (e.g. from standalone upload endpoint or payload)
    else if (req.body.logoUrl !== undefined) {
      const incomingUrl = req.body.logoUrl.trim();
      const incomingPublicId = (req.body.logoPublicId || '').trim();
      logoUrl = incomingUrl;
      logoPublicId = incomingPublicId;
      if (oldPublicId && oldPublicId !== incomingPublicId) {
        shouldCleanupOldLogo = true;
      }
    }

    const seoTitle = req.body.seoTitle !== undefined ? req.body.seoTitle.trim() : brand.seoTitle;
    const seoDescription = req.body.seoDescription !== undefined ? req.body.seoDescription.trim() : brand.seoDescription;
    const logoAlt = req.body.logoAlt !== undefined ? req.body.logoAlt.trim() : brand.logoAlt;

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
          logoPublicId,
          seoTitle,
          seoDescription,
          logoAlt,
          displayOrder,
          isActive
        }
      },
      { new: true }
    );

    // Only after successful database update, clean up old Cloudinary asset if safe & unreferenced
    if (shouldCleanupOldLogo && oldPublicId && !oldPublicId.startsWith('local:')) {
      try {
        const otherBrand = await Brand.findOne({ _id: { $ne: brand._id }, logoPublicId: oldPublicId });
        if (!otherBrand) {
          await deleteAsset(oldPublicId, 'image', true);
        }
      } catch (cleanupErr) {
        console.warn('[BrandController] Non-blocking old logo cleanup warning:', cleanupErr.message);
      }
    }

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

    const logoToDelete = brand.logoPublicId;
    await Brand.findByIdAndDelete(req.params.id);

    // Safely remove associated Cloudinary logo asset if unreferenced elsewhere
    if (logoToDelete && !logoToDelete.startsWith('local:')) {
      try {
        const otherBrand = await Brand.findOne({ logoPublicId: logoToDelete });
        if (!otherBrand) {
          await deleteAsset(logoToDelete, 'image', true);
        }
      } catch (delErr) {
        console.warn('[BrandController] Non-blocking logo cleanup warning on brand delete:', delErr.message);
      }
    }

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
  getPublicBrandBySlug,
  getAdminBrands,
  uploadBrandLogoImage,
  createBrand,
  updateBrand,
  toggleBrandStatus,
  deleteBrand
};

