const mongoose = require('mongoose');

const adminNoteSchema = new mongoose.Schema(
  {
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerEnquiry',
      required: true,
      index: true
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    adminName: {
      type: String,
      default: 'Administrator',
      trim: true
    },
    note: {
      type: String,
      required: [true, 'Note text is required'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

adminNoteSchema.index({ enquiryId: 1, createdAt: -1 });

module.exports = mongoose.model('AdminNote', adminNoteSchema);

