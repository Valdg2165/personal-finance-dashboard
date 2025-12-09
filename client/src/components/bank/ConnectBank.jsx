import { useState, useEffect } from 'react';
import { truelayerAPI, accountAPI } from '../../services/api';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Building2, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function ConnectBank() {
  const [loading, setLoading] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Check for tokens in URL (after redirect from TrueLayer)
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const error = searchParams.get('error');
    
    if (error) {
      alert('Failed to connect bank: ' + error);
      // Clean URL
      setSearchParams({});
      return;
    }
    
    if (accessToken) {
      handleSyncAccounts(accessToken, refreshToken);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      const response = await accountAPI.getAll();
      const connected = response.data.data.filter(
        acc => acc.externalProvider === 'truelayer'
      );
      setConnectedAccounts(connected);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleConnectBank = async () => {
    try {
      setLoading(true);
      const response = await truelayerAPI.connect();
      
      // Redirect to TrueLayer auth page
      window.location.href = response.data.data.authUrl;
    } catch (error) {
      alert('Failed to connect: ' + error.message);
      setLoading(false);
    }
  };

  const handleSyncAccounts = async (accessToken, refreshToken) => {
    try {
      setLoading(true);
      
      const response = await truelayerAPI.syncAccounts({
        accessToken,
        refreshToken,
      });
      
      // Clean URL
      setSearchParams({});
      
      // Refresh accounts list
      await fetchConnectedAccounts();
      
      // Trigger refresh of transactions
      window.dispatchEvent(new Event('transactionsUpdated'));
      
      alert(`✅ ${response.data.message}`);
    } catch (error) {
      alert('Failed to sync accounts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTransactions = async (accountId) => {
    try {
      setLoading(true);
      const response = await truelayerAPI.syncTransactions(accountId);
      
      alert(`✅ ${response.data.message}`);
      
      // Trigger refresh
      window.dispatchEvent(new Event('transactionsUpdated'));
    } catch (error) {
      alert('Failed to sync transactions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Connect Your Bank
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Securely connect your bank account via TrueLayer
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connected Accounts */}
        {connectedAccounts.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Connected Accounts</label>
            {connectedAccounts.map((account) => (
              <div
                key={account._id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.institution?.name} • {account.type}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSyncTransactions(account._id)}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Sync
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Connect Button */}
        <Button
          onClick={handleConnectBank}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4 mr-2" />
              Connect New Bank Account
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Your data is encrypted and secure. Powered by TrueLayer.
        </p>
      </CardContent>
    </Card>
  );
}
