import { useState, useEffect } from 'react';
import { transactionAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

// Simple date formatter to avoid Intl issues
const formatTransactionDate = (date) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('fr-FR', options);
  } catch (error) {
    console.error('Date error:', error);
    return new Date(date).toISOString().split('T')[0];
  }
};

export default function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchTransactions = async () => {
    try {
      setError(null);
      const params = filter !== 'all' ? { type: filter } : {};
      const response = await transactionAPI.getAll(params);
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchTransactions();
    };

    window.addEventListener('transactionsUpdated', handleUpdate);
    return () => window.removeEventListener('transactionsUpdated', handleUpdate);
  }, [filter]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading transactions...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('income')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setFilter('expense')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filter === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Expenses
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!transactions || transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No transactions yet.</p>
            <p className="text-sm mt-2">Import a CSV file to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              // Safe rendering with fallbacks
              const description = transaction.description || 'Unknown transaction';
              const amount = transaction.amount || 0;
              const currency = transaction.currency || 'EUR';
              const type = transaction.type || 'expense';
              
              return (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        type === 'income'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {type === 'income' ? (
                        <ArrowUpCircle className="h-5 w-5" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatTransactionDate(transaction.date)}</span>
                        {transaction.category && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span>{transaction.category.icon}</span>
                              <span>{transaction.category.name}</span>
                            </span>
                          </>
                        )}
                        {transaction.account && (
                          <>
                            <span>•</span>
                            <span>{transaction.account.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {type === 'income' ? '+' : '-'}
                      {formatCurrency(amount, currency)}
                    </p>
                    {transaction.categoryConfidence && transaction.categoryConfidence < 0.7 && (
                      <p className="text-xs text-amber-600">Low confidence</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
