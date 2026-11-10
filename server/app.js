const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { getDatabaseStatus } = require('./config/database');
const { isCloudinaryConfigured } = require('./config/cloudinary');
const { sanitizeRequest } = require('./middleware/validationMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const { publicProductRouter, adminProductRouter } = require('./routes/productRoutes');
const { publicBrandRouter, adminBrandRouter } = require('./routes/brandRoutes');
const { publicCategoryRouter, adminCategoryRouter } = require('./routes/categoryRoutes');
const { publicAnalyticsRouter, adminAnalyticsRouter } = require('./routes/analyticsRoutes');
const { publicEnquiryRouter, adminEnquiryRouter } = require('./routes/enquiryRoutes');

const app = express();

// Trust proxy for Render / reverse proxy environments
app.set('trust proxy', 1);

// Security HTTP Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
  })
);

// CORS Configuration — Specific Production & Development Origins
const defaultAllowedOrigins = [
  'https://sriyashealthcare.com',
  'https://www.sriyashealthcare.com',
  'https://sriyashealthcare-website.sriyashealthcare.workers.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

const envOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow non-browser agents, server-to-server calls, or health probes (no Origin header)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      // Safely reject unauthorized origins without throwing an unhandled Express error (prevents HTTP 500)
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  })
);

// Body parsers & cookies
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use(sanitizeRequest);

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api', apiLimiter);

// Serve extracted static assets for local development or direct asset requests
const staticAssetsPath = path.join(__dirname, '..', 'client', 'public', 'assets');
app.use('/assets', express.static(staticAssetsPath));

// Health Check Endpoint (Required for Render deployment)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'Sriyas Healthcare Pvt. Ltd. API',
    timestamp: new Date().toISOString(),
    database: getDatabaseStatus(),
    cloudinaryConfigured: isCloudinaryConfigured()
  });
});

// Mount Public Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', publicProductRouter);
app.use('/api/brands', publicBrandRouter);
app.use('/api/categories', publicCategoryRouter);
app.use('/api/analytics', publicAnalyticsRouter);
app.use('/api/enquiries', publicEnquiryRouter);

// Mount Protected Administrator Routes
app.use('/api/admin/products', adminProductRouter);
app.use('/api/admin/brands', adminBrandRouter);
app.use('/api/admin/categories', adminCategoryRouter);
app.use('/api/admin/analytics', adminAnalyticsRouter);
app.use('/api/admin/enquiries', adminEnquiryRouter);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;

