import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TransactionList from '../TransactionList';

const mockTransactions = [
  {
    _id: '1',
    amount: 50.00,
    description: 'Grocery Store',
    type: 'expense',
    date: '2024-01-15T10:30:00Z',
    category: { name: 'Food', icon: '🍔', color: '#FF5733' },
    account: { name: 'Checking' }
  },
  {
    _id: '2',
    amount: 3000.00,
    description: 'Salary',
    type: 'income',
    date: '2024-01-01T08:00:00Z',
    category: { name: 'Salary', icon: '💰', color: '#28B463' },
    account: { name: 'Checking' }
  },
  {
    _id: '3',
    amount: 120.00,
    description: 'Electric Bill',
    type: 'expense',
    date: '2024-01-10T14:00:00Z',
    category: { name: 'Utilities', icon: '⚡', color: '#F39C12' },
    account: { name: 'Savings' }
  }
];

describe('TransactionList Component', () => {
  it('should render all transactions', () => {
    render(<TransactionList transactions={mockTransactions} />);

    expect(screen.getByText('Grocery Store')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Electric Bill')).toBeInTheDocument();
  });

  it('should display transaction amounts correctly', () => {
    render(<TransactionList transactions={mockTransactions} />);

    expect(screen.getByText('€50.00')).toBeInTheDocument();
    expect(screen.getByText('€3000.00')).toBeInTheDocument();
    expect(screen.getByText('€120.00')).toBeInTheDocument();
  });

  it('should show category icons', () => {
    render(<TransactionList transactions={mockTransactions} />);

    expect(screen.getByText('🍔')).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('should distinguish between income and expense', () => {
    const { container } = render(<TransactionList transactions={mockTransactions} />);

    const incomeElements = container.querySelectorAll('.text-green-600');
    const expenseElements = container.querySelectorAll('.text-red-600');

    expect(incomeElements.length).toBeGreaterThan(0);
    expect(expenseElements.length).toBeGreaterThan(0);
  });

  it('should show empty state when no transactions', () => {
    render(<TransactionList transactions={[]} />);

    expect(screen.getByText(/no transactions/i)).toBeInTheDocument();
  });

  it('should handle transaction click', () => {
    const handleClick = vi.fn();
    render(
      <TransactionList
        transactions={mockTransactions}
        onTransactionClick={handleClick}
      />
    );

    fireEvent.click(screen.getByText('Grocery Store'));
    expect(handleClick).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it('should filter by account', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        filterAccount="Checking"
      />
    );

    expect(screen.getByText('Grocery Store')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.queryByText('Electric Bill')).not.toBeInTheDocument();
  });

  it('should sort transactions by date descending', () => {
    render(<TransactionList transactions={mockTransactions} sortBy="date" />);

    const descriptions = screen.getAllByTestId('transaction-description');
    expect(descriptions[0]).toHaveTextContent('Grocery Store'); // Most recent
    expect(descriptions[2]).toHaveTextContent('Salary'); // Oldest
  });
});
