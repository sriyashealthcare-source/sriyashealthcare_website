const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const { uploadBuffer, deleteAsset } = require('../config/cloudinary');

function makeSlug(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseListField(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map(v => String(v).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(v => String(v).trim()).filter(Boolean);
        }
      } catch (_) {
        // Fallback to newline split
      }
    }
    return trimmed
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
}

function parseSpecificationsField(input) {
  if (!input) return [];
  let rawItems = [];
  if (Array.isArray(input)) {
    rawItems = input;
  } else if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) rawItems = parsed;
      } catch (_) {
        rawItems = trimmed.split(/\r?\n/);
      }
    } else {
      rawItems = trimmed.split(/\r?\n/);
    }
  }

  const specs = [];
  for (const item of rawItems) {
    if (!item) continue;
    if (typeof item === 'object' && ('value' in item || 'name' in item)) {
      const name = String(item.name || '').trim();
      const value = String(item.value || '').trim();
      if (name || value) {
        specs.push({ name, value: value || name });
      }
    } else if (typeof item === 'string') {
      const line = item.trim();
      if (!line) continue;
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        specs.push({
          name: line.slice(0, colonIdx).trim(),
          value: line.slice(colonIdx + 1).trim()
        });
      } else {
        specs.push({ name: '', value: line });
      }
    }
  }
  return specs;
}

async function resolveBrandRef(brandInput) {
  if (!brandInput) return null;
  const val = String(brandInput).trim();
  let doc = await Brand.findOne({
    $or: [{ _id: val }, { slug: val.toLowerCase() }, { name: val }]
  });
  return doc;
}

async function resolveCategoryRef(categoryInput, brandDoc) {
  if (!categoryInput) return null;
  const val = String(categoryInput).trim();
  let doc = await Category.findOne({
    $or: [{ _id: val }, { slug: val.toLowerCase() }, { name: val }]
  });
  if (!doc && brandDoc) {
    // Auto-create category under the brand if administrator typed a new category name
    const slug = makeSlug(`${brandDoc.slug}-${val}`);
    const count = await Category.countDocuments({});
    doc = await Category.create({
      name: val,
      slug,
      brand: brandDoc._id,
      heroTitle: val,
      description: `${val} by ${brandDoc.name}`,
      displayOrder: count + 1,
      isActive: true
    });
  }
  return doc;
}

function filterActivePublicProducts(products) {
  return products.filter(p => {
    if (!p.isActive || p.deletedAt) return false;
    if (p.brand && typeof p.brand === 'object' && p.brand.isActive === false) return false;
    if (p.category && typeof p.category === 'object' && p.category.isActive === false) return false;
    return true;
  });
}

