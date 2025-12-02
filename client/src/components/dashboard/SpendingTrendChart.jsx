import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { transactionAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

// Spending Trend Chart (Line Chart)
export default function SpendingTrendChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7days'); // 7days, 30days, 90days

  useEffect(() => {
    fetchData();
  }, [period]);

  useEffect(() => {
    const handleUpdate = () => fetchData();
    window.addEventListener('transactionsUpdated', handleUpdate);
    return () => window.removeEventListener('transactionsUpdated', handleUpdate);
  }, [period]);

  const fetchData = async () => {
    try {
      const response = await transactionAPI.getAll();
      const transactions = response.data.data || [];

      // Get date range
      const now = new Date();
      const daysAgo = period === '7days' ? 7 : period === '30days' ? 30 : 90;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Filter transactions by date range
      const filteredTransactions = transactions.filter(t => 
        new Date(t.date) >= startDate
      );

      // Group by date
      const groupedByDate = {};
      filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short'
        });
        
        if (!groupedByDate[date]) {
          groupedByDate[date] = { date, income: 0, expenses: 0 };
        }
        
        if (transaction.type === 'income') {
          groupedByDate[date].income += transaction.amount;
        } else {
          groupedByDate[date].expenses += transaction.amount;
        }
      });

      // Convert to array and sort by date
      const chartData = Object.values(groupedByDate).sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });

      setData(chartData);
    } catch (error) {
      console.error('Error fetching trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading chart...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Spending Trends</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('7days')}
              className={`px-3 py-1 text-xs rounded-md ${
                period === '7days'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-3 py-1 text-xs rounded-md ${
                period === '30days'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setPeriod('90days')}
              className={`px-3 py-1 text-xs rounded-md ${
                period === '90days'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No data available for this period
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value) => `€${value.toFixed(2)}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
                name="Income"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444' }}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
