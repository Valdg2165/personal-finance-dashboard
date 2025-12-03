import { useState, useEffect, useCallback } from 'react';
import { transactionAPI } from '../services/api';

export const useTransactions = (filters = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await transactionAPI.getAll(filters);
      setTransactions(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [filters.accountId, filters.startDate, filters.endDate, filters.category, filters.type]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const refetch = () => fetchTransactions();

  return { transactions, loading, error, refetch };
};