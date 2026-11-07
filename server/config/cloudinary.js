const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
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

const uploadBuffer = async (buffer, originalName = 'upload.png', folder = 'sriyas-healthcare/products', resourceType = 'image') => {
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
    filename: originalName
  };
};

const uploadLocalFile = async (filePath, folder = 'sriyas-healthcare/products', resourceType = 'image') => {
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
    publicId: result.public_id
  };
};

const deleteAsset = async (publicId, resourceType = 'image') => {
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

  if (isCloudinaryConfigured()) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return true;
    } catch (err) {
      console.warn('[Cloudinary] Failed to delete asset from Cloudinary:', err.message);
      return false;
    }
  }
  return false;
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  configureCloudinary,
  uploadBuffer,
  uploadLocalFile,
  deleteAsset
};

