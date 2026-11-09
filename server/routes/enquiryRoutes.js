const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  submitCustomerEnquiry,
  getAdminEnquiries,
  getAdminEnquiryById,
  updateEnquiryStatus,
  addAdminNote,
  exportEnquiriesCsv
} = require('../controllers/enquiryController');
const { protectAdmin } = require('../middleware/authMiddleware');

const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: {
    success: false,
    message: 'Too many enquiry submissions from this connection. Please try again later.'
  }
});

const publicEnquiryRouter = express.Router();
publicEnquiryRouter.post('/', enquiryLimiter, submitCustomerEnquiry);

const adminEnquiryRouter = express.Router();
adminEnquiryRouter.use(protectAdmin);
adminEnquiryRouter.get('/', getAdminEnquiries);
adminEnquiryRouter.get('/export', exportEnquiriesCsv);
adminEnquiryRouter.get('/:id', getAdminEnquiryById);
adminEnquiryRouter.patch('/:id/status', updateEnquiryStatus);
adminEnquiryRouter.post('/:id/notes', addAdminNote);

module.exports = {
  publicEnquiryRouter,
  adminEnquiryRouter
};

