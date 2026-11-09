const mongoose = require('mongoose');

const analyticsVisitorSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    firstVisitAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    lastVisitAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    sessionCount: {
      type: Number,
      default: 1
    },
    totalPageViews: {
      type: Number,
      default: 1
    },
    totalProductViews: {
      type: Number,
      default: 0
    },
    deviceCategory: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'desktop',
      index: true
    },
    browser: {
      type: String,
      default: 'Unknown'
    },
    os: {
      type: String,
      default: 'Unknown'
    },
    initialReferrer: {
      type: String,
      default: 'direct'
    },
    initialLandingPage: {
      type: String,
      default: '/'
    }
  },
  {
    timestamps: true
  }
);

analyticsVisitorSchema.index({ lastVisitAt: -1, sessionCount: -1 });

module.exports = mongoose.model('AnalyticsVisitor', analyticsVisitorSchema);

