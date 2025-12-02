import gocardlessService from '../services/gocardlessService.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import { autoCategories } from '../utils/categorization.js';
import { generateImportHash } from '../utils/fileParser.js';

// Get available banks
export const getBanks = async (req, res) => {
  try {
    const { country = 'FR' } = req.query;
    const institutions = await gocardlessService.getInstitutions(country);
    
    res.json({
      success: true,
      data: institutions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create bank connection link
export const connectBank = async (req, res) => {
  try {
    const { institutionId } = req.body;
    const redirectUrl = `${req.protocol}://${req.get('host')}/api/gocardless/callback`;
    
    const { requisitionId, link } = await gocardlessService.createBankLink(
      institutionId,
      redirectUrl
    );
    
    res.json({
      success: true,
      data: {
        requisitionId,
        link,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Callback after user connects bank
export const handleCallback = async (req, res) => {
  try {
    const { ref } = req.query;
    
    // Redirect to frontend with requisition ID
    res.redirect(`http://localhost:5173/dashboard?requisition=${ref}`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sync accounts from GoCardless
export const syncAccounts = async (req, res) => {
  try {
    const { requisitionId } = req.body;
    
    // Get account IDs from requisition
    const accountIds = await gocardlessService.getAccounts(requisitionId);
    
    const syncedAccounts = [];
    
    for (const accountId of accountIds) {
      const { details, balances } = await gocardlessService.getAccountDetails(accountId);
      
      // Create or update account in database
      const account = await Account.findOneAndUpdate(
        { externalId: accountId, user: req.user._id },
        {
          user: req.user._id,
          name: details.name || details.ownerName || 'Connected Account',
          type: details.cashAccountType?.toLowerCase() || 'checking',
          currency: details.currency || 'EUR',
          balance: balances.balances[0]?.balanceAmount?.amount || 0,
          externalId: accountId,
          externalProvider: 'gocardless',
          institution: {
            name: details.institutionId,
          },
          lastSyncedAt: new Date(),
          isActive: true,
        },
        { upsert: true, new: true }
      );
      
      syncedAccounts.push(account);
    }
    
    res.json({
      success: true,
      message: `Synced ${syncedAccounts.length} accounts`,
      data: syncedAccounts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sync transactions from GoCardless
export const syncTransactions = async (req, res) => {
  try {
    const { accountId } = req.params; // Our internal account ID
    
    // Find account with external ID
    const account = await Account.findOne({
      _id: accountId,
      user: req.user._id,
      externalProvider: 'gocardless',
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Fetch transactions from GoCardless
    const transactionData = await gocardlessService.getAccountTransactions(account.externalId);
    const transactions = transactionData.transactions?.booked || [];
    
    // Get user categories
    const categories = await Category.find({ user: req.user._id });
    
    const importedTransactions = [];
    let duplicates = 0;
    
    for (const txn of transactions) {
      // Normalize transaction
      const amount = Math.abs(parseFloat(txn.transactionAmount?.amount || 0));
      const type = parseFloat(txn.transactionAmount?.amount) >= 0 ? 'income' : 'expense';
      
      const normalized = {
        date: new Date(txn.bookingDate || txn.valueDate),
        description: txn.remittanceInformationUnstructured || txn.creditorName || 'Unknown',
        amount,
        type,
        currency: txn.transactionAmount?.currency || 'EUR',
        merchant: {
          name: txn.creditorName || txn.debtorName || 'Unknown',
        },
      };
      
      // Check for duplicates
      const importHash = generateImportHash(normalized);
      const existing = await Transaction.findOne({
        user: req.user._id,
        importHash,
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
        externalId: txn.transactionId,
      });
      
      importedTransactions.push(transaction);
    }
    
    // Update account balance and last synced
    account.lastSyncedAt = new Date();
    await account.save();
    
    res.json({
      success: true,
      message: `Synced ${importedTransactions.length} transactions`,
      data: {
        imported: importedTransactions.length,
        duplicates,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
