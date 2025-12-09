import Category from '../models/Category.js';

export const getCategories = async (req, res) => {
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
};
