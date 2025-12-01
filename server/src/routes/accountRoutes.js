import express from 'express';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount
} from '../controllers/accountController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect each route individually
router.get('/', protect, getAccounts);
router.post('/', protect, createAccount);
router.put('/:id', protect, updateAccount);
router.delete('/:id', protect, deleteAccount);

export default router;