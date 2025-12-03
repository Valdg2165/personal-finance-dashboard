import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';


export default function BudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: '', period: '', amount: '' });
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
    // Pour l'instant, juste renvoyer le montant total
    return parseFloat(budget.amount);
  };


  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newBudget = {
      ...form,
      createdAt: new Date(), // <-- date actuelle
      remaining: parseFloat(form.amount),
    };
    setBudgets([...budgets, newBudget]);
    setForm({ category: '', period: '', amount: '' });
    setOpen(false);
  };

  return (
    <div className="p-6 flex gap-6">
      {/* Main content */}
      <Button onClick={() => setOpen(true)}>Add a Budget</Button>

      <Button
        variant="outline"
        className="fixed bottom-4 left-4 z-50"
        onClick={() => navigate('/dashboard')}
      >
        Dashboard
      </Button>


      <div className="flex-1 ">

        {/* Message si aucun budget */}
        {budgets.length === 0 ? (
          <div className="absolute inset-0 flex justify-center items-center">
            <p className="text-center text-gray-500 text-xl font-medium">
              Click on <span className="font-semibold">"Add a Budget"</span> to set up your first budget
            </p>
          </div>
        ) : (

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-6xl">
            {budgets.map((b, i) => {
              const category = categories.find(c => c.name === b.category);
              const remainingPercent = (b.remaining / b.amount) * 100;
              const remainingColor = remainingPercent < 20 ? 'text-red-500' : 'text-green-500';
              return (
                <Card key={i} className="p-6 flex flex-col justify-center items-center min-h-48 h-auto shadow-lg text-center">                <CardHeader className="mb-2">
                  <CardTitle className="text-xl -mb-1 text-center whitespace-nowrap overflow-hidden text-ellipsis">
                    {category?.emoji} {b.category}
                  </CardTitle>
                </CardHeader>
                  <CardContent className="flex flex-col justify-center items-center mt-2">
                    <p className="text-md text-gray-500 font-medium">
                      {b.period >= 12
                        ? `${Math.floor(b.period / 12)} year${b.period >= 24 ? 's' : ''}`
                        : `${b.period} month${b.period === 1 ? '' : 's'}`}
                    </p>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                      {getTimeRemaining(b)} Left
                    </p>
                    <p className="mt-3 text-3xl font-bold">{b.amount}€</p>
                    <p className={`mt-2 font-bold ${remainingColor}`}>
                      {b.remaining}€ Left
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>


      {/* Side panel */}
      {open && (
        <div className="w-80 p-4 bg-white border-l shadow-md flex flex-col gap-4">
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

            <Button type="submit" className="w-full">Create</Button>
            <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>Cancel</Button>

          </form>
        </div>
      )}
    </div>
  );
}