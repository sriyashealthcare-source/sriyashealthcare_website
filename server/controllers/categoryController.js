const mongoose = require('mongoose');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const { uploadBuffer, deleteAsset, CLOUDINARY_FOLDERS } = require('../config/cloudinary');

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

// GET /api/categories (Public)
const getPublicCategories = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.brand) {
      const bVal = String(req.query.brand).trim();
      const or = [{ slug: bVal.toLowerCase() }, { name: bVal }];
      if (isObjectId(bVal)) {
        or.unshift({ _id: bVal });
      }
      const bDoc = await Brand.findOne({ $or: or });
      if (bDoc) {
        filter.brand = bDoc._id;
      }
    }
    if (req.query.parentCategory !== undefined) {
      if (req.query.parentCategory === 'null' || req.query.parentCategory === '') {
        filter.parentCategory = null;
      } else {
        const pVal = String(req.query.parentCategory).trim();
        const or = [{ slug: pVal.toLowerCase() }, { name: pVal }];
        if (isObjectId(pVal)) or.unshift({ _id: pVal });
        const pDoc = await Category.findOne({ $or: or });
        filter.parentCategory = pDoc ? pDoc._id : pVal;
      }
    }
    const categories = await Category.find(filter)
      .populate('brand', 'name slug tabLabel icon isActive')
      .populate('parentCategory', 'name slug heroTitle description isActive')
      .sort({ displayOrder: 1, name: 1 });

    // Attach nested subcategories for consumer convenience
    const enriched = categories.map(c => {
      const cObj = typeof c.toObject === 'function' ? c.toObject() : { ...c };
      const cId = String(cObj._id);
      cObj.brand_id = cObj.brand ? (cObj.brand._id || cObj.brand) : null;
      cObj.category_id = cObj._id;
      cObj.parent_category_id = cObj.parentCategory ? (cObj.parentCategory._id || cObj.parentCategory) : null;
      cObj.logoUrl = cObj.logoUrl || (cObj.logoImage && cObj.logoImage.url) || '';
      cObj.logo_url = cObj.logoUrl;
      cObj.subcategories = categories
        .filter(sub => {
          const pId = sub.parentCategory ? String(sub.parentCategory._id || sub.parentCategory) : null;
          return pId === cId;
        })
        .map(sub => {
          const subObj = typeof sub.toObject === 'function' ? sub.toObject() : { ...sub };
          subObj.brand_id = subObj.brand ? (subObj.brand._id || subObj.brand) : null;
          subObj.category_id = subObj.parentCategory ? (subObj.parentCategory._id || subObj.parentCategory) : null;
          subObj.subcategory_id = subObj._id;
          subObj.logoUrl = subObj.logoUrl || (subObj.logoImage && subObj.logoImage.url) || '';
          subObj.logo_url = subObj.logoUrl;
          return subObj;
        });
      cObj.has_subcategories = Boolean((cObj.subcategories && cObj.subcategories.length > 0) || cObj.hasSubcategories);
      cObj.hasSubcategories = cObj.has_subcategories;
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

// GET /api/admin/categories (Admin)
const getAdminCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({})
      .populate('brand', 'name slug tabLabel icon isActive')
      .populate('parentCategory', 'name slug heroTitle description isActive')
      .sort({ displayOrder: 1, name: 1 });

    const allProducts = await Product.find({ deletedAt: null });

    const enriched = categories.map(c => {
      const cObj = typeof c.toObject === 'function' ? c.toObject() : { ...c };
      const cId = String(cObj._id);
      // Count products directly assigned to this category or subcategory
      cObj.productCount = allProducts.filter(p => String(p.category) === cId || String(p.subcategory) === cId).length;
      cObj.activeProductCount = allProducts.filter(p => (String(p.category) === cId || String(p.subcategory) === cId) && p.isActive).length;
      return cObj;
    });

    // Attach subcategories array to main categories
    enriched.forEach(cObj => {
      const cId = String(cObj._id);
      cObj.brand_id = cObj.brand ? (cObj.brand._id || cObj.brand) : null;
      cObj.category_id = cObj._id;
      cObj.parent_category_id = cObj.parentCategory ? (cObj.parentCategory._id || cObj.parentCategory) : null;
      cObj.logoUrl = cObj.logoUrl || (cObj.logoImage && cObj.logoImage.url) || '';
      cObj.logo_url = cObj.logoUrl;
      cObj.subcategories = enriched
        .filter(sub => {
          const pId = sub.parentCategory ? String(sub.parentCategory._id || sub.parentCategory) : null;
          return pId === cId;
        })
        .map(sub => {
          sub.brand_id = sub.brand ? (sub.brand._id || sub.brand) : null;
          sub.category_id = sub.parentCategory ? (sub.parentCategory._id || sub.parentCategory) : null;
          sub.subcategory_id = sub._id;
          sub.logoUrl = sub.logoUrl || (sub.logoImage && sub.logoImage.url) || '';
          sub.logo_url = sub.logoUrl;
          return sub;
        });
      cObj.has_subcategories = Boolean((cObj.subcategories && cObj.subcategories.length > 0) || cObj.hasSubcategories);
      cObj.hasSubcategories = cObj.has_subcategories;
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
      const bVal = String(brandId).trim();
      const or = [{ slug: bVal.toLowerCase() }, { name: bVal }];
      if (isObjectId(bVal)) {
        or.unshift({ _id: bVal });
      }
      const brandDoc = await Brand.findOne({ $or: or });
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

    let logoUrl = (req.body.logoUrl || req.body.logo_url || '').trim();
    let logoImage = {
      url: logoUrl,
      publicId: '',
      format: 'webp'
    };

    let heroFile = null;
    let logoFile = null;

    if (req.files) {
      if (req.files.heroImage && req.files.heroImage[0]) heroFile = req.files.heroImage[0];
      if (req.files.logo && req.files.logo[0]) logoFile = req.files.logo[0];
      if (req.files.logoImage && req.files.logoImage[0]) logoFile = req.files.logoImage[0];
    } else if (req.file) {
      if (req.file.fieldname === 'logo' || req.file.fieldname === 'logoImage') {
        logoFile = req.file;
      } else {
        heroFile = req.file;
      }
    }

    if (heroFile && heroFile.buffer) {
      const uploaded = await uploadBuffer(heroFile.buffer, heroFile.originalname, CLOUDINARY_FOLDERS.categories, 'image');
      heroImage = {
        url: uploaded.url,
        publicId: uploaded.publicId,
        format: uploaded.format,
        width: uploaded.width,
        height: uploaded.height
      };
    }

    if (logoFile && logoFile.buffer) {
      const uploadedLogo = await uploadBuffer(logoFile.buffer, logoFile.originalname, CLOUDINARY_FOLDERS.brands || 'sriyas-healthcare/brands', 'image');
      logoImage = {
        url: uploadedLogo.url,
        publicId: uploadedLogo.publicId,
        format: uploadedLogo.format,
        width: uploadedLogo.width,
        height: uploadedLogo.height
      };
      logoUrl = uploadedLogo.url;
    }

    const hasSubcategories = Boolean(
      req.body.hasSubcategories === true ||
      String(req.body.hasSubcategories) === 'true' ||
      req.body.has_subcategories === true ||
      String(req.body.has_subcategories) === 'true'
    );

    const totalCats = await Category.countDocuments({});
    const displayOrder = req.body.displayOrder !== undefined ? Number(req.body.displayOrder) : totalCats + 1;

    let parentCategoryId = null;
    const parentInput = req.body.parentCategory || req.body.parentCategoryId;
    if (parentInput && parentInput !== 'null' && parentInput !== '') {
      const pVal = String(parentInput).trim();
      const or = [{ slug: pVal.toLowerCase() }, { name: pVal }];
      if (isObjectId(pVal)) or.unshift({ _id: pVal });
      const parentDoc = await Category.findOne({ $or: or });
      if (parentDoc) {
        parentCategoryId = parentDoc._id;
        if (!brandId && parentDoc.brand) {
          brandId = parentDoc.brand;
        }
      }
    }

    const created = await Category.create({
      name,
      slug,
      brand: brandId,
      parentCategory: parentCategoryId,
      hasSubcategories,
      logoUrl,
      logoImage,
      heroTitle,
      description,
      heroGradient,
      heroImage,
      displayOrder,
      isActive
    });

    const populated = await Category.findById(created._id)
      .populate('brand', 'name slug tabLabel icon isActive')
      .populate('parentCategory', 'name slug heroTitle description isActive');

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
      const bVal = String(brandId).trim();
      const or = [{ slug: bVal.toLowerCase() }, { name: bVal }];
      if (isObjectId(bVal)) {
        or.unshift({ _id: bVal });
      }
      const brandDoc = await Brand.findOne({ $or: or });
      if (brandDoc) brandId = brandDoc._id;
    }

    const heroTitle = req.body.heroTitle !== undefined ? req.body.heroTitle.trim() : category.heroTitle;
    const description = req.body.description !== undefined ? req.body.description.trim() : category.description;
    const heroGradient = req.body.heroGradient !== undefined ? req.body.heroGradient.trim() : category.heroGradient;
    const displayOrder = req.body.displayOrder !== undefined ? Number(req.body.displayOrder) : category.displayOrder;
    const isActive = req.body.isActive !== undefined
      ? (typeof req.body.isActive === 'boolean' ? req.body.isActive : String(req.body.isActive) === 'true')
      : category.isActive;

    let parentCategoryId = category.parentCategory || null;
    if (req.body.parentCategory !== undefined || req.body.parentCategoryId !== undefined) {
      const parentInput = req.body.parentCategory !== undefined ? req.body.parentCategory : req.body.parentCategoryId;
      if (!parentInput || parentInput === 'null' || parentInput === '') {
        parentCategoryId = null;
      } else {
        const pVal = String(parentInput).trim();
        if (pVal !== String(category._id)) {
          const or = [{ slug: pVal.toLowerCase() }, { name: pVal }];
          if (isObjectId(pVal)) or.unshift({ _id: pVal });
          const parentDoc = await Category.findOne({ $or: or });
          if (parentDoc && String(parentDoc._id) !== String(category._id)) {
            parentCategoryId = parentDoc._id;
            if (!brandId && parentDoc.brand) brandId = parentDoc.brand;
          }
        }
      }
    }

    let heroImage = category.heroImage || { url: '', publicId: '', format: 'webp', width: 0, height: 0 };
    let logoUrl = req.body.logoUrl !== undefined
      ? req.body.logoUrl.trim()
      : (req.body.logo_url !== undefined ? req.body.logo_url.trim() : (category.logoUrl || category.logoImage?.url || ''));

    let logoImage = category.logoImage || { url: logoUrl, publicId: '', format: 'webp', width: 0, height: 0 };

    let heroFile = null;
    let logoFile = null;

    if (req.files) {
      if (req.files.heroImage && req.files.heroImage[0]) heroFile = req.files.heroImage[0];
      if (req.files.logo && req.files.logo[0]) logoFile = req.files.logo[0];
      if (req.files.logoImage && req.files.logoImage[0]) logoFile = req.files.logoImage[0];
    } else if (req.file) {
      if (req.file.fieldname === 'logo' || req.file.fieldname === 'logoImage') {
        logoFile = req.file;
      } else {
        heroFile = req.file;
      }
    }

    if (heroFile && heroFile.buffer) {
      if (heroImage.publicId) {
        await deleteAsset(heroImage.publicId, 'image', true);
      }
      const uploaded = await uploadBuffer(heroFile.buffer, heroFile.originalname, CLOUDINARY_FOLDERS.categories, 'image');
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

    if (logoFile && logoFile.buffer) {
      if (logoImage.publicId) {
        await deleteAsset(logoImage.publicId, 'image', true);
      }
      const uploadedLogo = await uploadBuffer(logoFile.buffer, logoFile.originalname, CLOUDINARY_FOLDERS.brands || 'sriyas-healthcare/brands', 'image');
      logoImage = {
        url: uploadedLogo.url,
        publicId: uploadedLogo.publicId,
        format: uploadedLogo.format,
        width: uploadedLogo.width,
        height: uploadedLogo.height
      };
      logoUrl = uploadedLogo.url;
    }

    const hasSubcategories = req.body.hasSubcategories !== undefined || req.body.has_subcategories !== undefined
      ? Boolean(
          req.body.hasSubcategories === true ||
          String(req.body.hasSubcategories) === 'true' ||
          req.body.has_subcategories === true ||
          String(req.body.has_subcategories) === 'true'
        )
      : (category.hasSubcategories || false);

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          brand: brandId,
          parentCategory: parentCategoryId,
          hasSubcategories,
          logoUrl,
          logoImage,
          heroTitle,
          description,
          heroGradient,
          heroImage,
          displayOrder,
          isActive
        }
      },
      { new: true }
    )
      .populate('brand', 'name slug tabLabel icon isActive')
      .populate('parentCategory', 'name slug heroTitle description isActive');

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

    const childSubcategoriesCount = await Category.countDocuments({
      parentCategory: category._id
    });
    if (childSubcategoriesCount > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete "${category.name}" because ${childSubcategoriesCount} subcategory/subcategories are nested under it. Delete or reassign the subcategories first.`
      });
    }

    const assignedProductsCount = await Product.countDocuments({
      $or: [{ category: category._id }, { subcategory: category._id }],
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

