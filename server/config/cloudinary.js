const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const crypto = require('crypto');

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

const configureCloudinary = () => {
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
      api_key: process.env.CLOUDINARY_API_KEY.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
      secure: true
    });
    console.log('[Cloudinary] Configured cloud storage:', process.env.CLOUDINARY_CLOUD_NAME.trim());
    return true;
  }
  console.log('[Cloudinary] Credentials not set in .env — using local static asset storage for development.');
  return false;
};

// Standardized folder hierarchy
const CLOUDINARY_FOLDERS = {
  products: 'sriyas/products',
  brands: 'sriyas/brands',
  categories: 'sriyas/categories',
  brochures: 'sriyas/brochures',
  website: 'sriyas/website',
  test: 'sriyas/test'
};

const uploadBuffer = async (buffer, originalName = 'upload.png', folder = CLOUDINARY_FOLDERS.products, resourceType = 'image') => {
  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true
      };
      if (resourceType === 'image') {
        uploadOptions.transformation = [{ quality: 'auto', fetch_format: 'auto' }];
      }

      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format || (resourceType === 'raw' ? 'pdf' : 'webp'),
          width: result.width || 0,
          height: result.height || 0,
          bytes: result.bytes || (buffer ? buffer.length : 0),
          filename: originalName
        });
      });
      stream.end(buffer);
    });
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cloudinary credentials are required for file uploads in production.');
  }

  // Local development fallback storage in client/public/assets/uploads
  const uploadsDir = path.join(__dirname, '..', '..', 'client', 'public', 'assets', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const ext = path.extname(originalName) || (resourceType === 'raw' ? '.pdf' : '.png');
  const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  const uniqueName = `${safeBase}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}${ext}`;
  const fullPath = path.join(uploadsDir, uniqueName);
  fs.writeFileSync(fullPath, buffer);

  return {
    url: `/assets/uploads/${uniqueName}`,
    publicId: `local:${uniqueName}`,
    format: ext.replace('.', ''),
    width: 0,
    height: 0,
    bytes: buffer ? buffer.length : 0,
    filename: originalName
  };
};

const uploadLocalFile = async (filePath, folder = CLOUDINARY_FOLDERS.products, resourceType = 'image') => {
  if (!isCloudinaryConfigured()) {
    return null;
  }
  const uploadOptions = {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: false,
    overwrite: true
  };
  if (resourceType === 'image') {
    uploadOptions.transformation = [{ quality: 'auto', fetch_format: 'auto' }];
  }
  const result = await cloudinary.uploader.upload(filePath, uploadOptions);
  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    width: result.width || 0,
    height: result.height || 0,
    bytes: result.bytes || 0
  };
};

const deleteAsset = async (publicId, resourceType = 'image', checkReferences = true) => {
  if (!publicId) return false;

  if (publicId.startsWith('local:')) {
    const fileName = publicId.replace('local:', '');
    const localPath = path.join(__dirname, '..', '..', 'client', 'public', 'assets', 'uploads', path.basename(fileName));
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch (err) {
        console.warn('[Cloudinary] Failed to remove local upload:', err.message);
      }
    }
    return true;
  }

  // Safety check: ensure publicId belongs to Sriyas namespaces
  if (!publicId.startsWith('sriyas/') && !publicId.startsWith('sriyas-healthcare/')) {
    console.warn('[Cloudinary] Refusing to delete asset outside Sriyas namespace:', publicId);
    return false;
  }

  if (checkReferences) {
    try {
      const Product = require('../models/Product');
      const Brand = require('../models/Brand');
      const Category = require('../models/Category');
      const HomepageContent = require('../models/HomepageContent');

      const [productCount, brandCount, categoryCount, homepageDoc] = await Promise.all([
        Product.countDocuments({
          $or: [
            { 'images.publicId': publicId },
            { 'brochure.publicId': publicId }
          ]
        }),
        Brand.countDocuments({ logoPublicId: publicId }),
        Category.countDocuments({ 'heroImage.publicId': publicId }),
        HomepageContent.findOne({ singletonKey: 'main_homepage' }).lean()
      ]);

      let homepageCount = 0;
      if (homepageDoc) {
        const serialized = JSON.stringify({
          draft: homepageDoc.draft || null,
          published: homepageDoc.published || null
        });
        if (serialized.includes(publicId)) {
          homepageCount = 1;
        }
      }

      if (productCount + brandCount + categoryCount + homepageCount > 0) {
        console.log(`[Cloudinary] Asset ${publicId} is still referenced by active record(s). Skipping deletion.`);
        return false;
      }
    } catch (e) {
      // If models or DB are not reachable, continue safely
      console.warn('[Cloudinary] Could not check active references for asset deletion:', e.message);
    }
  }

  if (isCloudinaryConfigured()) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return result.result === 'ok';
    } catch (err) {
      console.warn('[Cloudinary] Failed to delete asset from Cloudinary:', err.message);
      return false;
    }
  }
  return false;
};

const listMediaLibrary = async (maxResults = 60) => {
  if (isCloudinaryConfigured()) {
    try {
      if (!cloudinary.config().cloud_name) {
        configureCloudinary();
      }
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'sriyas/',
        resource_type: 'image',
        max_results: Math.min(100, Math.max(10, Number(maxResults) || 60))
      });
      return (result?.resources || []).map((item) => ({
        url: item.secure_url,
        publicId: item.public_id,
        format: item.format || '',
        width: item.width || 0,
        height: item.height || 0,
        bytes: item.bytes || 0,
        createdAt: item.created_at || null,
        source: 'cloudinary'
      }));
    } catch (err) {
      console.warn('[Cloudinary] Could not list remote media library:', err.message);
    }
  }

  const localDirs = [
    { dir: path.join(__dirname, '..', '..', 'client', 'public', 'assets', 'uploads'), prefix: '/assets/uploads/', idPrefix: 'local:', source: 'local-upload' },
    { dir: path.join(__dirname, '..', '..', 'client', 'public', 'assets', 'placeholders'), prefix: '/assets/placeholders/', idPrefix: '', source: 'placeholder' },
    { dir: path.join(__dirname, '..', '..', 'client', 'public', 'assets', 'contact'), prefix: '/assets/contact/', idPrefix: '', source: 'site-asset' },
    { dir: path.join(__dirname, '..', '..', 'client', 'public', 'assets', 'logos'), prefix: '/assets/logos/', idPrefix: '', source: 'site-asset' }
  ];

  const collected = [];
  for (const entry of localDirs) {
    if (!fs.existsSync(entry.dir)) continue;
    const files = fs.readdirSync(entry.dir);
    for (const file of files) {
      if (!/\.(png|jpe?g|webp|svg|avif)$/i.test(file)) continue;
      collected.push({
        url: `${entry.prefix}${file}`,
        publicId: entry.idPrefix ? `${entry.idPrefix}${file}` : '',
        format: path.extname(file).replace('.', ''),
        width: 0,
        height: 0,
        source: entry.source,
        label: file
      });
    }
  }
  return collected;
};

module.exports = {
  cloudinary,
  CLOUDINARY_FOLDERS,
  isCloudinaryConfigured,
  configureCloudinary,
  uploadBuffer,
  uploadLocalFile,
  deleteAsset,
  listMediaLibrary
};
