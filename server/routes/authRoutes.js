const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  loginAdmin,
  logoutAdmin,
  getCurrentAdmin,
  updateAdminProfile,
  updateAdminPassword
} = require('../controllers/authController');
const { protectAdmin } = require('../middleware/authMiddleware');
const { validateLoginInput } = require('../middleware/validationMiddleware');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

router.post('/login', loginLimiter, validateLoginInput, loginAdmin);
router.post('/logout', logoutAdmin);
router.get('/me', protectAdmin, getCurrentAdmin);
router.put('/profile', protectAdmin, updateAdminProfile);
router.put('/password', protectAdmin, updateAdminPassword);

module.exports = router;

