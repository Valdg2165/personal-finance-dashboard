import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['checking', 'savings', 'credit', 'investment', 'cash'],
      default: 'checking',
    },
    currency: {
      type: String,
      default: 'EUR',
    },
    balance: {
      type: Number,
      default: 0,
    },
    // External connection fields
    externalId: {
      type: String,
      sparse: true,
    },
    externalProvider: {
      type: String,
      enum: ['truelayer', 'manual'],
      default: 'manual',
    },
    externalToken: {
      type: String,
      select: false, // Don't include by default for security
    },
    externalRefreshToken: {
      type: String,
      select: false,
    },
    institution: {
      name: String,
      logo: String,
    },
    lastSyncedAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index - only enforce uniqueness when externalId exists (for bank-connected accounts)
// Using partialFilterExpression to exclude null values
accountSchema.index(
  { user: 1, externalId: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { externalId: { $type: 'string' } }
  }
);

export default mongoose.model('Account', accountSchema);