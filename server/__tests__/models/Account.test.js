import Account from '../../src/models/Account.js';
import User from '../../src/models/User.js';

describe('Account Model', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123'
    });
  });

  describe('Account Creation', () => {
    it('should create a valid account', async () => {
      const accountData = {
        user: testUser._id,
        name: 'Main Checking',
        type: 'checking',
        currency: 'USD',
        balance: 1000
      };

      const account = await Account.create(accountData);

      expect(account.name).toBe(accountData.name);
      expect(account.type).toBe(accountData.type);
      expect(account.currency).toBe(accountData.currency);
      expect(account.balance).toBe(accountData.balance);
      expect(account.isActive).toBe(true);
    });

    it('should use default values', async () => {
      const account = await Account.create({
        user: testUser._id,
        name: 'Test Account'
      });

      expect(account.type).toBe('checking');
      expect(account.balance).toBe(0);
      expect(account.isActive).toBe(true);
    });

    it('should require user and name', async () => {
      const account = new Account({
        type: 'savings'
      });

      await expect(account.save()).rejects.toThrow();
    });

    it('should validate account type', async () => {
      await expect(
        Account.create({
          user: testUser._id,
          name: 'Invalid Account',
          type: 'invalid_type'
        })
      ).rejects.toThrow();
    });
  });

  describe('Multiple Accounts', () => {
    it('should allow same user to create multiple accounts', async () => {
      await Account.create({
        user: testUser._id,
        name: 'Checking',
        type: 'checking'
      });

      await Account.create({
        user: testUser._id,
        name: 'Savings',
        type: 'savings'
      });

      const accounts = await Account.find({ user: testUser._id });
      expect(accounts).toHaveLength(2);
    });

    it('should not enforce unique externalId for null values', async () => {
      // This tests the fix we implemented for the duplicate key error
      await Account.create({
        user: testUser._id,
        name: 'Account 1',
        externalId: null
      });

      await Account.create({
        user: testUser._id,
        name: 'Account 2',
        externalId: null
      });

      const accounts = await Account.find({ user: testUser._id });
      expect(accounts).toHaveLength(2);
    });
  });
});
