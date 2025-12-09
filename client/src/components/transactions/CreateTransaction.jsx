import { useState, useEffect } from 'react';
import { transactionAPI, accountAPI, categoryAPI } from '../../services/api';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Plus, X } from 'lucide-react';

export default function CreateTransaction({ onTransactionCreated, onCancel }) {
  const [formData, setFormData] = useState({
    accountId: '',
    categoryId: '',
    type: 'expense',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    merchant: '',
    notes: '',
  });

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, []);

  useEffect(() => {
    // Refetch categories when type changes
    fetchCategories();
  }, [formData.type]);

  const fetchAccounts = async () => {
    try {
      const response = await accountAPI.getAll();
      setAccounts(response.data.data || []);
      if (response.data.data.length > 0 && !formData.accountId) {
        setFormData(prev => ({ ...prev, accountId: response.data.data[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll({ type: formData.type });
      setCategories(response.data.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.accountId) {
      setError('Please select an account');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return;
    }

    setLoading(true);

    try {
      const transactionData = {
        accountId: formData.accountId,
        categoryId: formData.categoryId || undefined,
        type: formData.type,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description.trim(),
        merchant: formData.merchant.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      await transactionAPI.create(transactionData);

      // Reset form
      setFormData({
        accountId: formData.accountId,
        categoryId: '',
        type: 'expense',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        merchant: '',
        notes: '',
      });

      // Notify parent component
      if (onTransactionCreated) {
        onTransactionCreated();
      }

      // Trigger global refresh
      window.dispatchEvent(new Event('transactionsUpdated'));
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err.response?.data?.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Transaction
          </CardTitle>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1 hover:bg-accent rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Transaction Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense', categoryId: '' }))}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  formData.type === 'expense'
                    ? 'bg-red-600 text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'income', categoryId: '' }))}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  formData.type === 'income'
                    ? 'bg-green-600 text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Account Selection */}
          <div className="space-y-2">
            <label htmlFor="accountId" className="text-sm font-medium">
              Account *
            </label>
            <select
              id="accountId"
              name="accountId"
              value={formData.accountId}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select account...</option>
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <label htmlFor="categoryId" className="text-sm font-medium">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select category...</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Amount *
            </label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">
              Date *
            </label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description *
            </label>
            <Input
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g., Grocery shopping"
              required
            />
          </div>

          {/* Merchant (Optional) */}
          <div className="space-y-2">
            <label htmlFor="merchant" className="text-sm font-medium">
              Merchant (Optional)
            </label>
            <Input
              id="merchant"
              name="merchant"
              type="text"
              value={formData.merchant}
              onChange={handleChange}
              placeholder="e.g., Carrefour"
            />
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
