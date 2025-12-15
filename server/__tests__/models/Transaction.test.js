import Transaction from '../../src/models/Transaction.js';
import Account from '../../src/models/Account.js';
import Category from '../../src/models/Category.js';
import User from '../../src/models/User.js';

describe('Transaction Model', () => {
  let testUser, testAccount, testCategory;

  beforeEach(async () => {
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123'
    });

    testAccount = await Account.create({
      user: testUser._id,
      name: 'Test Account',
      type: 'checking',
      balance: 1000
    });

    testCategory = await Category.create({
      user: testUser._id,
      name: 'Food',
      type: 'expense',
      icon: '🍔'
    });
  });

  describe('Transaction Creation', () => {
    it('should create a valid expense transaction', async () => {
      const transactionData = {
        user: testUser._id,
        account: testAccount._id,
        category: testCategory._id,
        type: 'expense',
        amount: 50.00,
        description: 'Grocery shopping',
        date: new Date()
      };

      const transaction = await Transaction.create(transactionData);

      expect(transaction.type).toBe('expense');
      expect(transaction.amount).toBe(50);
      expect(transaction.description).toBe('Grocery shopping');
    });

    it('should create a valid income transaction', async () => {
      const incomeCategory = await Category.create({
        user: testUser._id,
        name: 'Salary',
        type: 'income',
        icon: '💰'
      });

      const transaction = await Transaction.create({
        user: testUser._id,
        account: testAccount._id,
        category: incomeCategory._id,
        type: 'income',
        amount: 3000,
        description: 'Monthly salary'
      });

      expect(transaction.type).toBe('income');
      expect(transaction.amount).toBe(3000);
    });

    it('should require essential fields', async () => {
      const transaction = new Transaction({
        user: testUser._id,
        type: 'expense'
      });

      await expect(transaction.save()).rejects.toThrow();
    });

    it('should use default currency', async () => {
      const transaction = await Transaction.create({
        user: testUser._id,
        account: testAccount._id,
        type: 'expense',
        amount: 25,
        description: 'Test'
      });

      expect(transaction.currency).toBe('EUR');
    });
  });

  describe('Transaction Fields', () => {
    it('should store merchant information', async () => {
      const transaction = await Transaction.create({
        user: testUser._id,
        account: testAccount._id,
        type: 'expense',
        amount: 35,
        description: 'Coffee',
        merchant: {
          name: 'Starbucks',
          normalized: 'starbucks'
        }
      });

      expect(transaction.merchant.name).toBe('Starbucks');
    });

    it('should store tags', async () => {
      const transaction = await Transaction.create({
        user: testUser._id,
        account: testAccount._id,
        type: 'expense',
        amount: 100,
        description: 'Business lunch',
        tags: ['business', 'client', 'deductible']
      });

      expect(transaction.tags).toHaveLength(3);
      expect(transaction.tags).toContain('business');
    });

    it('should mark recurring transactions', async () => {
      const transaction = await Transaction.create({
        user: testUser._id,
        account: testAccount._id,
        type: 'expense',
        amount: 15,
        description: 'Netflix',
        isRecurring: true
      });

      expect(transaction.isRecurring).toBe(true);
    });
  });
});
