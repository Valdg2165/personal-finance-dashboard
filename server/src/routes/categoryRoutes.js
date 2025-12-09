import express from 'express';
import Category from '../models/Category.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { type } = req.query;
    
    const filter = { user: req.user._id };
    if (type) filter.type = type;

    const categories = await Category.find(filter).sort('name');

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
