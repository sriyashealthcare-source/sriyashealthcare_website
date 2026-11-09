const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
      index: true
    },
    heroTitle: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    heroGradient: {
      type: String,
      trim: true,
      default: 'linear-gradient(135deg,#1a3a5c,#2d6b9e)'
    },
    heroImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      format: { type: String, default: 'webp' },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 }
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

categorySchema.index({ brand: 1, isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);

