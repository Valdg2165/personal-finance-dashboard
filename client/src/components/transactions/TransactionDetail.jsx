import { useState, useEffect } from 'react';
import { transactionAPI } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useData } from '../../context/DataContext';

export default function TransactionDetail({ transactionId, onClose }) {
  const [transaction, setTransaction] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const { triggerRefresh } = useData();

  useEffect(() => {
    fetchTransaction();
  }, [transactionId]);

  const fetchTransaction = async () => {
    try {
      const response = await transactionAPI.getOne(transactionId);
      setTransaction(response.data.data);
      setFormData({
        notes: response.data.data.notes || '',
        tags: response.data.data.tags || [],
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await transactionAPI.update(transactionId, formData);
      setEditing(false);
      await fetchTransaction();
      triggerRefresh();
    } catch (error) {
      alert('Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    setLoading(true);
    try {
      await transactionAPI.delete(transactionId);
      triggerRefresh();
      onClose();
    } catch (error) {
      alert('Failed to delete transaction');
    } finally {
      setLoading(false);
    }
  };

  if (!transaction) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction Details</CardTitle>
          <Button variant="ghost" onClick={onClose}>✕</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <p className="font-medium">{transaction.description}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Amount</label>
            <p className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount, transaction.currency)}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Date</label>
            <p>{formatDate(transaction.date)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Category</label>
            <p className="flex items-center gap-2">
              <span>{transaction.category?.icon}</span>
              <span>{transaction.category?.name}</span>
            </p>
          </div>
        </div>

        {editing ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2 border rounded-md"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading}>Save</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </>
        ) : (
          <>
            {transaction.notes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <p>{transaction.notes}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={() => setEditing(true)}>Edit</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                Delete
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}