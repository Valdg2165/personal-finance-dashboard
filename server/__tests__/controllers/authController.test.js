import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/authRoutes.js';
import User from '../../src/models/User.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        gdprConsent: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not register duplicate email', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'duplicate@example.com',
        password: 'password123',
        gdprConsent: true
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          email: 'test@example.com'
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid email', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123'
        })
        .expect(401);
    });

    it('should reject invalid password', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should require all fields', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);
    });
  });

  // Note: /api/auth/me route doesn't exist in the current implementation
  // Tests for protected routes are covered in other controller tests
});
