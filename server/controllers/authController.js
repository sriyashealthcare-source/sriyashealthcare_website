const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const { getJwtSecret } = require('../middleware/authMiddleware');

const createToken = (adminId) => {
  return jwt.sign({ id: String(adminId) }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
};

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: '/'
  };
};

// POST /api/auth/login
const loginAdmin = async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    const admin = await Admin.findOne({ email });
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    await Admin.findByIdAndUpdate(admin._id, {
      $set: { lastLoginAt: new Date() }
    });

    const token = createToken(admin._id);
    res.cookie('sriyas_admin_token', token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      admin: {
        id: String(admin._id),
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logoutAdmin = async (req, res, next) => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('sriyas_admin_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/'
    });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getCurrentAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Administrator account not found.'
      });
    }

    res.status(200).json({
      success: true,
      admin: {
        id: String(admin._id),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/profile
const updateAdminProfile = async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required.'
      });
    }

    const existing = await Admin.findOne({ email });
    if (existing && String(existing._id) !== String(req.admin.id)) {
      return res.status(409).json({
        success: false,
        message: 'That email address is already in use.'
      });
    }

    const updated = await Admin.findByIdAndUpdate(
      req.admin.id,
      { $set: { name, email } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Administrator profile updated successfully.',
      admin: {
        id: String(updated._id),
        name: updated.name,
        email: updated.email,
        role: updated.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/password
const updateAdminPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.'
      });
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrator not found.'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await Admin.findByIdAndUpdate(admin._id, {
      $set: { passwordHash }
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  logoutAdmin,
  getCurrentAdmin,
  updateAdminProfile,
  updateAdminPassword
};

