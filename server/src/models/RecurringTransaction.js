import mongoose from 'mongoose';

const recurringTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  merchant: {
    name: String
  },
  notes: String,
  tags: [String],
  
  // Recurring-specific fields
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  interval: {
    type: Number,
    default: 1,
    min: 1
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  endAfterOccurrences: {
    type: Number,
    min: 1
  },
  nextExecutionDate: {
    type: Date,
    required: true
  },
  lastExecutionDate: {
    type: Date
  },
  occurrenceCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes
recurringTransactionSchema.index({ user: 1, isActive: 1, nextExecutionDate: 1 });
recurringTransactionSchema.index({ user: 1, account: 1 });

export default mongoose.model('RecurringTransaction', recurringTransactionSchema);
