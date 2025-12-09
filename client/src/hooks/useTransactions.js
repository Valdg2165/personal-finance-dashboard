import { useState, useEffect, useCallback, useMemo } from 'react';
import { transactionAPI } from '../services/api';

export const useTransactions = (filters = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stringify filters to avoid dependency issues with object references
  const filterString = useMemo(() => JSON.stringify(filters), [
    filters.accountId,
    filters.startDate,
    filters.endDate,
    filters.category,
    filters.type
  ]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const parsedFilters = JSON.parse(filterString);
      const response = await transactionAPI.getAll(parsedFilters);
      setTransactions(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [filterString]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const refetch = () => fetchTransactions();

  return { transactions, loading, error, refetch };
};