import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { accountAPI, transactionAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../lib/utils';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Sun, 
  Moon, 
  Wallet,
  TrendingUp,
  TrendingDown,
  X,
  Save
} from 'lucide-react';

export default function Accounts() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountStats, setAccountStats] = useState({});
  
  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    currency: 'EUR',
    balance: 0,
    institution: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await accountAPI.getAll();
      const accountsData = response.data.data || [];
      setAccounts(accountsData);
      
      // Fetch stats for each account
      const statsPromises = accountsData.map(async (account) => {
        try {
          const transactionsRes = await transactionAPI.getAll({ accountId: account._id });
          const transactions = transactionsRes.data.data || [];
          
          const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
          
          const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
          
          return {
            accountId: account._id,
            income,
            expenses,
            transactionCount: transactions.length
          };
        } catch (err) {
          console.error(`Error fetching stats for account ${account._id}:`, err);
          return { accountId: account._id, income: 0, expenses: 0, transactionCount: 0 };
        }
      });
      
      const stats = await Promise.all(statsPromises);
      const statsMap = {};
      stats.forEach(stat => {
        statsMap[stat.accountId] = stat;
      });
      setAccountStats(statsMap);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'balance' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (!formData.name.trim()) {
        setFormError('Account name is required');
        return;
      }

      await accountAPI.create(formData);
      
      // Reset form
      setFormData({
        name: '',
        type: 'checking',
        currency: 'EUR',
        balance: 0,
        institution: ''
      });
      setShowCreateForm(false);
      
      // Refresh accounts list
      await fetchAccounts();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Failed to create account');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditAccount = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (!formData.name.trim()) {
        setFormError('Account name is required');
        return;
      }

      await accountAPI.update(editingAccount._id, formData);
      
      // Reset form
      setFormData({
        name: '',
        type: 'checking',
        currency: 'EUR',
        balance: 0,
        institution: ''
      });
      setEditingAccount(null);
      
      // Refresh accounts list
      await fetchAccounts();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Failed to update account');
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.balance,
      institution: account.institution || ''
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      type: 'checking',
      currency: 'EUR',
      balance: 0,
      institution: ''
    });
    setFormError('');
  };

  const handleDeleteAccount = async (accountId, accountName) => {
    if (!window.confirm(`Are you sure you want to delete "${accountName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await accountAPI.delete(accountId);
      await fetchAccounts();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'savings':
        return '💰';
      case 'credit':
        return '💳';
      case 'investment':
        return '📈';
      case 'cash':
        return '💵';
      default:
        return '🏦';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Navigation */}
      <nav className="bg-card border-b sticky top-0 z-10 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-bold">💼 Accounts</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.firstName}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleTheme}
                className="p-2"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/recurring')}>
                Recurring
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/budget')}>
                Budget Manager
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Your Accounts</h2>
            <p className="text-muted-foreground mt-1">
              Manage your bank accounts and view balances
            </p>
          </div>
          <Button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setEditingAccount(null);
              setFormData({
                name: '',
                type: 'checking',
                currency: 'EUR',
                balance: 0,
                institution: ''
              });
              setFormError('');
            }}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingAccount) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingAccount ? 'Edit Account' : 'Create New Account'}
                </CardTitle>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    cancelEdit();
                  }}
                  className="p-1 hover:bg-accent rounded-md transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingAccount ? handleEditAccount : handleCreateAccount} className="space-y-4">
                {formError && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Name *</label>
                    <Input
                      name="name"
                      placeholder="e.g., Main Checking"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="credit">Credit Card</option>
                      <option value="investment">Investment</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Currency *</label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {editingAccount ? 'Current Balance' : 'Initial Balance'}
                    </label>
                    <Input
                      name="balance"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.balance}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Institution (Optional)</label>
                    <Input
                      name="institution"
                      placeholder="e.g., Chase Bank, Revolut"
                      value={formData.institution}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={formLoading}>
                  {formLoading ? (
                    'Saving...'
                  ) : editingAccount ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Account
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Accounts List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No accounts yet</p>
              <p className="text-muted-foreground mb-4">
                Create your first account to start tracking your finances
              </p>
              <Button
                onClick={() => {
                  setShowCreateForm(true);
                  setEditingAccount(null);
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => {
              const stats = accountStats[account._id] || { income: 0, expenses: 0, transactionCount: 0 };
              
              return (
                <Card key={account._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getAccountTypeIcon(account.type)}</span>
                        <div>
                          <CardTitle className="text-lg">{account.name}</CardTitle>
                          <p className="text-xs text-muted-foreground capitalize">
                            {account.type}
                            {account.institution && ` • ${account.institution}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Balance */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(account.balance, account.currency)}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mb-1">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs font-medium">Income</span>
                        </div>
                        <p className="text-sm font-semibold">
                          {formatCurrency(stats.income, account.currency)}
                        </p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400 mb-1">
                          <TrendingDown className="h-3 w-3" />
                          <span className="text-xs font-medium">Expenses</span>
                        </div>
                        <p className="text-sm font-semibold">
                          {formatCurrency(stats.expenses, account.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {stats.transactionCount} transaction{stats.transactionCount !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => startEdit(account)}
                      >
                        <Edit2 className="h-3 w-3 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleDeleteAccount(account._id, account.name)}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
