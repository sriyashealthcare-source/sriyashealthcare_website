const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    format: { type: String, default: 'webp' },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    bytes: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false }
  },
  { _id: false }
);

const specificationSchema = new mongoose.Schema(
  {
    name: { type: String, default: '', trim: true },
    value: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    legacyId: {
      type: String,
      trim: true,
      index: true,
      default: ''
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand reference is required'],
      index: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true
    },
    cardCategory: {
      type: String,
      trim: true,
      default: ''
    },
    detailCategory: {
      type: String,
      trim: true,
      default: ''
    },
    shortSpecification: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    images: {
      type: [imageSchema],
      default: []
    },
    cardBg: {
      type: String,
      trim: true,
      default: ''
    },
    features: {
      type: [String],
      default: []
    },
    specifications: {
      type: [specificationSchema],
      default: []
    },
    applications: {
      type: [String],
      default: []
    },
    brochure: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      filename: { type: String, default: '' },
      format: { type: String, default: 'pdf' },
      bytes: { type: Number, default: 0 }
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true
    },
    viewCount: {
      type: Number,
      default: 0,
      index: true
    },
    lastViewedAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({ isActive: 1, deletedAt: 1, brand: 1, category: 1, displayOrder: 1 });
productSchema.index({ name: 'text', shortSpecification: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);

