import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { transactionAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

// Spending Trend Chart (Line Chart)
export default function SpendingTrendChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30days');

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

      if (transactions.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      // Get date range based on actual transaction dates
      const transactionDates = transactions.map(t => new Date(t.date).getTime());
      const oldestDate = new Date(Math.min(...transactionDates));
      const newestDate = new Date(Math.max(...transactionDates));
      
      // Calculate period start date
      let startDate;
      if (period === 'all') {
        startDate = oldestDate;
      } else {
        const daysAgo = period === '7days' ? 7 : period === '30days' ? 30 : 90;
        // Use the newest transaction date as reference, not today
        startDate = new Date(newestDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        
        // If start date is before oldest transaction, use all data
        if (startDate < oldestDate) {
          startDate = oldestDate;
        }
      }

      // Filter transactions by date range
      const filteredTransactions = transactions.filter(t => 
        new Date(t.date) >= startDate
      );

      // Group by date
      const groupedByDate = {};
      filteredTransactions.forEach(transaction => {
        const date = new Date(transaction.date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
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
        // Parse French date format
        const parseDate = (dateStr) => {
          const months = {
            'janv.': 0, 'févr.': 1, 'mars': 2, 'avr.': 3, 'mai': 4, 'juin': 5,
            'juil.': 6, 'août': 7, 'sept.': 8, 'oct.': 9, 'nov.': 10, 'déc.': 11
          };
          const parts = dateStr.split(' ');
          const day = parseInt(parts[0]);
          const month = months[parts[1]] || 0;
          const year = parseInt(parts[2]);
          return new Date(year, month, day);
        };
        return parseDate(a.date) - parseDate(b.date);
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
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
                angle={-45}
                textAnchor="end"
                height={80}
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
                animationDuration={1000}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
                name="Expenses"
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
