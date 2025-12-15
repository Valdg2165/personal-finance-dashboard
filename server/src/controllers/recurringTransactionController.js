import RecurringTransaction from '../models/RecurringTransaction.js';
import Account from '../models/Account.js';
import Category from '../models/Category.js';

// Calculate next execution date based on frequency
const calculateNextDate = (currentDate, frequency, interval = 1, dayOfMonth = null, dayOfWeek = null) => {
  const next = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;
    case 'weekly':
      next.setDate(next.getDate() + (7 * interval));
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + interval);
      if (dayOfMonth) {
        next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      }
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval);
      break;
  }
  
  return next;
};

// Get all recurring transactions for a user
export const getRecurringTransactions = async (req, res) => {
  try {
    const { active } = req.query;
    
    const filter = { user: req.user._id };
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }
    
    const recurring = await RecurringTransaction.find(filter)
      .populate('account', 'name type')
      .populate('category', 'name icon color')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: recurring.length,
      data: recurring
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single recurring transaction
export const getRecurringTransaction = async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('account', 'name type')
      .populate('category', 'name icon color');
    
    if (!recurring) {
      return res.status(404).json({ message: 'Recurring transaction not found' });
    }
    
    res.json({
      success: true,
      data: recurring
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create recurring transaction
export const createRecurringTransaction = async (req, res) => {
  try {
    const {
      accountId,
      categoryId,
      type,
      amount,
      currency,
      description,
      merchant,
      notes,
      tags,
      frequency,
      interval,
      dayOfMonth,
      dayOfWeek,
      startDate,
      endDate,
      endAfterOccurrences
    } = req.body;
    
    // Validate required fields
    if (!accountId || !type || !amount || !description || !frequency || !startDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Verify account belongs to user
    const account = await Account.findOne({ _id: accountId, user: req.user._id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Verify category if provided
    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId, user: req.user._id });
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
    }
    
    // Calculate next execution date
    const start = new Date(startDate);
    const nextExecution = calculateNextDate(start, frequency, interval, dayOfMonth, dayOfWeek);
    
    // Create recurring transaction
    const recurring = await RecurringTransaction.create({
      user: req.user._id,
      account: accountId,
      category: categoryId || null,
      type,
      amount: Math.abs(amount),
      currency: currency || account.currency || 'EUR',
      description,
      merchant: merchant ? { name: merchant } : undefined,
      notes,
      tags,
      frequency,
      interval: interval || 1,
      dayOfMonth,
      dayOfWeek,
      startDate: start,
      endDate: endDate ? new Date(endDate) : undefined,
      endAfterOccurrences,
      nextExecutionDate: nextExecution
    });
    
    // Populate and return
    const populatedRecurring = await RecurringTransaction.findById(recurring._id)
      .populate('account', 'name type')
      .populate('category', 'name icon color');
    
    res.status(201).json({
      success: true,
      data: populatedRecurring
    });
  } catch (error) {
    console.error('Create recurring transaction error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update recurring transaction
export const updateRecurringTransaction = async (req, res) => {
  try {
    const {
      accountId,
      categoryId,
      type,
      amount,
      description,
      merchant,
      notes,
      tags,
      frequency,
      interval,
      dayOfMonth,
      dayOfWeek,
      startDate,
      endDate,
      endAfterOccurrences,
      isActive
    } = req.body;
    
    const recurring = await RecurringTransaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!recurring) {
      return res.status(404).json({ message: 'Recurring transaction not found' });
    }
    
    // Update fields
    if (accountId) {
      const account = await Account.findOne({ _id: accountId, user: req.user._id });
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }
      recurring.account = accountId;
    }
    
    if (categoryId !== undefined) recurring.category = categoryId || null;
    if (type) recurring.type = type;
    if (amount !== undefined) recurring.amount = Math.abs(amount);
    if (description) recurring.description = description;
    if (merchant !== undefined) recurring.merchant = merchant ? { name: merchant } : undefined;
    if (notes !== undefined) recurring.notes = notes;
    if (tags !== undefined) recurring.tags = tags;
    if (frequency) recurring.frequency = frequency;
    if (interval !== undefined) recurring.interval = interval;
    if (dayOfMonth !== undefined) recurring.dayOfMonth = dayOfMonth;
    if (dayOfWeek !== undefined) recurring.dayOfWeek = dayOfWeek;
    if (startDate) recurring.startDate = new Date(startDate);
    if (endDate !== undefined) recurring.endDate = endDate ? new Date(endDate) : null;
    if (endAfterOccurrences !== undefined) recurring.endAfterOccurrences = endAfterOccurrences;
    if (isActive !== undefined) recurring.isActive = isActive;
    
    // Recalculate next execution date if frequency changed
    if (frequency || interval || dayOfMonth || dayOfWeek) {
      const lastExec = recurring.lastExecutionDate || recurring.startDate;
      recurring.nextExecutionDate = calculateNextDate(
        lastExec,
        recurring.frequency,
        recurring.interval,
        recurring.dayOfMonth,
        recurring.dayOfWeek
      );
    }
    
    await recurring.save();
    
    // Populate and return
    const populatedRecurring = await RecurringTransaction.findById(recurring._id)
      .populate('account', 'name type')
      .populate('category', 'name icon color');
    
    res.json({
      success: true,
      data: populatedRecurring
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete recurring transaction (soft delete)
export const deleteRecurringTransaction = async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
      { new: true }
    );
    
    if (!recurring) {
      return res.status(404).json({ message: 'Recurring transaction not found' });
    }
    
    res.json({
      success: true,
      message: 'Recurring transaction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Pause/Resume recurring transaction
export const toggleRecurringTransaction = async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!recurring) {
      return res.status(404).json({ message: 'Recurring transaction not found' });
    }
    
    recurring.isActive = !recurring.isActive;
    await recurring.save();
    
    res.json({
      success: true,
      data: recurring,
      message: recurring.isActive ? 'Recurring transaction resumed' : 'Recurring transaction paused'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { calculateNextDate };
