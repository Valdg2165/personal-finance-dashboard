import express from 'express';
import {
  importTransactions,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  uploadMiddleware
} from '../controllers/transactionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.post('/import', protect, uploadMiddleware, importTransactions);
router.get('/', protect, getTransactions);
router.get('/:id', protect, getTransaction);
router.put('/:id', protect, updateTransaction);
router.delete('/:id', protect, deleteTransaction);

export default router;