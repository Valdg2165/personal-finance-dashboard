import { useState, useEffect } from 'react';
import { transactionAPI, accountAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';
import { TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react';

export default function StatsCards() {
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [accountsRes, transactionsRes] = await Promise.all([
        accountAPI.getAll(),
        transactionAPI.getAll(),
      ]);

      const accounts = accountsRes.data.data;
      const transactions = transactionsRes.data.data;

      const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
      const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({
        totalBalance,
        totalIncome,
        totalExpenses,
        transactionCount: transactions.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Listen for updates
    const handleUpdate = () => fetchStats();
    window.addEventListener('transactionsUpdated', handleUpdate);
    return () => window.removeEventListener('transactionsUpdated', handleUpdate);
  }, []);

  const cards = [
    {
      title: 'Total Balance',
      value: formatCurrency(stats.totalBalance),
      icon: Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Income',
      value: formatCurrency(stats.totalIncome),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Expenses',
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Transactions',
      value: stats.transactionCount,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  if (loading) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold mt-2">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
