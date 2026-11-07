const multer = require('multer');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_PDF_TYPES = ['application/pdf'];

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

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB max per file (supports multi-page PDF brochures)
    files: 12
  },
  fileFilter
});

const uploadProductFiles = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'brochure', maxCount: 1 }
]);

const uploadCategoryHero = upload.single('heroImage');

module.exports = {
  upload,
  uploadProductFiles,
  uploadCategoryHero
};

