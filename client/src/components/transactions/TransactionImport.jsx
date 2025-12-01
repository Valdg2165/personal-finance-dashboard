import { useState, useEffect } from 'react';
import CreateAccount from '../accounts/CreateAccount';
import { transactionAPI, accountAPI } from '../../services/api';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function TransactionImport() {
  const [file, setFile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Fetch accounts on component mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await accountAPI.getAll();
        setAccounts(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedAccount(response.data.data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching accounts:', err);
      }
    };
    fetchAccounts();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const fileName = selectedFile.name.toLowerCase();
    
    if (validTypes.includes(selectedFile.type) || fileName.endsWith('.csv') || fileName.endsWith('.xlsx')) {
      setFile(selectedFile);
      setError('');
      setResult(null);
    } else {
      setError('Please upload a CSV or Excel file');
      setFile(null);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!selectedAccount) {
      setError('Please select an account');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('accountId', selectedAccount);

      const response = await transactionAPI.import(formData);
      
      setResult(response.data);
      setFile(null);
      
      // Trigger a refresh of transactions
      window.dispatchEvent(new Event('transactionsUpdated'));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import transactions');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Transactions</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Upload a CSV or Excel file from your bank (Revolut, etc.)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account Selection */}
        {accounts.length > 0 ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                No accounts found. Create one below to get started.
              </p>
            </div>
            <CreateAccount onAccountCreated={() => {
              // Refetch accounts
              accountAPI.getAll().then(res => {
                setAccounts(res.data.data);
                if (res.data.data.length > 0) {
                  setSelectedAccount(res.data.data[0]._id);
                }
              });
            }} />
          </div>
        )}

        {/* File Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              <span className="text-primary font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">CSV or Excel files only</p>
          </label>

          {file && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
              <FileText className="h-4 w-4" />
              <span>{file.name}</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">{result.message}</span>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p>✅ Imported: {result.data.imported} transactions</p>
              <p>🔄 Duplicates: {result.data.duplicates}</p>
              <p>❌ Errors: {result.data.errors}</p>
              <p>💰 Account Balance: €{result.data.accountBalance.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!file || !selectedAccount || uploading}
          className="w-full"
        >
          {uploading ? 'Importing...' : 'Import Transactions'}
        </Button>
      </CardContent>
    </Card>
  );
}
