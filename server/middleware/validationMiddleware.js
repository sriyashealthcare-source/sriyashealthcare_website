function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    cleaned[key] = sanitizeObject(value);
  }
  return cleaned;
}

const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
};

const validateLoginInput = (req, res, next) => {
  const email = (req.body.email || '').trim();
  const password = req.body.password || '';

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and password.'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.'
    });
  }

  next();
};

const validateProductInput = (req, res, next) => {
  const name = (req.body.name || '').trim();
  const brand = (req.body.brand || '').trim();
  const category = (req.body.category || '').trim();

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Product name is required.'
    });
  }
  if (!brand) {
    return res.status(400).json({
      success: false,
      message: 'Product brand is required.'
    });
  }
  if (!category) {
    return res.status(400).json({
      success: false,
      message: 'Product category is required.'
    });
  }

  next();
};

const validateBrandInput = (req, res, next) => {
  const name = (req.body.name || '').trim();
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Brand name is required.'
    });
  }
  next();
};

const validateCategoryInput = (req, res, next) => {
  const name = (req.body.name || '').trim();
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Category name is required.'
    });
  }
  next();
};

module.exports = {
  sanitizeRequest,
  validateLoginInput,
  validateProductInput,
  validateBrandInput,
  validateCategoryInput
};

