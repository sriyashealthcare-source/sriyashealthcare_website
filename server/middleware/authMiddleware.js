const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production.');
  }
  return secret || 'sriyas_healthcare_dev_jwt_secret_2026_secure';
};

const protectAdmin = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.sriyas_admin_token) {
      token = req.cookies.sriyas_admin_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in as an administrator.'
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Administrator session is invalid or account is disabled.'
      });
    }

    req.admin = {
      id: String(admin._id),
      name: admin.name,
      email: admin.email,
      role: admin.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource.'
    });
  }
};

module.exports = {
  protectAdmin,
  getJwtSecret
};

