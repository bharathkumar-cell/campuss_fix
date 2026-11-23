const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true
    },
    oldStatus: {
      type: String,
      enum: ['reported', 'assigned', 'in_progress', 'resolved', 'verified', 'closed', 'reopened', null, ''],
      default: null
    },
    newStatus: {
      type: String,
      required: true,
      enum: ['reported', 'assigned', 'in_progress', 'resolved', 'verified', 'closed', 'reopened']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    changedByName: {
      type: String,
      default: 'System'
    },
    changedByRole: {
      type: String,
      default: 'system'
    },
    note: {
      type: String,
      trim: true,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

module.exports = mongoose.model('StatusHistory', statusHistorySchema);
