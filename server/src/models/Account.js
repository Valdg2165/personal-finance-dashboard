import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['checking', 'savings', 'credit', 'investment', 'cash', 'other'],
    default: 'checking'
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  balance: {
    type: Number,
    default: 0
  },
  institution: {
    name: String,
    logo: String
  },
  // For GoCardless integration later
  externalId: String,
  externalProvider: {
    type: String,
    enum: ['gocardless', 'manual'],
    default: 'manual'
  },
  lastSyncedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
accountSchema.index({ user: 1, isActive: 1 });

export default mongoose.model('Account', accountSchema);