const multer = require('multer');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_BRAND_LOGO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
const ALLOWED_PDF_TYPES = ['application/pdf'];

function isSafeSvg(buffer) {
  if (!buffer) return false;
  const content = buffer.toString('utf8');
  if (!content.includes('<svg') && !content.includes('<SVG')) return false;

  // Disallow scripts, event handlers, and remote code embedding
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    /onclick\s*=/i,
    /onmouseover\s*=/i,
    /onfocus\s*=/i,
    /<foreignObject/i,
    /<iframe/i,
    /<embed/i,
    /<object/i
  ];

  return !dangerousPatterns.some(pattern => pattern.test(content));
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'brochure') {
    if (ALLOWED_PDF_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    const err = new Error('Only PDF files (.pdf) are allowed for product brochures.');
    err.statusCode = 400;
    return cb(err, false);
  }

  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(null, true);
  }

  const err = new Error('Only PNG, JPG, JPEG, and WEBP image files are allowed.');
  err.statusCode = 400;
  return cb(err, false);
};

const brandLogoFileFilter = (req, file, cb) => {
  const isSvg = file.mimetype === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg');
  if (ALLOWED_BRAND_LOGO_TYPES.includes(file.mimetype) || isSvg) {
    return cb(null, true);
  }

  const err = new Error('Only PNG, JPG, JPEG, WEBP, and safe SVG logo files are allowed.');
  err.statusCode = 400;
  return cb(err, false);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB max per file (supports multi-page PDF brochures)
    files: 12
  },
  fileFilter
});

const brandLogoUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max per brand logo image
    files: 1
  },
  fileFilter: brandLogoFileFilter
});

const uploadProductFiles = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'brochure', maxCount: 1 }
]);

const uploadCategoryFiles = upload.fields([
  { name: 'heroImage', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'logoImage', maxCount: 1 }
]);

const uploadCategoryHero = (req, res, next) => {
  uploadCategoryFiles(req, res, (err) => {
    if (err) {
      // Fallback to single heroImage in case of unexpected field shape
      return upload.single('heroImage')(req, res, next);
    }
    next();
  });
};
const uploadBrandLogo = brandLogoUpload.single('logo');

module.exports = {
  upload,
  uploadProductFiles,
  uploadCategoryHero,
  uploadBrandLogo,
  isSafeSvg
};

