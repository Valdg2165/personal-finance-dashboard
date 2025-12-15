import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { seedDefaultCategories } from '../utils/seedCategories.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, gdprConsent } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (!gdprConsent) {
      return res.status(400).json({ message: 'GDPR consent required' });
    }

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      gdprConsent,
      consentDate: new Date()
    });

    // Seed default categories for new user (with error handling)
    try {
      await seedDefaultCategories(user._id);
    } catch (seedError) {
      console.error('Category seeding error:', seedError.message);
      // Continue even if seeding fails
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};