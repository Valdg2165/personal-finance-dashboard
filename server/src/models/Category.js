import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
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
    enum: ['income', 'expense'],
    required: true
  },
  icon: String,
  color: String,
  isDefault: {
    type: Boolean,
    default: false
  },
  budgetOnly: {
    type: Boolean,
    default: false
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for user + type queries
categorySchema.index({ user: 1, type: 1 });

export default mongoose.model('Category', categorySchema);
