import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../Dashboard';
import { AuthProvider } from '../../context/AuthContext';
import { DataProvider } from '../../context/DataContext';
import { BrowserRouter } from 'react-router-dom';
import * as api from '../../services/api';

vi.mock('../../services/api');

const mockUser = {
  _id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
};

const mockAccounts = [
  { _id: '1', name: 'Checking', balance: 1000, type: 'checking' },
  { _id: '2', name: 'Savings', balance: 5000, type: 'savings' }
];

const mockTransactions = [
  {
    _id: '1',
    amount: 50,
    description: 'Grocery',
    type: 'expense',
    date: new Date().toISOString(),
    category: { name: 'Food', icon: '🍔' }
  },
  {
    _id: '2',
    amount: 100,
    description: 'Restaurant',
    type: 'expense',
    date: new Date().toISOString(),
    category: { name: 'Food', icon: '🍔' }
  }
];

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Dashboard />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.mocked(api.accountAPI.getAll).mockResolvedValue(mockAccounts);
    vi.mocked(api.transactionAPI.getAll).mockResolvedValue({
      transactions: mockTransactions,
      total: 2
    });
    vi.mocked(api.categoryAPI.getAll).mockResolvedValue([]);
    localStorage.setItem('user', JSON.stringify(mockUser));
  });

  it('should render dashboard title', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it('should display account balances', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Checking')).toBeInTheDocument();
      expect(screen.getByText('Savings')).toBeInTheDocument();
    });
  });

  it('should calculate total balance', async () => {
    renderDashboard();

    await waitFor(() => {
      // Total of 1000 + 5000 = 6000
      expect(screen.getByText(/6000/)).toBeInTheDocument();
    });
  });

  it('should display recent transactions', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Grocery')).toBeInTheDocument();
      expect(screen.getByText('Restaurant')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    renderDashboard();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should have navigation to other pages', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/accounts/i)).toBeInTheDocument();
      expect(screen.getByText(/transactions/i)).toBeInTheDocument();
    });
  });
});
