import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
import { LogOut, Plus } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTransactionCreated = () => {
    setShowCreateTransaction(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">💰 Finance Dashboard</h1>
            <div className="flex items-center gap-4">
              <Button 
                size="sm" 
                onClick={() => setShowCreateTransaction(!showCreateTransaction)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Transaction
              </Button>
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.firstName}!
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
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
          {/* Import Section */}
          <div className="lg:col-span-1 space-y-4">
            {showCreateTransaction ? (
              <CreateTransaction 
                onTransactionCreated={handleTransactionCreated}
                onCancel={() => setShowCreateTransaction(false)}
              />
            ) : (
              <TransactionImport />
            )}
            <ConnectBank />
          </div>

          {/* Transactions List */}
          <div className="lg:col-span-2">
            <TransactionList />
          </div>
        </div>
      </main>
    </div>
  );
}
