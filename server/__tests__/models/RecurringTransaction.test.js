import RecurringTransaction from '../../src/models/RecurringTransaction.js';
import Account from '../../src/models/Account.js';
import Category from '../../src/models/Category.js';
import User from '../../src/models/User.js';

describe('RecurringTransaction Model', () => {
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
      type: 'checking'
    });

    testCategory = await Category.create({
      user: testUser._id,
      name: 'Subscriptions',
      type: 'expense',
      icon: '📱'
    });
  });

  describe('RecurringTransaction Creation', () => {
    it('should create a monthly recurring transaction', async () => {
      const recurringData = {
        user: testUser._id,
        account: testAccount._id,
        category: testCategory._id,
        type: 'expense',
        amount: 9.99,
        description: 'Netflix subscription',
        frequency: 'monthly',
        interval: 1,
        startDate: new Date(),
        nextExecutionDate: new Date()
      };

      const recurring = await RecurringTransaction.create(recurringData);

      expect(recurring.frequency).toBe('monthly');
      expect(recurring.interval).toBe(1);
      expect(recurring.amount).toBe(9.99);
      expect(recurring.isActive).toBe(true);
    });

    it('should support different frequencies', async () => {
      const frequencies = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];

      for (const frequency of frequencies) {
        const recurring = await RecurringTransaction.create({
          user: testUser._id,
          account: testAccount._id,
          type: 'expense',
          amount: 10,
          description: `${frequency} transaction`,
          frequency,
          interval: 1,
          startDate: new Date(),
          nextExecutionDate: new Date()
        });

        expect(recurring.frequency).toBe(frequency);
      }
    });

    it('should require essential fields', async () => {
      const recurring = new RecurringTransaction({
        user: testUser._id,
        type: 'expense'
      });

      await expect(recurring.save()).rejects.toThrow();
    });
  });

  describe('End Conditions', () => {
    it('should support end date condition', async () => {
      const endDate = new Date('2025-12-31');
      const recurring = await RecurringTransaction.create({
        user: testUser._id,
        account: testAccount._id,
        type: 'expense',
        amount: 50,
        description: 'Limited subscription',
        frequency: 'monthly',
        interval: 1,
        startDate: new Date(),
        nextExecutionDate: new Date(),
        endDate
      });

      expect(recurring.endDate).toEqual(endDate);
    });

    it('should support maximum occurrences', async () => {
      const recurring = await RecurringTransaction.create({
        user: testUser._id,
        account: testAccount._id,
        type: 'expense',
        amount: 100,
        description: '12 month subscription',
        frequency: 'monthly',
        interval: 1,
        startDate: new Date(),
        nextExecutionDate: new Date(),
        endAfterOccurrences: 12
      });

      expect(recurring.endAfterOccurrences).toBe(12);
      expect(recurring.occurrenceCount).toBe(0);
    });
  });

  describe('Status Management', () => {
    it('should mark as active by default', async () => {
      const recurring = await RecurringTransaction.create({
        user: testUser._id,
        account: testAccount._id,
        type: 'expense',
        amount: 20,
        description: 'Test',
        frequency: 'monthly',
        interval: 1,
        startDate: new Date(),
        nextExecutionDate: new Date()
      });

      expect(recurring.isActive).toBe(true);
    });

    it('should allow pausing/resuming', async () => {
      const recurring = await RecurringTransaction.create({
        user: testUser._id,
        account: testAccount._id,
        type: 'expense',
        amount: 15,
        description: 'Test',
        frequency: 'weekly',
        interval: 1,
        startDate: new Date(),
        nextExecutionDate: new Date()
      });

      recurring.isActive = false;
      await recurring.save();
      expect(recurring.isActive).toBe(false);
    });
  });
});
