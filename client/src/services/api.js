import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// Account endpoints
export const accountAPI = {
  getAll: () => api.get('/accounts'),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
};

// Transaction endpoints
export const transactionAPI = {
  // Supporte désormais les filtres avancés :
  // params = { 
  //   startDate: 'YYYY-MM-DD', 
  //   endDate: 'YYYY-MM-DD', 
  //   category: 'id' OU ['id1', 'id2'], 
  //   type: 'income'|'expense',
  //   search: 'keyword' 
  // }
  getAll: (params) => api.get('/transactions', { params }),
  
  getOne: (id) => api.get(`/transactions/${id}`),
  
  create: (data) => api.post('/transactions', data),
  
  update: (id, data) => api.put(`/transactions/${id}`, data),
  
  delete: (id) => api.delete(`/transactions/${id}`),
  
  // Recherche textuelle (peut être combinée avec d'autres params comme la date)
  search: (query, params = {}) => api.get('/transactions', { 
    params: { ...params, search: query } 
  }),
  
  import: (formData) => {
    return api.post('/transactions/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Budget endpoints
export const budgetAPI = {
  getAll: () => api.get('/budgets'),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
};
// Category endpoints
// Category endpoints (Nécessaire pour remplir le menu déroulant des filtres)
export const categoryAPI = {
  getAll: (params) => api.get('/categories', { params }),
};

// Add TrueLayer API
export const truelayerAPI = {
  connect: () => api.post('/truelayer/connect'),
  syncAccounts: (data) => api.post('/truelayer/sync-accounts', data),
  syncTransactions: (accountId) => api.post(`/truelayer/sync-transactions/${accountId}`),
};

export default api;