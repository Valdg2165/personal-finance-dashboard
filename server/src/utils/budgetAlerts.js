import Budget from '../models/Budget.js';
import User from '../models/User.js';
import { sendBudgetAlertEmail } from './emailService.js';




// Helper function to calculate spent amount (same as in budgetController)
const calculateBudgetSpent = async (budget) => {
  const Category = (await import('../models/Category.js')).default;
  const Transaction = (await import('../models/Transaction.js')).default;

  
  try {
    const categoryDoc = await Category.findById(budget.category);
    

    let query = {
      user: budget.user,
      type: 'expense',

      date: {
        $gte: budget.startDate,
        $lte: budget.endDate || new Date()
      }
    };

    if (categoryDoc && categoryDoc.name !== 'Global') {
      const userCategories = await Category.find({ 
        user: budget.user, 
        name: categoryDoc.name 
      });

      const categoryIds = userCategories.map(c => c._id);
      query.category = { $in: categoryIds };
    }

    const transactions = await Transaction.find(query);
    const spent = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    

    return spent;
  } catch (error) {
    console.error('Error calculating budget spent:', error);
    return 0;
  }
};




// Check all active budgets and send alerts if needed
export const checkBudgetAlerts = async (userId) => {
  try {


    // Get all active budgets for the user
    const budgets = await Budget.find({ 
      user: userId, 
      isActive: true,

      endDate: { $gte: new Date() } // Only check budgets that haven't ended
    }).populate('category');


    // Get user details for email
    const user = await User.findById(userId);

    if (!user || !user.email) {
      console.log('User or user email not found');
      return;
    }


    for (const budget of budgets) {
      const spent = await calculateBudgetSpent(budget);
      const percentage = (spent / budget.amount) * 100;


      // If budget reached threshold and alert hasn't been sent yet
      if (percentage >= budget.alertThreshold && !budget.alertSent) {
        const categoryName = budget.category?.name || 'Unknown';
        

        // Send email alert
        const emailSent = await sendBudgetAlertEmail(user.email, user.firstName, {
          categoryName,
          spent,
          total: budget.amount,
          percentage: Math.round(percentage)
        });

        // Mark alert as sent
        if (emailSent) {
          budget.alertSent = true;

          await budget.save();

          console.log(`Budget alert sent for ${categoryName} to ${user.email}`);
        }
      }


      // Reset alert if spending goes back below threshold
      if (percentage < budget.alertThreshold && budget.alertSent) {
        budget.alertSent = false;

        await budget.save();
      }
    }

  } catch (error) {
    console.error('Error checking budget alerts:', error);
  }
};


export default { checkBudgetAlerts };
