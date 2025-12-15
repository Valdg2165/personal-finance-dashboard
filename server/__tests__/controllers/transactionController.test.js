import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/authRoutes.js';
import accountRoutes from '../../src/routes/accountRoutes.js';
import transactionRoutes from '../../src/routes/transactionRoutes.js';
import categoryRoutes from '../../src/routes/categoryRoutes.js';
import Transaction from '../../src/models/Transaction.js';
import Account from '../../src/models/Account.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);

describe('Transaction Controller', () => {
  let token, userId, accountId, categoryId;

  beforeEach(async () => {
    const authResponse = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        gdprConsent: true
      });

    token = authResponse.body.token;
    userId = authResponse.body.user.id;

    const accountResponse = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Account', type: 'checking', balance: 1000 });

    accountId = accountResponse.body.data._id;

    const categoryResponse = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Food', type: 'expense', icon: '🍔' });

    categoryId = categoryResponse.body.data ? categoryResponse.body.data._id : categoryResponse.body._id;
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      const transactionData = {
        accountId: accountId,
        categoryId: categoryId,
        type: 'expense',
        amount: 50,
        description: 'Grocery shopping',
        date: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send(transactionData)
        .expect(201);

      expect(response.body.data.amount).toBe(50);
      expect(response.body.data.description).toBe('Grocery shopping');
      expect(response.body.data.type).toBe('expense');
    });

    it('should update account balance on expense', async () => {
      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId: accountId,
          type: 'expense',
          amount: 100,
          description: 'Test expense',
          date: new Date().toISOString()
        });

      const account = await Account.findById(accountId);
      expect(account.balance).toBe(900);
    });

    it('should update account balance on income', async () => {
      const incomeCategory = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Salary', type: 'income', icon: '💰' });

      await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          accountId: accountId,
          categoryId: incomeCategory.body.data ? incomeCategory.body.data._id : incomeCategory.body._id,
          type: 'income',
          amount: 200,
          description: 'Bonus',
          date: new Date().toISOString()
        });

      const account = await Account.findById(accountId);
      expect(account.balance).toBe(1200);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/transactions')
        .send({
          account: accountId,
          type: 'expense',
          amount: 50,
          description: 'Test'
        })
        .expect(401);
    });
  });

  describe('GET /api/transactions', () => {
    beforeEach(async () => {
      await Transaction.create([
        {
          user: userId,
          account: accountId,
          type: 'expense',
          amount: 50,
          description: 'Transaction 1',
          date: new Date()
        },
        {
          user: userId,
          account: accountId,
          type: 'expense',
          amount: 75,
          description: 'Transaction 2',
          date: new Date()
        }
      ]);
    });

    it('should get all transactions', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by account', async () => {
      const response = await request(app)
        .get(`/api/transactions?accountId=${accountId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/transactions?type=expense')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      response.body.data.forEach(transaction => {
        expect(transaction.type).toBe('expense');
      });
    });
  });

  describe('GET /api/transactions/:id', () => {
    let transactionId;

    beforeEach(async () => {
      const transaction = await Transaction.create({
        user: userId,
        account: accountId,
        type: 'expense',
        amount: 100,
        description: 'Test transaction',
        date: new Date()
      });
      transactionId = transaction._id;
    });

    it('should get transaction by id', async () => {
      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.amount).toBe(100);
      expect(response.body.data.description).toBe('Test transaction');
    });
  });

  describe('PUT /api/transactions/:id', () => {
    let transactionId;

    beforeEach(async () => {
      const transaction = await Transaction.create({
        user: userId,
        account: accountId,
        type: 'expense',
        amount: 100,
        description: 'Original',
        date: new Date()
      });
      transactionId = transaction._id;
    });

    it('should update transaction', async () => {
      const response = await request(app)
        .put(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Updated', amount: 150 })
        .expect(200);

      expect(response.body.data.description).toBe('Updated');
      expect(response.body.data.amount).toBe(150);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    let transactionId;

    beforeEach(async () => {
      const transaction = await Transaction.create({
        user: userId,
        account: accountId,
        type: 'expense',
        amount: 50,
        description: 'To delete',
        date: new Date()
      });
      transactionId = transaction._id;
    });

    it('should delete transaction', async () => {
      await request(app)
        .delete(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const deleted = await Transaction.findById(transactionId);
      expect(deleted).toBeNull();
    });
  });
});
