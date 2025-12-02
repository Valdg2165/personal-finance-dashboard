import axios from 'axios';

const clientId = process.env.TRUELAYER_CLIENT_ID;
const clientSecret = process.env.TRUELAYER_CLIENT_SECRET;
const redirectUri = process.env.TRUELAYER_REDIRECT_URI;

// TrueLayer API endpoints
const AUTH_URL = 'https://auth.truelayer-sandbox.com';
const API_URL = 'https://api.truelayer-sandbox.com';

// Test connection
export const initTrueLayer = async () => {
  try {
    if (!clientId || !clientSecret) {
      throw new Error('TrueLayer credentials not configured');
    }
    console.log('TrueLayer initialized (modern axios implementation)');
    return { success: true };
  } catch (error) {
    console.error('TrueLayer initialization failed:', error.message);
    throw error;
  }
};

// Generate auth link for user to connect bank
export const getAuthLink = () => {
  const scopes = ['info', 'accounts', 'balance', 'transactions', 'offline_access'];
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    providers: 'uk-ob-all uk-oauth-all',
  });

  return `${AUTH_URL}/?${params.toString()}`;
};

// Exchange auth code for access token
export const exchangeCodeForToken = async (code) => {
  try {
    const response = await axios.post(`${AUTH_URL}/connect/token`, 
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  } catch (error) {
    console.error('Error exchanging code:', error.response?.data || error.message);
    throw new Error('Failed to exchange authorization code');
  }
};

// Get accounts
export const getAccounts = async (accessToken) => {
  try {
    const response = await axios.get(`${API_URL}/data/v1/accounts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching accounts:', error.response?.data || error.message);
    throw error;
  }
};

// Get account balance
export const getBalance = async (accessToken, accountId) => {
  try {
    const response = await axios.get(
      `${API_URL}/data/v1/accounts/${accountId}/balance`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching balance:', error.response?.data || error.message);
    throw error;
  }
};

// Get transactions
export const getTransactions = async (accessToken, accountId, from, to) => {
  try {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const response = await axios.get(
      `${API_URL}/data/v1/accounts/${accountId}/transactions`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params,
      }
    );

    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching transactions:', error.response?.data || error.message);
    throw error;
  }
};

// Refresh access token
export const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post(`${AUTH_URL}/connect/token`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    throw error;
  }
};

export default {
  initTrueLayer,
  getAuthLink,
  exchangeCodeForToken,
  getAccounts,
  getBalance,
  getTransactions,
  refreshAccessToken,
};
