import RecurringTransaction from '../models/RecurringTransaction.js';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import { calculateNextDate } from '../controllers/recurringTransactionController.js';
import { checkBudgetAlerts } from './budgetAlerts.js';

let schedulerInterval = null;

// Process all due recurring transactions
export const processRecurringTransactions = async () => {
  try {
    const now = new Date();
    
    // Find all active recurring transactions that are due
    const dueRecurring = await RecurringTransaction.find({
      isActive: true,
      nextExecutionDate: { $lte: now }
    }).populate('account');
    
    console.log(`Processing ${dueRecurring.length} due recurring transactions...`);
    
    for (const recurring of dueRecurring) {
      try {
        // Check if should stop (end conditions)
        let shouldStop = false;
        
        if (recurring.endDate && now > recurring.endDate) {
          shouldStop = true;
        }
        
        if (recurring.endAfterOccurrences && recurring.occurrenceCount >= recurring.endAfterOccurrences) {
          shouldStop = true;
        }
        
        if (shouldStop) {
          recurring.isActive = false;
          await recurring.save();
          console.log(`Recurring transaction ${recurring._id} has reached its end condition`);
          continue;
        }
        
        // Create the transaction
        const transaction = await Transaction.create({
          user: recurring.user,
          account: recurring.account._id,
          category: recurring.category || null,
          type: recurring.type,
          amount: recurring.amount,
          currency: recurring.currency,
          date: now,
          description: recurring.description,
          merchant: recurring.merchant,
          notes: recurring.notes,
          tags: recurring.tags,
          isRecurring: true,
          categoryConfidence: recurring.category ? 1.0 : 0
        });
        
        // Update account balance
        const account = recurring.account;
        if (recurring.type === 'income') {
          account.balance += recurring.amount;
        } else {
          account.balance -= recurring.amount;
        }
        await account.save();
        
        // Update recurring transaction
        recurring.lastExecutionDate = now;
        recurring.occurrenceCount += 1;
        recurring.nextExecutionDate = calculateNextDate(
          now,
          recurring.frequency,
          recurring.interval,
          recurring.dayOfMonth,
          recurring.dayOfWeek
        );
        await recurring.save();
        
        console.log(`Created transaction from recurring ${recurring._id}: ${transaction._id}`);
        
        // Check budget alerts
        checkBudgetAlerts(recurring.user).catch(err =>
          console.error('Error checking budget alerts:', err)
        );
        
      } catch (error) {
        console.error(`Error processing recurring transaction ${recurring._id}:`, error);
      }
    }
    
    console.log('Finished processing recurring transactions');
  } catch (error) {
    console.error('Error in processRecurringTransactions:', error);
  }
};

// Start the scheduler (runs every hour)
export const startRecurringScheduler = () => {
  if (schedulerInterval) {
    console.log('Recurring transaction scheduler is already running');
    return;
  }
  
  console.log('Starting recurring transaction scheduler...');
  
  // Run immediately on start
  processRecurringTransactions();
  
  // Then run every hour (3600000 ms)
  schedulerInterval = setInterval(() => {
    processRecurringTransactions();
  }, 3600000); // 1 hour
  
  console.log('Recurring transaction scheduler started (runs every hour)');
};

// Stop the scheduler
export const stopRecurringScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Recurring transaction scheduler stopped');
  }
};

// Manual trigger (for testing or manual runs)
export const triggerRecurringTransactions = async (req, res) => {
  try {
    await processRecurringTransactions();
    res.json({
      success: true,
      message: 'Recurring transactions processed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
