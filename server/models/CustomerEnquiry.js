const mongoose = require('mongoose');

const customerEnquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true
    },
    company: {
      type: String,
      trim: true,
      default: ''
    },
    productOfInterest: {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null
      },
      productName: {
        type: String,
        trim: true,
        default: ''
      },
      productSlug: {
        type: String,
        trim: true,
        default: ''
      }
    },
    subject: {
      type: String,
      trim: true,
      default: 'General Product & Healthcare Solutions Enquiry'
    },
    message: {
      type: String,
      required: [true, 'Enquiry message is required'],
      trim: true
    },
    sourcePage: {
      type: String,
      trim: true,
      default: '/contact'
    },
    visitorSessionId: {
      type: String,
      trim: true,
      default: '',
      index: true
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'follow_up', 'resolved', 'closed'],
      default: 'new',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true
    },
    ipHash: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

customerEnquirySchema.index({ createdAt: -1, status: 1 });
customerEnquirySchema.index({ 'productOfInterest.productId': 1, createdAt: -1 });
customerEnquirySchema.index({
  name: 'text',
  email: 'text',
  phone: 'text',
  company: 'text',
  message: 'text'
});

module.exports = mongoose.model('CustomerEnquiry', customerEnquirySchema);

