import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { transactionAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

// Spending Trend Chart (Line Chart)
export default function SpendingTrendChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

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
      let transactions = response.data.data || [];

      if (transactions.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      // Sort transactions by date
      transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Filter by period if not "all"
      if (period !== 'all') {
        const daysToShow = period === '7days' ? 7 : period === '30days' ? 30 : 90;
        const mostRecentDate = new Date(transactions[transactions.length - 1].date);
        const cutoffDate = new Date(mostRecentDate);
        cutoffDate.setDate(cutoffDate.getDate() - daysToShow);
        
        transactions = transactions.filter(t => new Date(t.date) >= cutoffDate);
      }

      // Group by date
      const groupedByDate = {};
      transactions.forEach(transaction => {
        const dateObj = new Date(transaction.date);
        const dateKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
        const displayDate = dateObj.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short'
        });
        
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = { 
            date: displayDate, 
            sortDate: dateKey,
            income: 0, 
            expenses: 0 
          };
        }
        
        if (transaction.type === 'income') {
          groupedByDate[dateKey].income += transaction.amount;
        } else {
          groupedByDate[dateKey].expenses += transaction.amount;
        }
      });

      // Convert to array and sort
      const chartData = Object.values(groupedByDate).sort((a, b) => 
        a.sortDate.localeCompare(b.sortDate)
      );

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
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                period === '7days'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                period === '30days'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setPeriod('90days')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                period === '90days'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              90 Days
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                period === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No transactions available
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ bottom: 20, left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
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
                dot={{ fill: '#10b981', r: 4 }}
                name="Income"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
