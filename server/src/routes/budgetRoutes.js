import express from 'express';
import { createBudget, getBudgets, updateBudget, deleteBudget } from '../controllers/budgetController.js';
import { protect } from '../middleware/auth.js';
import { checkBudgetAlerts } from '../utils/budgetAlerts.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Budget routes
router.post('/', createBudget);
router.get('/', getBudgets);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

// Test endpoint to manually trigger budget alerts
router.post('/check-alerts', async (req, res) => {
  try {
    console.log('Manual budget alert check triggered');
    await checkBudgetAlerts(req.user._id);
    res.json({ 
      success: true, 
      message: 'Budget alerts checked. Check server console for details.' 
    });
  } catch (error) {
    console.error('Error in manual alert check:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Debug endpoint to view and reset alert flags
router.post('/reset-alerts', async (req, res) => {
  try {
    const Budget = (await import('../models/Budget.js')).default;
    
    // Reset all alertSent flags for user's budgets
    const result = await Budget.updateMany(
      { user: req.user._id },
      { $set: { alertSent: false } }
    );
    
    console.log('Reset alert flags for user:', req.user._id);
    console.log('   Budgets updated:', result.modifiedCount);
    
    res.json({ 
      success: true, 
      message: `Reset ${result.modifiedCount} budget alert flags`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error resetting alerts:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;
