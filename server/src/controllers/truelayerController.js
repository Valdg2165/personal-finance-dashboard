import truelayerService from '../services/truelayerService.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import { autoCategories } from '../utils/categorization.js';
import crypto from 'crypto';

// Generate import hash
const generateImportHash = (transaction) => {
  const data = `${transaction.date.toISOString()}-${transaction.amount}-${transaction.description}`;
  return crypto.createHash('md5').update(data).digest('hex');
};

// Start bank connection flow
export const connectBank = async (req, res) => {
  try {
    const authUrl = truelayerService.getAuthLink();
    
    res.json({
      success: true,
      data: {
        authUrl,
        message: 'Redirect user to this URL to connect their bank',
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Handle callback after user connects bank
export const handleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect('http://localhost:5173/dashboard?error=no_code');
    }

    // Exchange code for tokens
    const tokens = await truelayerService.exchangeCodeForToken(code);
    
    // Redirect to frontend with access token (in production, store in session/cookie)
    const frontendUrl = `http://localhost:5173/dashboard?` +
      `access_token=${tokens.accessToken}&` +
      `refresh_token=${tokens.refreshToken}`;
    
    res.redirect(frontendUrl);
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect('http://localhost:5173/dashboard?error=auth_failed');
  }
};

// Sync accounts from TrueLayer
export const syncAccounts = async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ 
        success: false,
        message: 'Access token required' 
      });
    }

    // Get accounts from TrueLayer
    const accounts = await truelayerService.getAccounts(accessToken);
    
    const syncedAccounts = [];
    
    for (const acc of accounts) {
      try {
        // Get balance
        const balances = await truelayerService.getBalance(accessToken, acc.account_id);
        const balance = balances && balances.length > 0 
          ? parseFloat(balances[0].current) 
          : 0;
        
        // Create or update account
        const account = await Account.findOneAndUpdate(
          { 
            externalId: acc.account_id, 
            user: req.user._id 
          },
          {
            user: req.user._id,
            name: acc.display_name || acc.account_number?.number || 'TrueLayer Account',
            type: acc.account_type?.toLowerCase() || 'checking',
            currency: acc.currency || 'EUR',
            balance: balance,
            externalId: acc.account_id,
            externalProvider: 'truelayer',
            externalToken: accessToken, // Store for later use
            externalRefreshToken: refreshToken,
            institution: {
              name: acc.provider?.display_name || 'Bank',
              logo: acc.provider?.logo_uri,
            },
            lastSyncedAt: new Date(),
            isActive: true,
          },
          { upsert: true, new: true }
        );
        
        syncedAccounts.push(account);
      } catch (err) {
        console.error(`Error syncing account ${acc.account_id}:`, err);
      }
    }
    
    res.json({
      success: true,
      message: `Synced ${syncedAccounts.length} account(s)`,
      data: syncedAccounts,
    });
  } catch (error) {
    console.error('Sync accounts error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Sync transactions from TrueLayer
export const syncTransactions = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    // Find account
    const account = await Account.findOne({
      _id: accountId,
      user: req.user._id,
      externalProvider: 'truelayer',
    });
    
    if (!account || !account.externalToken) {
      return res.status(404).json({ 
        success: false,
        message: 'Account not found or not connected' 
      });
    }
    
    // Get transactions from last 90 days
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 90);
    
    const transactions = await truelayerService.getTransactions(
      account.externalToken,
      account.externalId,
      from.toISOString().split('T')[0],
      to.toISOString().split('T')[0]
    );
    
    // Get user categories
    const categories = await Category.find({ user: req.user._id });
    
    const importedTransactions = [];
    let duplicates = 0;
    let errors = 0;
    
    for (const txn of transactions) {
      try {
        const amount = Math.abs(parseFloat(txn.amount));
        const type = parseFloat(txn.amount) >= 0 ? 'income' : 'expense';
        
        const normalized = {
          date: new Date(txn.timestamp),
          description: txn.description || 'Bank Transaction',
          amount,
          type,
          currency: txn.currency || 'EUR',
          merchant: {
            name: txn.merchant_name || 'Unknown',
          },
        };
        
        // Check for duplicates
        const importHash = generateImportHash(normalized);
        const existing = await Transaction.findOne({
          user: req.user._id,
          $or: [
            { externalId: txn.transaction_id },
            { importHash },
          ],
        });
        
        if (existing) {
          duplicates++;
          continue;
        }
        
        // Auto-categorize
        const categorization = await autoCategories(normalized, categories);
        
        // Create transaction
        const transaction = await Transaction.create({
          user: req.user._id,
          account: accountId,
          category: categorization.category,
          type: normalized.type,
          amount: normalized.amount,
          currency: normalized.currency,
          date: normalized.date,
          description: normalized.description,
          merchant: normalized.merchant,
          importHash,
          categoryConfidence: categorization.confidence,
          externalId: txn.transaction_id,
        });
        
        importedTransactions.push(transaction);
      } catch (err) {
        console.error('Error processing transaction:', err);
        errors++;
      }
    }
    
    // Update last synced
    account.lastSyncedAt = new Date();
    await account.save();
    
    res.json({
      success: true,
      message: `Imported ${importedTransactions.length} new transaction(s)`,
      data: {
        imported: importedTransactions.length,
        duplicates,
        errors,
      },
    });
  } catch (error) {
    console.error('Sync transactions error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export default {
  connectBank,
  handleCallback,
  syncAccounts,
  syncTransactions,
};
