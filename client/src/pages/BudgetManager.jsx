import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { budgetAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatsCards from '../components/dashboard/StatsCards';
import { LogOut } from 'lucide-react';




export default function BudgetPage() {
  const { user, logout } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    category: '', 
    period: '', 
    amount: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  
  const categories = [
    { name: 'Global', emoji: '🪙' },

    { name: 'Housing', emoji: '🏠' },
    { name: 'Transportation', emoji: '🚗' },

    { name: 'Food & Dining', emoji: '🍔' },
    { name: 'Groceries', emoji: '🛒' },
    { name: 'Shopping', emoji: '🛍️' },
    { name: 'Entertainment', emoji: '🎬' },
    { name: 'Health & Fitness', emoji: '💪' },
    { name: 'Utilities', emoji: '💡' },
    { name: 'Insurance', emoji: '🛡️' },
    { name: 'Education', emoji: '📚' },
    { name: 'Subscriptions', emoji: '📱' },
    { name: 'Travel', emoji: '✈️' },
    { name: 'Other Expense', emoji: '💸' },
  ];

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  // Load budgets on component mount
  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAPI.getAll();
      setBudgets(response.data);
      setError(null);

    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (budget) => {
    const endDate = new Date(budget.createdAt);
    endDate.setMonth(endDate.getMonth() + parseInt(budget.period));

    const now = new Date();
    const diffMs = endDate - now;


    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(totalDays / 30);

    const days = totalDays % 30;


    let result = '';
    if (months > 0) result += `${months} m `;
    if (days > 0) result += `${days} d`;

    return result.trim();
  };

  const calculateRemaining = (budget) => {
    // Utiliser le montant restant calculé par le serveur si disponible
    if (budget.remaining !== undefined) {
      return budget.remaining;
    }

    // Sinon, utiliser amount - spent si disponible
    if (budget.spent !== undefined) {
      return budget.amount - budget.spent;
    }
    // Par défaut, renvoyer le montant total
    return parseFloat(budget.amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {

      if (editingBudget) {
        // Update existing budget
        const response = await budgetAPI.update(editingBudget._id, form);
        setBudgets(budgets.map(b => b._id === editingBudget._id ? response.data : b));
        setEditingBudget(null);
      } else {
        // Create new budget
        const response = await budgetAPI.create(form);

        setBudgets([...budgets, response.data]);
      }
      setForm({ category: '', period: '', amount: '' });
      setOpen(false);
      setError(null);

      // Refresh budgets to get updated spent amounts
      fetchBudgets();
    } catch (err) {
      console.error('Error saving budget:', err);
      setError('Failed to save budget');
    }
  };

  const handleEdit = (budget) => {
    const categoryName = budget.category?.name || budget.category;
    let periodMonths = 1;

    if (budget.startDate && budget.endDate) {
      const start = new Date(budget.startDate);
      const end = new Date(budget.endDate);

      periodMonths = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
    }
    
    setEditingBudget(budget);
    setForm({
      category: categoryName,
      period: periodMonths.toString(),
      amount: budget.amount.toString(),
      startDate: budget.startDate ? new Date(budget.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setOpen(true);
    setDropdownOpen(null);
  };

  const handleDelete = async (budgetId) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }
    

    try {
      await budgetAPI.delete(budgetId);

      setBudgets(budgets.filter(b => b._id !== budgetId));
      setError(null);
    } catch (err) {
      console.error('Error deleting budget:', err);
      setError('Failed to delete budget');
    }
    setDropdownOpen(null);
  };

  const handleClosePanel = () => {
    setOpen(false);

    setEditingBudget(null);
    setForm({ 
      category: '', 
      period: '', 

      amount: '',
      startDate: new Date().toISOString().split('T')[0]
    });
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">💰 Budget Manager</h1>
              <Button onClick={() => setOpen(true)} size="sm">Add a Budget</Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.firstName}!
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative" onClick={() => setDropdownOpen(null)}>
        {/* Stats Cards */}
        <StatsCards />
        

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <p className="text-center text-gray-500 text-xl font-medium">Loading budgets...</p>
          </div>

        ) : budgets.length === 0 ? (
          <div className="flex justify-center items-center h-96">
            <p className="text-center text-gray-500 text-xl font-medium">
              Click on <span className="font-semibold">"Add a Budget"</span> to set up your first budget
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {budgets.map((b, i) => {
              const categoryName = b.category?.name || b.category;
              const category = categories.find(c => c.name === categoryName);
              

              // Calculate period in months from dates if available
              let periodMonths = 1;
              if (b.startDate && b.endDate) {
                const start = new Date(b.startDate);
                const end = new Date(b.endDate);
                periodMonths = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
              }
              
              const budgetWithPeriod = { ...b, period: periodMonths, createdAt: b.startDate || b.createdAt };
              const remaining = calculateRemaining(budgetWithPeriod);

              const remainingPercent = (remaining / b.amount) * 100;
              const remainingColor = remainingPercent < 20 ? 'text-red-500' : 'text-green-500';
              

              return (
                <Card key={b._id || i} className="p-6 flex flex-col justify-center items-center min-h-48 h-auto shadow-lg text-center relative z-40">                
                  {/* Three dots menu */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        setDropdownOpen(dropdownOpen === b._id ? null : b._id);
                      }}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    
                    {/* Dropdown menu */}
                    {dropdownOpen === b._id && (
                      <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border border-gray-200">

                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            handleEdit(b);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();

                            handleDelete(b._id);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="mb-2">
                    <CardTitle className="text-xl -mb-1 text-center whitespace-nowrap overflow-hidden text-ellipsis">
                      {category?.emoji} {categoryName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col justify-center items-center mt-2">
                    <p className="text-md text-gray-500 font-medium">
                      {periodMonths >= 12
                        ? `${Math.floor(periodMonths / 12)} year${periodMonths >= 24 ? 's' : ''}`
                        : `${periodMonths} month${periodMonths === 1 ? '' : 's'}`}
                    </p>

                    <p className="text-sm text-gray-600 font-medium mt-1">
                      End: {b.endDate ? new Date(b.endDate).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                      {getTimeRemaining(budgetWithPeriod)} Left
                    </p>
                    
                    {/* Budget amount */}
                    <p className="mt-3 text-3xl font-bold">{b.amount}€</p>
                    

                    {/* Spent amount */}
                    {b.spent !== undefined && (
                      <p className="text-sm text-gray-600 mt-1">
                        {b.spent.toFixed(2)}€ spent
                      </p>
                    )}

                    
                    {/* Remaining amount with color */}
                    <p className={`mt-2 font-bold text-lg ${remainingColor}`}>
                      {remaining.toFixed(2)}€ Left
                    </p>
                    
                    {/* Progress bar */}
                    {b.spent !== undefined && (
                      <div className="w-full mt-3">

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${remainingPercent > 50 ? 'bg-green-500' : remainingPercent > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, (b.spent / b.amount) * 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-1">
                          {((b.spent / b.amount) * 100).toFixed(0)}% used
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Side panel */}
      {open ? (
        <div 
          className="flex flex-col gap-4 overflow-y-auto"
          style={{ 
            position: 'fixed', 
            right: 0, 

            top: 0, 
            width: '320px', 
            height: '100vh', 
            backgroundColor: 'white', 

            borderLeft: '1px solid #e5e7eb',
            boxShadow: '-4px 0 6px -1px rgba(0, 0, 0, 0.1)',
            padding: '24px',
            zIndex: 9999 
          }}
        >

          <h2 className="text-xl font-bold">{editingBudget ? 'Edit Budget' : 'Add a Budget'}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Category */}
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>

              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="block w-full appearance-none bg-white border border-gray-300 
                  text-gray-700 py-2 px-3 pr-8 rounded-md shadow-sm 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>Select a category</option>
                {categories.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>

              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>


            {/* Period */}
            <div>
              <label className="text-sm font-medium mb-1 block">Period</label>
              <select
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                required
                className="block w-full appearance-none bg-white border border-gray-300 
                  text-gray-700 py-2 px-3 pr-8 rounded-md shadow-sm 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>Select a period</option>
                <option value="1">1 month</option>
                <option value="2">2 months</option>
                <option value="3">3 months</option>
                <option value="4">4 months</option>
                <option value="5">5 months</option>
                <option value="6">6 months</option>
                <option value="7">7 months</option>
                <option value="8">8 months</option>
                <option value="9">9 months</option>
                <option value="10">10 months</option>
                <option value="11">11 months</option>
                <option value="12">1 year</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium mb-1 block">Amount</label>

              <Input
                type="number"
                value={form.amount}
                onChange={(e) => {
                  let value = e.target.value;


                  // Supprime les caractères non numériques sauf le point
                  if (!/^\d*\.?\d*$/.test(value)) return;

                  // Limite à 2 décimales
                  if (value.includes('.')) {
                    const [intPart, decPart] = value.split('.');
                    if (decPart.length > 2) return;
                  }


                  // Met à jour le state
                  setForm({ ...form, amount: value });
                }}
                required
              />
            </div>


            {/* Buttons */}
            <Button type="submit" className="w-full">
              {editingBudget ? 'Update' : 'Create'}
            </Button>

            <Button variant="outline" type="button" className="w-full" onClick={handleClosePanel}>Cancel</Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

