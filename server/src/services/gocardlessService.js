import NordigenClient from 'nordigen-node';

const client = new NordigenClient({
  secretId: process.env.GOCARDLESS_SECRET_ID,
  secretKey: process.env.GOCARDLESS_SECRET_KEY,
});

// Initialize and generate token
export const initGoCardless = async () => {
  try {
    const tokenData = await client.generateToken();
    console.log('GoCardless connected');
    return tokenData;
  } catch (error) {
    console.error('GoCardless connection failed:', error.message);
    throw error;
  }
};

// Get list of available banks
export const getInstitutions = async (country = 'FR') => {
  try {
    const institutions = await client.institution.getInstitutions({ country });
    return institutions;
  } catch (error) {
    console.error('Error fetching institutions:', error);
    throw error;
  }
};

// Create requisition (bank connection link)
export const createBankLink = async (institutionId, redirectUrl) => {
  try {
    const requisition = await client.initSession({
      redirectUrl: redirectUrl,
      institutionId: institutionId,
      referenceId: `ref_${Date.now()}`, // Unique reference
    });
    
    return {
      requisitionId: requisition.id,
      link: requisition.link, // User opens this to connect bank
    };
  } catch (error) {
    console.error('Error creating bank link:', error);
    throw error;
  }
};

// Get accounts from requisition
export const getAccounts = async (requisitionId) => {
  try {
    const requisition = await client.requisition.getRequisitionById(requisitionId);
    return requisition.accounts; // Array of account IDs
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
};

// Get account details
export const getAccountDetails = async (accountId) => {
  try {
    const account = client.account(accountId);
    const [details, balances] = await Promise.all([
      account.getDetails(),
      account.getBalances(),
    ]);
    
    return { details, balances };
  } catch (error) {
    console.error('Error fetching account details:', error);
    throw error;
  }
};

// Get transactions
export const getAccountTransactions = async (accountId) => {
  try {
    const account = client.account(accountId);
    const transactions = await account.getTransactions();
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export default {
  initGoCardless,
  getInstitutions,
  createBankLink,
  getAccounts,
  getAccountDetails,
  getAccountTransactions,
};
