import express from 'express';
import {
  connectBank,
  handleCallback,
  syncAccounts,
  syncTransactions,
} from '../controllers/truelayerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/connect', protect, connectBank);
router.get('/callback', handleCallback);
router.post('/sync-accounts', protect, syncAccounts);
router.post('/sync-transactions/:accountId', protect, syncTransactions);

export default router;
