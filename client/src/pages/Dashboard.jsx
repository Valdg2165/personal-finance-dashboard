import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import StatsCards from '../components/dashboard/StatsCards';
import TransactionImport from '../components/transactions/TransactionImport';
import CreateTransaction from '../components/transactions/CreateTransaction';
import ConnectBank from '../components/bank/ConnectBank';
import TransactionList from '../components/transactions/TransactionList';
import SpendingTrendChart from '../components/dashboard/SpendingTrendChart';
import CategoryBreakdownChart from '../components/dashboard/CategoryBreakdownChart';
import MonthlyComparisonChart from '../components/dashboard/MonthlyComparisonChart';
import { LogOut, Plus, Sun, Moon, Filter, X } from 'lucide-react';
import { categoryAPI } from '../services/api'; // Assurez-vous d'importer l'API category

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);

  // --- NOUVEAU : État pour les filtres ---
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: ''
  });
  
  // État pour stocker les catégories (pour le select)
  const [categories, setCategories] = useState([]);

  // Charger les catégories au montage
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryAPI.getAll();
        // Adapter selon la structure de réponse de votre API (ex: response.data.data ou response.data)
        setCategories(response.data.data || response.data || []);
      } catch (error) {
        console.error("Failed to load categories for filter", error);
      }
    };
    fetchCategories();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTransactionCreated = () => {
    setShowCreateTransaction(false);
    // Idéalement, ici on pourrait déclencher un rafraîchissement de la liste
  };

  // Gestion des changements de filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Réinitialiser les filtres
  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', category: '' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Navigation */}
      <nav className="bg-card border-b sticky top-0 z-10 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">💰 Finance Dashboard</h1>
            <div className="flex items-center gap-3">
              <Button 
                size="sm" 
                onClick={() => setShowCreateTransaction(!showCreateTransaction)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Transaction
              </Button>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, {user?.firstName}!
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
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/accounts')}>
                Accounts
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <StatsCards />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SpendingTrendChart />
          <CategoryBreakdownChart />
        </div>

        {/* Monthly Overview - Full Width */}
        <MonthlyComparisonChart />

        {/* Import & Transactions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Import Section (Left Column) */}
          <div className="lg:col-span-1 space-y-4">
            <TransactionImport />
            <ConnectBank />
          </div>

          {/* Transactions List (Right Column) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* --- NOUVEAU : UI FILTRES --- */}
            <div className="bg-card rounded-lg p-4 border shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Filters
                </h3>
                {(filters.startDate || filters.endDate || filters.category) && (
                  <button 
                    onClick={clearFilters}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Date Début */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">From</label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="w-full text-sm p-2 rounded border bg-background text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Date Fin */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">To</label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="w-full text-sm p-2 rounded border bg-background text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Catégorie */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Category</label>
                  <select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="w-full text-sm p-2 rounded border bg-background text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Liste des transactions avec les filtres passés en props */}
            <TransactionList filters={filters} />
          </div>
        </div>
      </main>

      {/* Create Transaction Modal */}
      {showCreateTransaction && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateTransaction(false)}
        >
          <div 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CreateTransaction 
              onTransactionCreated={handleTransactionCreated}
              onCancel={() => setShowCreateTransaction(false)}
            />
          </div>
        </div>
      )}
    </div>
  );

  
}