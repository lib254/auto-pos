import { useState, useEffect } from 'react';
import { Search, Download } from 'lucide-react';
import { storage } from '../utils/storage';
import { Transaction, Customer, Product } from '../types';
import { RefundModal } from '../components/history/RefundModal';
import { TransactionDetailsModal } from '../components/history/TransactionDetailsModal';
import { generateTransactionReference } from '../utils/transactionUtils';
import { useRegister } from '../hooks/useRegister';

const HistoryPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { currentSession, recordTransaction } = useRegister();

  useEffect(() => {
    setTransactions(storage.getTransactions());
    setCustomers(storage.getCustomers());
    setProducts(storage.getProducts());
    setDateFilter('today');
  }, []);

  const getCustomer = (customerId?: string) => {
    if (!customerId) return null;
    return customers.find(c => c.id === customerId) || null;
  };

  const handleRefund = (refundData: {
    originalTransaction: Transaction;
    items: any[];
    method: 'cash' | 'mobile' | 'exchange';
    amount: number;
  }) => {
    if (!currentSession) {
      alert('No open register session. Please open a register session first.');
      return;
    }

    const customer = getCustomer(refundData.originalTransaction.customerId);
    
    // Create refund transaction
    const refundTransaction: Transaction = {
      id: generateTransactionReference(),
      type: 'refund',
      customerId: refundData.originalTransaction.customerId,
      items: refundData.items,
      total: refundData.amount,
      discount: 0,
      paymentMethod: refundData.method,
      paymentDetails: `Refund for ${refundData.originalTransaction.id}`,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    // Update customer balance if exists and has debt
    if (customer && customer.previousBalance > 0) {
      const updatedCustomers = customers.map(c =>
        c.id === customer.id
          ? { ...c, previousBalance: c.previousBalance - refundData.amount }
          : c
      );
      storage.setCustomers(updatedCustomers);
      setCustomers(updatedCustomers);
    }

    // Update product quantities
    const updatedProducts = products.map(product => {
      const refundItem = refundData.items.find(item => item.productId === product.id);
      if (refundItem) {
        return {
          ...product,
          quantity: product.quantity + refundItem.quantity
        };
      }
      return product;
    });

    // Save refund transaction and reflect it in the register
    const updatedTransactions = [...transactions, refundTransaction];
    storage.setTransactions(updatedTransactions);
    storage.setProducts(updatedProducts);

    setTransactions(updatedTransactions);
    setProducts(updatedProducts);
    setIsRefundModalOpen(false);
    setSelectedTransaction(null);

    // Record the refund in the register session
    recordTransaction(refundTransaction);
  };

  const calculateTotals = () => {
    const totals = {
      sales: 0,
      purchases: 0,
      refunds: 0
    };

    transactions.forEach(transaction => {
      switch (transaction.type) {
        case 'sale':
          totals.sales += transaction.total;
          break;
        case 'purchase':
          totals.purchases += transaction.total;
          break;
        case 'refund':
          totals.refunds += transaction.total;
          break;
      }
    });

    return totals;
  };

  const filterTransactions = () => {
    return transactions.filter(transaction => {
      const matchesSearch = 
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.customerId && getCustomer(transaction.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = !typeFilter || transaction.type === typeFilter;
      
      let matchesDate = true;
      if (dateFilter) {
        const txDate = new Date(transaction.createdAt);
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        
        switch (dateFilter) {
          case 'today':
            matchesDate = txDate >= startOfDay;
            break;
          case 'week':
            const startOfWeek = new Date(startOfDay);
            startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
            matchesDate = txDate >= startOfWeek;
            break;
          case 'month':
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            matchesDate = txDate >= startOfMonth;
            break;
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });
  };

  const totals = calculateTotals();
  const filteredTransactions = filterTransactions();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <button className="flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Types</option>
            <option value="sale">Sales</option>
            <option value="purchase">Purchases</option>
            <option value="refund">Refunds</option>
            <option value="payment">Payments</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600">Total Sales</div>
            <div className="text-2xl font-bold text-green-700">
              Ksh{totals.sales.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600">Total Purchases</div>
            <div className="text-2xl font-bold text-blue-700">
              Ksh{totals.purchases.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-600">Total Refunds</div>
            <div className="text-2xl font-bold text-red-700">
              Ksh{totals.refunds.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="h-[calc(100vh-300px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer/Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                const customer = getCustomer(transaction.customerId);
                return (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        transaction.type === 'sale'
                          ? 'bg-green-100 text-green-800'
                          : transaction.type === 'refund'
                          ? 'bg-red-100 text-red-800'
                          : transaction.type === 'payment'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{transaction.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer ? customer.name : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      Ksh{transaction.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setIsDetailsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                      {transaction.type === 'sale' && transaction.status === 'completed' && (
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setIsRefundModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTransaction && (
        <>
          <RefundModal
            isOpen={isRefundModalOpen}
            onClose={() => {
              setIsRefundModalOpen(false);
              setSelectedTransaction(null);
            }}
            transaction={selectedTransaction}
            onRefund={handleRefund}
            customer={getCustomer(selectedTransaction.customerId)}
          />

          <TransactionDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedTransaction(null);
            }}
            transaction={selectedTransaction}
            customer={getCustomer(selectedTransaction.customerId)}
            products={products}
          />
        </>
      )}
    </div>
  );
};

export default HistoryPage;