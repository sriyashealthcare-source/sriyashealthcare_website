const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      unique: true
    },
    slug: {
      type: String,
      required: [true, 'Brand slug is required'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true
    },
    tabLabel: {
      type: String,
      trim: true,
      default: ''
    },
    icon: {
      type: String,
      trim: true,
      default: '🔬'
    },
    logoUrl: {
      type: String,
      trim: true,
      default: ''
    },
    logoPublicId: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
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

brandSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('Brand', brandSchema);

