import multer from 'multer';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import Category from '../models/Category.js';
import {
  parseCSV,
  parseExcel,
  detectBankFormat,
  normalizeRevolutTransaction,
  normalizeGenericTransaction,
  generateImportHash
} from '../utils/fileParser.js';
import { autoCategories } from '../utils/categorization.js';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

export const uploadMiddleware = upload.single('file');

// Import transactions from file
export const importTransactions = async (req, res) => {
  try {
    const { accountId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Verify account belongs to user
    const account = await Account.findOne({ _id: accountId, user: req.user._id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Parse file based on type
    let rawData;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    
    if (fileExtension === 'csv') {
      rawData = await parseCSV(req.file.buffer);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      rawData = await parseExcel(req.file.buffer); // Added await
    } else {
      return res.status(400).json({ message: 'Unsupported file format' });
    }

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ message: 'No data found in file' });
    }

    // Detect bank format
    const headers = Object.keys(rawData[0]);
    const bankFormat = detectBankFormat(headers);
    
    // Get user's categories for auto-categorization
    const categories = await Category.find({ user: req.user._id });

    // Normalize and process transactions
    const transactions = [];
    const duplicates = [];
    const errors = [];

    for (const row of rawData) {
      try {
        // Normalize based on bank format
        let normalized;
        if (bankFormat === 'revolut') {
          normalized = normalizeRevolutTransaction(row);
        } else {
          normalized = normalizeGenericTransaction(row);
        }

        // Validate date
        if (!normalized.date || isNaN(normalized.date.getTime())) {
          errors.push({ row, error: 'Invalid date' });
          continue;
        }

        // Generate hash for deduplication
        const importHash = generateImportHash(normalized);

        // Check for duplicates
        const existingTransaction = await Transaction.findOne({
          user: req.user._id,
          importHash
        });

        if (existingTransaction) {
          duplicates.push(normalized);
          continue;
        }

        // Auto-categorize
        const categorization = await autoCategories(normalized, categories);

        // Create transaction object
        transactions.push({
          user: req.user._id,
          account: accountId,
          category: categorization.category,
          type: normalized.type,
          amount: normalized.amount,
          currency: normalized.currency,
          date: normalized.date,
          description: normalized.description,
          merchant: normalized.merchant,
          importHash,
          categoryConfidence: categorization.confidence
        });
      } catch (err) {
        errors.push({ row, error: err.message });
      }
    }

    // Bulk insert transactions
    let insertedTransactions = [];
    if (transactions.length > 0) {
      insertedTransactions = await Transaction.insertMany(transactions);
      
      // Update account balance
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      account.balance = account.balance + totalIncome - totalExpense;
      await account.save();
    }

    res.json({
      success: true,
      message: `Successfully imported ${insertedTransactions.length} transactions`,
      data: {
        imported: insertedTransactions.length,
        duplicates: duplicates.length,
        errors: errors.length,
        accountBalance: account.balance
      },
      details: {
        duplicates: duplicates.slice(0, 5),
        errors: errors.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all transactions
export const getTransactions = async (req, res) => {
  try {
    const { accountId, startDate, endDate, category, type } = req.query;
    
    const filter = { user: req.user._id };
    
    if (accountId) filter.account = accountId;
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate('account', 'name type')
      .populate('category', 'name icon color')
      .sort('-date')
      .limit(100);

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single transaction
export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('account', 'name type')
      .populate('category', 'name icon color');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update transaction (mainly for recategorization)
export const updateTransaction = async (req, res) => {
  try {
    const { category, notes, tags, description, amount, date } = req.body;

    const updateData = { categoryConfidence: 1.0 }; // Manual categorization = 100% confidence
    
    if (category) updateData.category = category;
    if (notes !== undefined) updateData.notes = notes;
    if (tags !== undefined) updateData.tags = tags;
    if (description) updateData.description = description;
    if (amount) updateData.amount = amount;
    if (date) updateData.date = date;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('account', 'name type')
      .populate('category', 'name icon color');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete transaction
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update account balance
    const account = await Account.findById(transaction.account);
    if (account) {
      if (transaction.type === 'income') {
        account.balance -= transaction.amount;
      } else {
        account.balance += transaction.amount;
      }
      await account.save();
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};