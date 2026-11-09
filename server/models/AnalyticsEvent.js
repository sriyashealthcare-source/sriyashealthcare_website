const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema(
  {
    eventId: {
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
    sessionId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    eventType: {
      type: String,
      enum: ['page_view', 'product_view', 'category_view', 'brochure_download', 'enquiry_submit', 'contact_click'],
      required: true,
      index: true
    },
    pagePath: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    pageTitle: {
      type: String,
      default: '',
      trim: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true
    },
    productNameSnapshot: {
      type: String,
      default: '',
      trim: true
    },
    productSlugSnapshot: {
      type: String,
      default: '',
      trim: true
    },
    brandNameSnapshot: {
      type: String,
      default: '',
      trim: true
    },
    categoryNameSnapshot: {
      type: String,
      default: '',
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

analyticsEventSchema.index({ timestamp: -1, eventType: 1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: 1 });
analyticsEventSchema.index({ visitorId: 1, timestamp: -1 });
analyticsEventSchema.index({ productId: 1, timestamp: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);

