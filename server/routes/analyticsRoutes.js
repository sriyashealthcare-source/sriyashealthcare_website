const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  startAnalyticsSession,
  recordAnalyticsEvent,
  recordProductView,
  getAnalyticsOverview,
  getVisitorsList,
  getVisitorJourneys,
  getTrafficSources,
  getDeviceAnalytics,
  getReports,
  getProductAnalytics,
  getBrandAnalytics,
  getCategoryAnalytics,
  getViewTrends,
  getRecentViews
} = require('../controllers/analyticsController');
const { protectAdmin } = require('../middleware/authMiddleware');

const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});

const publicAnalyticsRouter = express.Router();
publicAnalyticsRouter.post('/session', trackingLimiter, startAnalyticsSession);
publicAnalyticsRouter.post('/event', trackingLimiter, recordAnalyticsEvent);
publicAnalyticsRouter.post('/product-view', trackingLimiter, recordProductView);

const adminAnalyticsRouter = express.Router();
adminAnalyticsRouter.use(protectAdmin);
adminAnalyticsRouter.get('/overview', getAnalyticsOverview);
adminAnalyticsRouter.get('/visitors', getVisitorsList);
adminAnalyticsRouter.get('/journeys', getVisitorJourneys);
adminAnalyticsRouter.get('/traffic-sources', getTrafficSources);
adminAnalyticsRouter.get('/devices', getDeviceAnalytics);
adminAnalyticsRouter.get('/reports', getReports);
adminAnalyticsRouter.get('/products', getProductAnalytics);
adminAnalyticsRouter.get('/brands', getBrandAnalytics);
adminAnalyticsRouter.get('/categories', getCategoryAnalytics);
adminAnalyticsRouter.get('/trends', getViewTrends);
adminAnalyticsRouter.get('/recent-views', getRecentViews);

module.exports = {
  publicAnalyticsRouter,
  adminAnalyticsRouter
};
