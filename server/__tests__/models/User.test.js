import User from '../../src/models/User.js';
import bcrypt from 'bcryptjs';

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a valid user', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = await User.create(userData);

      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user.currency).toBe('EUR'); // Default value
    });

    it('should hash password before saving', async () => {
      const password = 'plainPassword123';
      const user = await User.create({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password
      });

      const isMatch = await bcrypt.compare(password, user.password);
      expect(isMatch).toBe(true);
      expect(user.password).not.toBe(password);
    });

    it('should require email and password', async () => {
      const user = new User({
        firstName: 'Test'
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const email = 'duplicate@example.com';
      await User.create({
        firstName: 'User',
        lastName: 'One',
        email,
        password: 'password123'
      });

      await expect(
        User.create({
          firstName: 'User',
          lastName: 'Two',
          email,
          password: 'password456'
        })
      ).rejects.toThrow();
    });
  });

  describe('User Methods', () => {
    it('should compare password correctly', async () => {
      const password = 'testPassword123';
      const user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password
      });

      const isMatch = await user.comparePassword(password);
      expect(isMatch).toBe(true);

      const isNotMatch = await user.comparePassword('wrongPassword');
      expect(isNotMatch).toBe(false);
    });
  });
});