// GET /api/products (Public)
const getPublicProducts = async (req, res, next) => {
  try {
    const { search, brand, category, sort } = req.query;
    const filter = { isActive: true, deletedAt: null };

    if (brand) {
      const bDoc = await resolveBrandRef(brand);
      if (!bDoc || !bDoc.isActive) {
        return res.status(200).json({ success: true, count: 0, products: [] });
      }
      filter.brand = bDoc._id;
    }

    if (category) {
      const cDoc = await Category.findOne({
        $or: [{ _id: category }, { slug: String(category).toLowerCase() }]
      });
      if (!cDoc || !cDoc.isActive) {
        return res.status(200).json({ success: true, count: 0, products: [] });
      }
      filter.category = cDoc._id;
    }

    let products = await Product.find(filter)
      .populate('brand', 'name slug tabLabel icon logoUrl displayOrder isActive')
      .populate('category', 'name slug heroTitle description heroGradient heroImage displayOrder isActive')
      .sort({ displayOrder: 1, createdAt: 1 });

    products = filterActivePublicProducts(products);

    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      products = products.filter(p => {
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const specMatch = (p.shortSpecification || '').toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        const catMatch = (p.cardCategory || '').toLowerCase().includes(q) ||
          (p.category?.name || '').toLowerCase().includes(q);
        const brandMatch = (p.brand?.name || '').toLowerCase().includes(q);
        return nameMatch || specMatch || descMatch || catMatch || brandMatch;
      });
    }

    if (sort === 'name') {
      products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sort === 'newest') {
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/slug/:slug (Public)
const getPublicProductBySlug = async (req, res, next) => {
  try {
    const slugParam = String(req.params.slug || '').trim().toLowerCase();
    const product = await Product.findOne({
      isActive: true,
      deletedAt: null,
      $or: [{ slug: slugParam }, { legacyId: slugParam }]
    })
      .populate('brand', 'name slug tabLabel icon logoUrl isActive')
      .populate('category', 'name slug heroTitle description heroGradient heroImage isActive');

    if (!product || (product.brand && product.brand.isActive === false) || (product.category && product.category.isActive === false)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id (Public — supports ObjectId, slug, or legacyId)
const getPublicProductById = async (req, res, next) => {
  try {
    const idParam = String(req.params.id || '').trim();
    let product = await Product.findOne({
      isActive: true,
      deletedAt: null,
      $or: [
        { _id: idParam },
        { slug: idParam.toLowerCase() },
        { legacyId: idParam.toLowerCase() }
      ]
    })
      .populate('brand', 'name slug tabLabel icon logoUrl isActive')
      .populate('category', 'name slug heroTitle description heroGradient heroImage isActive');

    if (!product || (product.brand && product.brand.isActive === false) || (product.category && product.category.isActive === false)) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/brand/:brand (Public)
const getPublicProductsByBrand = async (req, res, next) => {
  try {
    const brandDoc = await resolveBrandRef(req.params.brand);
    if (!brandDoc || !brandDoc.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found or inactive.'
      });
    }

    let products = await Product.find({
      brand: brandDoc._id,
      isActive: true,
      deletedAt: null
    })
      .populate('brand', 'name slug tabLabel icon logoUrl isActive')
      .populate('category', 'name slug heroTitle description heroGradient heroImage displayOrder isActive')
      .sort({ displayOrder: 1 });

    products = filterActivePublicProducts(products);

    res.status(200).json({
      success: true,
      brand: brandDoc,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/category/:category (Public)
const getPublicProductsByCategory = async (req, res, next) => {
  try {
    const catParam = String(req.params.category || '').trim();
    const catDoc = await Category.findOne({
      $or: [{ _id: catParam }, { slug: catParam.toLowerCase() }]
    }).populate('brand', 'name slug tabLabel icon isActive');

    if (!catDoc || !catDoc.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or inactive.'
      });
    }

    let products = await Product.find({
      category: catDoc._id,
      isActive: true,
      deletedAt: null
    })
      .populate('brand', 'name slug tabLabel icon logoUrl isActive')
      .populate('category', 'name slug heroTitle description heroGradient heroImage isActive')
      .sort({ displayOrder: 1 });

    products = filterActivePublicProducts(products);

    res.status(200).json({
      success: true,
      category: catDoc,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN PRODUCT CONTROLLERS
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/products
const getAdminProducts = async (req, res, next) => {
  try {
    const {
      search = '',
      brand = '',
      category = '',
      status = 'all',
      sort = 'order',
      page = 1,
      limit = 50
    } = req.query;

    const filter = {};
    if (status === 'archived') {
      filter.deletedAt = { $ne: null };
    } else {
      filter.deletedAt = null;
      if (status === 'active') filter.isActive = true;
      if (status === 'inactive') filter.isActive = false;
    }

    if (brand) {
      const bDoc = await resolveBrandRef(brand);
      if (bDoc) filter.brand = bDoc._id;
    }

    if (category) {
      const cDoc = await Category.findOne({
        $or: [{ _id: category }, { slug: String(category).toLowerCase() }]
      });
      if (cDoc) filter.category = cDoc._id;
    }

    let products = await Product.find(filter)
      .populate('brand', 'name slug tabLabel icon isActive')
      .populate('category', 'name slug heroTitle isActive');

    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      products = products.filter(p => {
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.shortSpecification || '').toLowerCase().includes(q) ||
          (p.cardCategory || '').toLowerCase().includes(q) ||
          (p.brand?.name || '').toLowerCase().includes(q) ||
          (p.category?.name || '').toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    if (sort === 'newest') {
      products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'most-viewed') {
      products.sort((a, b) => (Number(b.viewCount) || 0) - (Number(a.viewCount) || 0));
    } else if (sort === 'alphabetical' || sort === 'name') {
      products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      products.sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
    }

    const total = products.length;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(200, Number(limit) || 50));
    const startIdx = (pageNum - 1) * limitNum;
    const paginated = products.slice(startIdx, startIdx + limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      count: paginated.length,
      products: paginated
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/products/:id
const getAdminProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('brand', 'name slug tabLabel icon isActive')
      .populate('category', 'name slug heroTitle isActive');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/products
const createProduct = async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    const brandDoc = await resolveBrandRef(req.body.brand);
    if (!brandDoc) {
      return res.status(400).json({
        success: false,
        message: 'Valid brand is required.'
      });
    }

    const categoryDoc = await resolveCategoryRef(req.body.category, brandDoc);
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Valid category is required.'
      });
    }

    let baseSlug = req.body.slug ? makeSlug(req.body.slug) : makeSlug(name);
    if (!baseSlug) baseSlug = `product-${Date.now()}`;
    let slug = baseSlug;
    const existingSlug = await Product.findOne({ slug });
    if (existingSlug) {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const shortSpecification = (req.body.shortSpecification || '').trim();
    const description = (req.body.description || '').trim();
    const cardCategory = (req.body.cardCategory || categoryDoc.name).trim();
    const detailCategory = (req.body.detailCategory || `${categoryDoc.name} · ${cardCategory}`).trim();
    const features = parseListField(req.body.features);
    const specifications = parseSpecificationsField(req.body.specifications);
    const applications = parseListField(req.body.applications);
    const isActive = req.body.isActive !== undefined
      ? (typeof req.body.isActive === 'boolean' ? req.body.isActive : String(req.body.isActive) !== 'false')
      : true;

    const totalProducts = await Product.countDocuments({});
    const displayOrder = req.body.displayOrder !== undefined && req.body.displayOrder !== ''
      ? Number(req.body.displayOrder)
      : totalProducts + 1;

    // Handle uploaded images
    const images = [];
    const uploadedImageFiles = (req.files && req.files.images) ? req.files.images : [];
    for (let i = 0; i < uploadedImageFiles.length; i++) {
      const file = uploadedImageFiles[i];
      const uploaded = await uploadBuffer(file.buffer, file.originalname, 'sriyas-healthcare/products', 'image');
      images.push({
        url: uploaded.url,
        publicId: uploaded.publicId,
        isPrimary: i === 0
      });
    }

    // Also allow passing image URLs if provided via JSON
    if (images.length === 0 && req.body.imageUrls) {
      const urls = parseListField(req.body.imageUrls);
      urls.forEach((u, idx) => {
        images.push({ url: u, publicId: '', isPrimary: idx === 0 });
      });
    }

    // Handle brochure PDF upload
    let brochure = { url: '', publicId: '', filename: '' };
    const brochureFiles = (req.files && req.files.brochure) ? req.files.brochure : [];
    if (brochureFiles.length > 0) {
      const pdfFile = brochureFiles[0];
      const uploadedPdf = await uploadBuffer(pdfFile.buffer, pdfFile.originalname, 'sriyas-healthcare/brochures', 'raw');
      brochure = {
        url: uploadedPdf.url,
        publicId: uploadedPdf.publicId,
        filename: pdfFile.originalname
      };
    }

    const created = await Product.create({
      legacyId: slug,
      name,
      slug,
      brand: brandDoc._id,
      category: categoryDoc._id,
      cardCategory,
      detailCategory,
      shortSpecification,
      description,
      images,
      features,
      specifications,
      applications,
      brochure,
      isActive,
      displayOrder,
      deletedAt: null
    });

    const populated = await Product.findById(created._id)
      .populate('brand', 'name slug tabLabel icon')
      .populate('category', 'name slug heroTitle');

    res.status(201).json({
      success: true,
      message: `Product "${name}" created successfully.`,
      product: populated
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    let brandDoc = null;
    if (req.body.brand) {
      brandDoc = await resolveBrandRef(req.body.brand);
      if (!brandDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid brand specified.'
        });
      }
    } else {
      brandDoc = await Brand.findById(product.brand);
    }

    let categoryDoc = null;
    if (req.body.category) {
      categoryDoc = await resolveCategoryRef(req.body.category, brandDoc);
      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category specified.'
        });
      }
    } else {
      categoryDoc = await Category.findById(product.category);
    }

    const name = req.body.name !== undefined ? req.body.name.trim() : product.name;
    const shortSpecification = req.body.shortSpecification !== undefined
      ? req.body.shortSpecification.trim()
      : product.shortSpecification;
    const description = req.body.description !== undefined
      ? req.body.description.trim()
      : product.description;
    const cardCategory = req.body.cardCategory !== undefined
      ? req.body.cardCategory.trim()
      : product.cardCategory;
    const detailCategory = req.body.detailCategory !== undefined
      ? req.body.detailCategory.trim()
      : product.detailCategory;

    const features = req.body.features !== undefined
      ? parseListField(req.body.features)
      : product.features;
    const specifications = req.body.specifications !== undefined
      ? parseSpecificationsField(req.body.specifications)
      : product.specifications;
    const applications = req.body.applications !== undefined
      ? parseListField(req.body.applications)
      : product.applications;

    const isActive = req.body.isActive !== undefined
      ? (typeof req.body.isActive === 'boolean' ? req.body.isActive : String(req.body.isActive) === 'true')
      : product.isActive;
    const displayOrder = req.body.displayOrder !== undefined && req.body.displayOrder !== ''
      ? Number(req.body.displayOrder)
      : product.displayOrder;

    // Manage existing & new images
    let retainedImages = product.images || [];
    if (req.body.existingImages !== undefined) {
      try {
        const parsed = typeof req.body.existingImages === 'string'
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;
        if (Array.isArray(parsed)) {
          // Delete removed images from Cloudinary if they had a publicId
          const keptUrls = new Set(parsed.map(img => img.url));
          for (const oldImg of (product.images || [])) {
            if (oldImg.publicId && !keptUrls.has(oldImg.url)) {
              await deleteAsset(oldImg.publicId, 'image');
            }
          }
          retainedImages = parsed.map(img => ({
            url: img.url,
            publicId: img.publicId || '',
            isPrimary: Boolean(img.isPrimary)
          }));
        }
      } catch (err) {
        console.warn('[ProductUpdate] Could not parse existingImages:', err.message);
      }
    }

    const uploadedImageFiles = (req.files && req.files.images) ? req.files.images : [];
    const replaceAllImages = String(req.body.replaceAllImages) === 'true';
    if (replaceAllImages && uploadedImageFiles.length > 0) {
      for (const oldImg of retainedImages) {
        if (oldImg.publicId) {
          await deleteAsset(oldImg.publicId, 'image');
        }
      }
      retainedImages = [];
    }

    for (const file of uploadedImageFiles) {
      const uploaded = await uploadBuffer(file.buffer, file.originalname, 'sriyas-healthcare/products', 'image');
      retainedImages.push({
        url: uploaded.url,
        publicId: uploaded.publicId,
        isPrimary: false
      });
    }

    // Ensure exactly one primary image if images exist
    if (retainedImages.length > 0) {
      const primaryIdx = retainedImages.findIndex(img => img.isPrimary);
      retainedImages = retainedImages.map((img, idx) => ({
        ...img,
        isPrimary: primaryIdx === -1 ? idx === 0 : idx === primaryIdx
      }));
    }

    // Manage Brochure PDF
    let brochure = product.brochure || { url: '', publicId: '', filename: '' };
    if (String(req.body.removeBrochure) === 'true') {
      if (brochure.publicId) {
        await deleteAsset(brochure.publicId, 'raw');
      }
      brochure = { url: '', publicId: '', filename: '' };
    }

    const brochureFiles = (req.files && req.files.brochure) ? req.files.brochure : [];
    if (brochureFiles.length > 0) {
      if (brochure.publicId) {
        await deleteAsset(brochure.publicId, 'raw');
      }
      const pdfFile = brochureFiles[0];
      const uploadedPdf = await uploadBuffer(pdfFile.buffer, pdfFile.originalname, 'sriyas-healthcare/brochures', 'raw');
      brochure = {
        url: uploadedPdf.url,
        publicId: uploadedPdf.publicId,
        filename: pdfFile.originalname
      };
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          brand: brandDoc ? brandDoc._id : product.brand,
          category: categoryDoc ? categoryDoc._id : product.category,
          cardCategory,
          detailCategory,
          shortSpecification,
          description,
          images: retainedImages,
          features,
          specifications,
          applications,
          brochure,
          isActive,
          displayOrder
        }
      },
      { new: true }
    )
      .populate('brand', 'name slug tabLabel icon')
      .populate('category', 'name slug heroTitle');

    res.status(200).json({
      success: true,
      message: `Product "${updated.name}" updated successfully.`,
      product: updated
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/products/:id/status
const toggleProductStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const updateFields = {};
    if (req.body.restore === true || String(req.body.restore) === 'true') {
      updateFields.deletedAt = null;
      updateFields.isActive = true;
    } else if (req.body.isActive !== undefined) {
      updateFields.isActive = Boolean(req.body.isActive);
    } else {
      updateFields.isActive = !product.isActive;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    )
      .populate('brand', 'name slug tabLabel icon')
      .populate('category', 'name slug heroTitle');

    res.status(200).json({
      success: true,
      message: updateFields.deletedAt === null && product.deletedAt
        ? `Product "${updated.name}" restored from archive.`
        : `Product "${updated.name}" is now ${updated.isActive ? 'Active' : 'Inactive'}.`,
      product: updated
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/products/:id (Soft-delete / archive by default to preserve analytics)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    if (req.query.permanent === 'true') {
      for (const img of (product.images || [])) {
        if (img.publicId) {
          await deleteAsset(img.publicId, 'image');
        }
      }
      if (product.brochure && product.brochure.publicId) {
        await deleteAsset(product.brochure.publicId, 'raw');
      }
      await Product.findByIdAndDelete(req.params.id);
      return res.status(200).json({
        success: true,
        message: `Product "${product.name}" permanently deleted. Historical view analytics remain preserved.`
      });
    }

    // Soft-delete (Archive)
    const archived = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          isActive: false,
          deletedAt: new Date()
        }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Product "${archived.name}" archived and hidden from the public catalogue.`,
      product: archived
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};

