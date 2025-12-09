import express from 'express';
import { register, login } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Update user email (protected route)
router.put('/update-email', protect, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const { email, force } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // If force flag is not set, check if email is in use by another user
    if (!force) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Email already in use by another account. Send "force": true to update anyway.',
          canForce: true
        });
      }
    }
    
    // Update user email
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { email },
      { new: true }
    ).select('-password');
    
    console.log('✉️  Email updated for user:', req.user._id, 'to:', email);
    
    res.json({ 
      success: true, 
      message: 'Email updated successfully',
      user 
    });
  } catch (error) {
    console.error('Error updating email:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;