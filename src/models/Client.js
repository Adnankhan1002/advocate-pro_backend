const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    alternatePhone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    dateOfBirth: Date,
    aadharNumber: String,
    panNumber: String,
    category: {
      type: String,
      enum: ['individual', 'corporate', 'organization'],
      default: 'individual',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    notes: String,
    customFields: mongoose.Schema.Types.Mixed, // For tenant-specific fields
    // Financial tracking
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountRemaining: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for full name
clientSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook to calculate amountRemaining
clientSchema.pre('save', function (next) {
  if (this.isModified('totalAmount') || this.isModified('amountPaid')) {
    this.amountRemaining = Math.max(0, this.totalAmount - this.amountPaid);
  }
  next();
});

// Compound index for tenant and email uniqueness
clientSchema.index({ tenantId: 1, email: 1 }, { sparse: true });
clientSchema.index({ tenantId: 1, phone: 1 });
clientSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Client', clientSchema);
