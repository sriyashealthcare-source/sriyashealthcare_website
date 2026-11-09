const mongoose = require('mongoose');

const analyticsSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    visitorId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    landingPage: {
      type: String,
      default: '/'
    },
    exitPage: {
      type: String,
      default: '/'
    },
    pageViewsCount: {
      type: Number,
      default: 1
    },
    referrer: {
      type: String,
      default: 'direct'
    },
    trafficType: {
      type: String,
      enum: ['direct', 'organic_search', 'referral', 'social', 'campaign'],
      default: 'direct',
      index: true
    },
    utmSource: {
      type: String,
      default: ''
    },
    utmMedium: {
      type: String,
      default: ''
    },
    utmCampaign: {
      type: String,
      default: ''
    },
    utmTerm: {
      type: String,
      default: ''
    },
    utmContent: {
      type: String,
      default: ''
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
    country: {
      type: String,
      default: 'India'
    }
  },
  {
    timestamps: true
  }
);

analyticsSessionSchema.index({ startedAt: -1, visitorId: 1 });
analyticsSessionSchema.index({ trafficType: 1, startedAt: -1 });
analyticsSessionSchema.index({ deviceCategory: 1, startedAt: -1 });

module.exports = mongoose.model('AnalyticsSession', analyticsSessionSchema);

