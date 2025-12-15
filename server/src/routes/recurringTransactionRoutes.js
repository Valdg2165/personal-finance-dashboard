import express from 'express';
import {
  getRecurringTransactions,
  getRecurringTransaction,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringTransaction
} from '../controllers/recurringTransactionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getRecurringTransactions);
router.get('/:id', protect, getRecurringTransaction);
router.post('/', protect, createRecurringTransaction);
router.put('/:id', protect, updateRecurringTransaction);
router.delete('/:id', protect, deleteRecurringTransaction);
router.patch('/:id/toggle', protect, toggleRecurringTransaction);

export default router;
