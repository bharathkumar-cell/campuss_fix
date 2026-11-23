const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a complaint title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    building: {
      type: String,
      required: [true, 'Please provide the building/hostel name'],
      trim: true
    },
    block: {
      type: String,
      trim: true,
      default: ''
    },
    floor: {
      type: String,
      trim: true,
      default: ''
    },
    roomArea: {
      type: String,
      trim: true,
      default: ''
    },
    location: {
      type: String,
      required: [true, 'Please describe the specific location'],
      trim: true
    },
    attachments: [
      {
        type: String,
        trim: true
      }
    ],
    reporterType: {
      type: String,
      enum: ['student', 'guest'],
      default: 'student'
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    guestContact: {
      name: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' }
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    status: {
      type: String,
      enum: ['reported', 'assigned', 'in_progress', 'resolved', 'verified', 'closed', 'reopened'],
      default: 'reported',
      index: true
    },
    resolutionDescription: {
      type: String,
      trim: true,
      default: ''
    },
    resolutionProof: {
      type: String,
      trim: true,
      default: ''
    },
    reopenReason: {
      type: String,
      trim: true,
      default: ''
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Auto-generate human-readable Complaint ID (e.g. CMP-2026-00001)
complaintSchema.pre('save', async function (next) {
  if (!this.complaintId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Complaint').countDocuments();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const seq = String(count + 1).padStart(4, '0');
    this.complaintId = `CMP-${year}-${seq}-${randomSuffix.toString().slice(-2)}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
