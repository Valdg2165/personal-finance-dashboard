import express from 'express';
import {
  getBanks,
  connectBank,
  handleCallback,
  syncAccounts,
  syncTransactions,
} from '../controllers/gocardlessController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/banks', protect, getBanks);
router.post('/connect', protect, connectBank);
router.get('/callback', handleCallback);
router.post('/sync-accounts', protect, syncAccounts);
router.post('/sync-transactions/:accountId', protect, syncTransactions);

export default router;
