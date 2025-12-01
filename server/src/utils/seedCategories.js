import Category from '../models/Category.js';

const defaultCategories = [
  // Income categories
  { name: 'Salary', type: 'income', icon: '💼', color: '#10b981' },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#059669' },
  { name: 'Investment', type: 'income', icon: '📈', color: '#34d399' },
  { name: 'Other Income', type: 'income', icon: '💰', color: '#6ee7b7' },
  
  // Expense categories
  { name: 'Housing', type: 'expense', icon: '🏠', color: '#ef4444' },
  { name: 'Transportation', type: 'expense', icon: '🚗', color: '#f97316' },
  { name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#f59e0b' },
  { name: 'Groceries', type: 'expense', icon: '🛒', color: '#eab308' },
  { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#a855f7' },
  { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#ec4899' },
  { name: 'Health & Fitness', type: 'expense', icon: '💪', color: '#14b8a6' },
  { name: 'Utilities', type: 'expense', icon: '💡', color: '#06b6d4' },
  { name: 'Insurance', type: 'expense', icon: '🛡️', color: '#3b82f6' },
  { name: 'Education', type: 'expense', icon: '📚', color: '#6366f1' },
  { name: 'Subscriptions', type: 'expense', icon: '📱', color: '#8b5cf6' },
  { name: 'Travel', type: 'expense', icon: '✈️', color: '#d946ef' },
  { name: 'Other Expense', type: 'expense', icon: '💸', color: '#64748b' }
];

export const seedDefaultCategories = async (userId) => {
  try {
    const categories = defaultCategories.map(cat => ({
      ...cat,
      user: userId,
      isDefault: true
    }));

    await Category.insertMany(categories);
    console.log('✅ Default categories created');
  } catch (error) {
    console.error('Error seeding categories:', error.message);
  }
};
