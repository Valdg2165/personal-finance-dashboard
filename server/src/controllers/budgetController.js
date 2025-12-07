import Budget from '../models/Budget.js';
import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';

// Helper function to calculate spent amount for a budget
const calculateBudgetSpent = async (budget) => {
  try {
    // For Global category, sum all expense transactions in the period
    const categoryDoc = await Category.findById(budget.category);
    
    let query = {
      user: budget.user,
      type: 'expense',
      date: {
        $gte: budget.startDate,
        $lte: budget.endDate || new Date()
      }
    };

    // If not Global category, filter by category NAME (not ID) to handle different category IDs
    if (categoryDoc && categoryDoc.name !== 'Global') {
      // Find all categories with the same name for this user
      const userCategories = await Category.find({ 
        user: budget.user, 
        name: categoryDoc.name 
      });
      const categoryIds = userCategories.map(c => c._id);
      query.category = { $in: categoryIds };
    }

    const transactions = await Transaction.find(query);
    const spent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return spent;
  } catch (error) {
    console.error('Error calculating budget spent:', error);
    return 0;
  }
};

// Create a new budget
export const createBudget = async (req, res) => {
  try {
    const { category, amount, period, startDate: startDateInput } = req.body;

    // Find category by name
    let categoryDoc = await Category.findOne({ name: category });
    
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Category not found' });
    }

    // Calculate dates based on period (in months)
    const startDate = startDateInput ? new Date(startDateInput) : new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + parseInt(period));

    const budget = new Budget({
      user: req.user.id,
      category: categoryDoc._id,
      amount: parseFloat(amount),
      period: parseInt(period) >= 12 ? 'yearly' : 'monthly',
      startDate,
      endDate,
      isActive: true
    });

    await budget.save();
    
    // Populate category before sending response
    await budget.populate('category');

    res.status(201).json(budget);
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all budgets for the authenticated user
export const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id })
      .populate('category')
      .sort({ createdAt: -1 });

    // Calculate spent amount for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await calculateBudgetSpent(budget);
        return {
          ...budget.toObject(),
          spent,
          remaining: budget.amount - spent
        };
      })
    );

    res.json(budgetsWithSpent);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a budget
export const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, period, isActive, startDate: startDateInput } = req.body;

    const budget = await Budget.findOne({ _id: id, user: req.user.id });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    if (category) {
      const categoryDoc = await Category.findOne({ name: category });
      if (!categoryDoc) {
        return res.status(400).json({ message: 'Category not found' });
      }
      budget.category = categoryDoc._id;
    }

    if (amount !== undefined) budget.amount = parseFloat(amount);
    
    // Update startDate if provided
    if (startDateInput !== undefined) {
      budget.startDate = new Date(startDateInput);
    }
    
    if (period !== undefined) {
      const periodMonths = parseInt(period);
      budget.period = periodMonths >= 12 ? 'yearly' : 'monthly';
      budget.endDate = new Date(budget.startDate);
      budget.endDate.setMonth(budget.endDate.getMonth() + periodMonths);
    }

    if (isActive !== undefined) budget.isActive = isActive;

    await budget.save();
    await budget.populate('category');

    res.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a budget
export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findOneAndDelete({ _id: id, user: req.user.id });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
