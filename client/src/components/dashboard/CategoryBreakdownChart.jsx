import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { transactionAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

// Category Breakdown Chart (Pie Chart)
export default function CategoryBreakdownChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('expense'); // expense or income

  useEffect(() => {
    fetchData();
  }, [type]);

  useEffect(() => {
    const handleUpdate = () => fetchData();
    window.addEventListener('transactionsUpdated', handleUpdate);
    return () => window.removeEventListener('transactionsUpdated', handleUpdate);
  }, [type]);

  const fetchData = async () => {
    try {
      const response = await transactionAPI.getAll({ type });
      const transactions = response.data.data || [];

      // Group by category
      const groupedByCategory = {};
      transactions.forEach(transaction => {
        if (!transaction.category) return;
        
        const categoryName = transaction.category.name;
        const categoryIcon = transaction.category.icon;
        
        if (!groupedByCategory[categoryName]) {
          groupedByCategory[categoryName] = {
            name: categoryName,
            value: 0,
            icon: categoryIcon,
          };
        }
        
        groupedByCategory[categoryName].value += transaction.amount;
      });

      // Convert to array and sort by value
      const chartData = Object.values(groupedByCategory)
        .sort((a, b) => b.value - a.value);

      setData(chartData);
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
          <CardTitle>Category Breakdown</CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setType('expense')}
              className={`px-3 py-1 text-xs rounded-md ${
                type === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setType('income')}
              className={`px-3 py-1 text-xs rounded-md ${
                type === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              Income
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No {type} data available
          </p>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `€${value.toFixed(2)}`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend with amounts */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {data.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="flex items-center gap-1">
                    <span>{entry.icon}</span>
                    <span className="text-muted-foreground">{entry.name}</span>
                  </span>
                  <span className="ml-auto font-medium">
                    €{entry.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
