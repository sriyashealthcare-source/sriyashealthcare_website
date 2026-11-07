const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  recordProductView,
  getAnalyticsOverview,
  getProductAnalytics,
  getBrandAnalytics,
  getCategoryAnalytics,
  getViewTrends,
  getRecentViews
} = require('../controllers/analyticsController');
const { protectAdmin } = require('../middleware/authMiddleware');

const viewTrackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

const publicAnalyticsRouter = express.Router();
publicAnalyticsRouter.post('/product-view', viewTrackingLimiter, recordProductView);

const adminAnalyticsRouter = express.Router();
adminAnalyticsRouter.use(protectAdmin);
adminAnalyticsRouter.get('/overview', getAnalyticsOverview);
adminAnalyticsRouter.get('/products', getProductAnalytics);
adminAnalyticsRouter.get('/brands', getBrandAnalytics);
adminAnalyticsRouter.get('/categories', getCategoryAnalytics);
adminAnalyticsRouter.get('/trends', getViewTrends);
adminAnalyticsRouter.get('/recent-views', getRecentViews);

module.exports = {
  publicAnalyticsRouter,
  adminAnalyticsRouter
};

