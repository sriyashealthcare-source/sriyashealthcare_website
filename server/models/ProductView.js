const mongoose = require('mongoose');

const productViewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    productSlug: {
      type: String,
      trim: true,
      default: ''
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
      index: true
    },
    brandName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    visitorSessionId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    source: {
      type: String,
      trim: true,
      default: 'direct'
    }
  },
  {
    timestamps: false
  }
);

productViewSchema.index({ viewedAt: -1, productId: 1 });
productViewSchema.index({ productId: 1, visitorSessionId: 1, viewedAt: -1 });
productViewSchema.index({ brandName: 1, viewedAt: -1 });
productViewSchema.index({ categoryName: 1, viewedAt: -1 });

module.exports = mongoose.model('ProductView', productViewSchema);

