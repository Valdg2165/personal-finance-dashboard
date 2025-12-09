import { useState, useEffect, useCallback, useRef } from 'react';
import { transactionAPI } from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { formatCurrency, highlightText } from '../../lib/utils';
import { ArrowUpCircle, ArrowDownCircle, Edit2, Search, X, Loader2 } from 'lucide-react';
import TransactionEdit from './TransactionEdit';

// Simple date formatter to avoid Intl issues
const formatTransactionDate = (date) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('fr-FR', options);
  } catch (error) {
    console.error('Date error:', error);
    return new Date(date).toISOString().split('T')[0];
  }
};

// MODIFICATION 1 : Accepter la prop 'filters'
export default function TransactionList({ filters = {} }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // Filtre local (Income/Expense)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const searchTimeoutRef = useRef(null);

  // Stringify filters to avoid dependency issues with object reference
  const filtersString = JSON.stringify(filters);

  // MODIFICATION 2 : Inclure la prop 'filters' dans la logique de dépendance
  const fetchTransactions = useCallback(async () => {
    const parsedFilters = JSON.parse(filtersString);
    try {
      setError(null);
      setLoading(true);

      // Fusion des filtres locaux et globaux (prop 'filters')
      const params = {
        ...parsedFilters, // Filtres Date/Catégorie/etc. provenant du Dashboard
      };
      
      // Ajout des filtres gérés localement (Type et Recherche textuelle)
      if (filter !== 'all') params.type = filter;
      
      // On utilise le filtre de recherche textuelle géré en local (debounced)
      if (searchQuery.trim()) params.search = searchQuery.trim(); 
      
      // Nettoyage des clés vides pour éviter des requêtes inutiles
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '' || (Array.isArray(params[key]) && params[key].length === 0)) {
          delete params[key];
        }
      });
      
      const response = await transactionAPI.getAll(params);
      // Assurez-vous d'accéder correctement à l'array de transactions
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery, filtersString]); // Use stringified version to avoid reference issues

  // MODIFICATION 3 : Déclenchement de la récupération lors du changement de 'filters'
  // On combine la dépendance à fetchTransactions avec la dépendance 'filters'
  useEffect(() => {
    fetchTransactions();

    // Listen for updates (external events like transaction creation/update)
    const handleUpdate = () => {
      fetchTransactions();
    };

    window.addEventListener('transactionsUpdated', handleUpdate);
    return () => window.removeEventListener('transactionsUpdated', handleUpdate);
  }, [fetchTransactions]); // fetchTransactions dépend déjà de 'filters', donc c'est suffisant

  // Debounced search - trigger search after user stops typing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500); // 500ms delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      clearSearch();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center items-center">
          <Loader2 className="h-6 w-6 mr-2 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading transactions...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filter === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('income')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filter === 'income'
                      ? 'bg-green-600 text-white'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  Income
                </button>
                <button
                  onClick={() => setFilter('expense')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    filter === 'expense'
                      ? 'bg-red-600 text-white'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  Expenses
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                {loading && searchQuery ? (
                  <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  type="text"
                  placeholder="Search transactions by description, merchant, notes, or tags..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-10"
                />
                {(searchInput || searchQuery) && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear search (Esc)"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>

            {searchQuery && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Searching for: <span className="font-medium text-foreground">"{searchQuery}"</span></span>
                <button
                  onClick={clearSearch}
                  className="text-primary hover:underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? (
                <>
                  <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No transactions found matching "{searchQuery}"</p>
                  <p className="text-sm mt-2">Try different keywords or clear the search.</p>
                </>
              ) : (
                <>
                  <p>No transactions yet.</p>
                  <p className="text-sm mt-2">Import a CSV file to get started!</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const description = transaction.description || 'Unknown transaction';
                const amount = transaction.amount || 0;
                const currency = transaction.currency || 'EUR';
                const type = transaction.type || 'expense';
                
                return (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`p-2 rounded-full ${
                          type === 'income'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {type === 'income' ? (
                          <ArrowUpCircle className="h-5 w-5" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p 
                          className="font-medium" 
                          dangerouslySetInnerHTML={{ 
                            __html: searchQuery ? highlightText(description, searchQuery) : description 
                          }}
                        />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatTransactionDate(transaction.date)}</span>
                          {transaction.category && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <span>{transaction.category.icon}</span>
                                <span>{transaction.category.name}</span>
                              </span>
                            </>
                          )}
                          {transaction.account && (
                            <>
                              <span>•</span>
                              <span>{transaction.account.name}</span>
                            </>
                          )}
                        </div>
                        {transaction.merchant?.name && searchQuery && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Merchant: <span 
                              dangerouslySetInnerHTML={{ 
                                __html: highlightText(transaction.merchant.name, searchQuery) 
                              }}
                            />
                          </div>
                        )}
                        {transaction.notes && searchQuery && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Note: <span 
                              dangerouslySetInnerHTML={{ 
                                __html: highlightText(transaction.notes, searchQuery) 
                              }}
                            />
                          </div>
                        )}
                        {transaction.tags && transaction.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {transaction.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-secondary px-2 py-0.5 rounded-full"
                                dangerouslySetInnerHTML={{ 
                                  __html: searchQuery ? highlightText(tag, searchQuery) : tag 
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {type === 'income' ? '+' : '-'}
                          {formatCurrency(amount, currency)}
                        </p>
                        {transaction.categoryConfidence && transaction.categoryConfidence < 0.7 && (
                          <p className="text-xs text-amber-600">Low confidence</p>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingTransaction(transaction)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-accent rounded-md"
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingTransaction && (
        <TransactionEdit
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSaved={() => {
            setEditingTransaction(null);
            // Déclenche un rafraîchissement des transactions après la sauvegarde
            fetchTransactions(); 
          }}
        />
      )}
    </>
  );
}