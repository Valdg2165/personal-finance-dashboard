import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { recurringTransactionAPI, accountAPI, categoryAPI } from '../services/api';
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
  Calendar,
  Repeat,
  Play,
  Pause,
  X,
  Save
} from 'lucide-react';

export default function RecurringTransactions() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [recurring, setRecurring] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  
  const [formData, setFormData] = useState({
    accountId: '',
    categoryId: '',
    type: 'expense',
    amount: '',
    description: '',
    merchant: '',
    notes: '',
    tags: '',
    frequency: 'monthly',
    interval: 1,
    dayOfMonth: new Date().getDate(),
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    endAfterOccurrences: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [recurringRes, accountsRes, categoriesRes] = await Promise.all([
        recurringTransactionAPI.getAll(),
        accountAPI.getAll(),
        categoryAPI.getAll()
      ]);
      
      setRecurring(recurringRes.data.data || []);
      setAccounts(accountsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      accountId: '',
      categoryId: '',
      type: 'expense',
      amount: '',
      description: '',
      merchant: '',
      notes: '',
      tags: '',
      frequency: 'monthly',
      interval: 1,
      dayOfMonth: new Date().getDate(),
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      endAfterOccurrences: ''
    });
    setFormError('');
    setEditingRecurring(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const data = {
        accountId: formData.accountId,
        categoryId: formData.categoryId || undefined,
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        merchant: formData.merchant || undefined,
        notes: formData.notes || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        frequency: formData.frequency,
        interval: parseInt(formData.interval) || 1,
        dayOfMonth: formData.frequency === 'monthly' ? parseInt(formData.dayOfMonth) : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        endAfterOccurrences: formData.endAfterOccurrences ? parseInt(formData.endAfterOccurrences) : undefined
      };

      if (editingRecurring) {
        await recurringTransactionAPI.update(editingRecurring._id, data);
      } else {
        await recurringTransactionAPI.create(data);
      }

      await fetchData();
      resetForm();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Failed to save recurring transaction');
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditingRecurring(item);
    setFormData({
      accountId: item.account._id,
      categoryId: item.category?._id || '',
      type: item.type,
      amount: item.amount,
      description: item.description,
      merchant: item.merchant?.name || '',
      notes: item.notes || '',
      tags: item.tags?.join(', ') || '',
      frequency: item.frequency,
      interval: item.interval,
      dayOfMonth: item.dayOfMonth || new Date().getDate(),
      startDate: new Date(item.startDate).toISOString().split('T')[0],
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
      endAfterOccurrences: item.endAfterOccurrences || ''
    });
    setShowCreateForm(false);
  };

  const handleDelete = async (id, description) => {
    if (!window.confirm(`Delete recurring transaction "${description}"?`)) return;

    try {
      await recurringTransactionAPI.delete(id);
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete');
    }
  };

  const handleToggle = async (id) => {
    try {
      await recurringTransactionAPI.toggle(id);
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to toggle');
    }
  };

  const getFrequencyText = (item) => {
    const freq = item.frequency;
    const interval = item.interval;
    
    if (freq === 'daily') return interval > 1 ? `Every ${interval} days` : 'Daily';
    if (freq === 'weekly') return interval > 1 ? `Every ${interval} weeks` : 'Weekly';
    if (freq === 'biweekly') return 'Every 2 weeks';
    if (freq === 'monthly') return interval > 1 ? `Every ${interval} months` : 'Monthly';
    if (freq === 'quarterly') return 'Quarterly';
    if (freq === 'yearly') return interval > 1 ? `Every ${interval} years` : 'Yearly';
    return freq;
  };

  const getNextDateText = (date) => {
    const next = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    return next.toLocaleDateString();
  };

  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <nav className="bg-card border-b sticky top-0 z-10 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold">🔄 Recurring Transactions</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.firstName}
              </span>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="p-2">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Your Recurring Transactions</h2>
            <p className="text-muted-foreground mt-1">
              Automatically create transactions on a schedule
            </p>
          </div>
          <Button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setEditingRecurring(null);
              resetForm();
            }}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Recurring Transaction
          </Button>
        </div>

        {(showCreateForm || editingRecurring) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {editingRecurring ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'}
                </CardTitle>
                <button onClick={resetForm} className="p-1 hover:bg-accent rounded-md">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type *</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: 'expense', categoryId: '' }))}
                        className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                          formData.type === 'expense' ? 'bg-red-600 text-white' : 'bg-secondary'
                        }`}
                      >
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: 'income', categoryId: '' }))}
                        className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                          formData.type === 'income' ? 'bg-green-600 text-white' : 'bg-secondary'
                        }`}
                      >
                        Income
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account *</label>
                    <select
                      name="accountId"
                      value={formData.accountId}
                      onChange={handleInputChange}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select account...</option>
                      {accounts.map(acc => (
                        <option key={acc._id} value={acc._id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount *</label>
                    <Input
                      type="number"
                      name="amount"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select category...</option>
                      {filteredCategories.map(cat => (
                        <option key={cat._id} value={cat._id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Description *</label>
                    <Input
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="e.g., Netflix Subscription"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Frequency *</label>
                    <select
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Biweekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  {formData.frequency === 'monthly' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Day of Month</label>
                      <Input
                        type="number"
                        name="dayOfMonth"
                        min="1"
                        max="31"
                        value={formData.dayOfMonth}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date *</label>
                    <Input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date (Optional)</label>
                    <Input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Or End After (Occurrences)</label>
                    <Input
                      type="number"
                      name="endAfterOccurrences"
                      min="1"
                      value={formData.endAfterOccurrences}
                      onChange={handleInputChange}
                      placeholder="Leave empty for no limit"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={formLoading}>
                  {formLoading ? 'Saving...' : (
                    <>
                      {editingRecurring ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      {editingRecurring ? 'Update' : 'Create'} Recurring Transaction
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : recurring.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Repeat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No recurring transactions yet</p>
              <p className="text-muted-foreground mb-4">
                Set up automatic transactions for bills, subscriptions, and income
              </p>
              <Button onClick={() => setShowCreateForm(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {recurring.map(item => (
              <Card key={item._id} className={!item.isActive ? 'opacity-60' : ''}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-2xl ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, item.currency)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${item.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/20' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20'}`}>
                          {item.isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg">{item.description}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Repeat className="h-4 w-4" />
                          {getFrequencyText(item)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Next: {getNextDateText(item.nextExecutionDate)}
                        </span>
                        {item.category && (
                          <span>{item.category.icon} {item.category.name}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {item.account.name} • Executed {item.occurrenceCount} times
                        {item.endAfterOccurrences && ` • ${item.endAfterOccurrences - item.occurrenceCount} remaining`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggle(item._id)}>
                        {item.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(item._id, item.description)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
