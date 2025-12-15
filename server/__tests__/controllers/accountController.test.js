import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/authRoutes.js';
import accountRoutes from '../../src/routes/accountRoutes.js';
import User from '../../src/models/User.js';
import Account from '../../src/models/Account.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);

describe('Account Controller', () => {
  let token, userId;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        gdprConsent: true
      });

    token = response.body.token;
    userId = response.body.user.id;
  });

  describe('POST /api/accounts', () => {
    it('should create a new account', async () => {
      const accountData = {
        name: 'Main Checking',
        type: 'checking',
        currency: 'USD',
        balance: 1000
      };

      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send(accountData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(accountData.name);
      expect(response.body.data.type).toBe(accountData.type);
      expect(response.body.data.balance).toBe(accountData.balance);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/accounts')
        .send({ name: 'Test Account' })
        .expect(401);
    });

    it('should create multiple accounts with null externalId', async () => {
      await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Account 1', type: 'checking' })
        .expect(201);

      await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Account 2', type: 'savings' })
        .expect(201);

      const accounts = await Account.find({ user: userId });
      expect(accounts).toHaveLength(2);
    });
  });

  describe('GET /api/accounts', () => {
    beforeEach(async () => {
      await Account.create([
        { user: userId, name: 'Checking', type: 'checking', balance: 1000 },
        { user: userId, name: 'Savings', type: 'savings', balance: 5000 }
      ]);
    });

    it('should get all user accounts', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('balance');
    });

    it('should only get accounts for authenticated user', async () => {
      const otherUser = await User.create({
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        password: 'password123'
      });

      await Account.create({
        user: otherUser._id,
        name: 'Other Account',
        type: 'checking'
      });

      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });
  });

  // Note: GET /api/accounts/:id route doesn't exist in the current implementation

  describe('PUT /api/accounts/:id', () => {
    let accountId;

    beforeEach(async () => {
      const account = await Account.create({
        user: userId,
        name: 'Old Name',
        type: 'checking',
        balance: 1000
      });
      accountId = account._id;
    });

    it('should update account', async () => {
      const response = await request(app)
        .put(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name', balance: 1500 })
        .expect(200);

      expect(response.body.data.name).toBe('New Name');
      expect(response.body.data.balance).toBe(1500);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    let accountId;

    beforeEach(async () => {
      const account = await Account.create({
        user: userId,
        name: 'To Delete',
        type: 'checking'
      });
      accountId = account._id;
    });

    it('should delete account', async () => {
      await request(app)
        .delete(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const deleted = await Account.findById(accountId);
      expect(deleted.isActive).toBe(false);
    });
  });
});
