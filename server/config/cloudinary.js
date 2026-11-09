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

      const [productCount, brandCount, categoryCount] = await Promise.all([
        Product.countDocuments({
          $or: [
            { 'images.publicId': publicId },
            { 'brochure.publicId': publicId }
          ]
        }),
        Brand.countDocuments({ logoPublicId: publicId }),
        Category.countDocuments({ 'heroImage.publicId': publicId })
      ]);

      if (productCount + brandCount + categoryCount > 0) {
        console.log(`[Cloudinary] Asset ${publicId} is still referenced by ${productCount + brandCount + categoryCount} active record(s). Skipping deletion.`);
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

module.exports = {
  cloudinary,
  CLOUDINARY_FOLDERS,
  isCloudinaryConfigured,
  configureCloudinary,
  uploadBuffer,
  uploadLocalFile,
  deleteAsset
};
