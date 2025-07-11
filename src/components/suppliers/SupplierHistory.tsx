import React from 'react';
import { X } from 'lucide-react';
import { Supplier, Transaction } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier;
  transactions: Transaction[];
}

export const SupplierHistory: React.FC<Props> = ({ isOpen, onClose, supplier, transactions }) => {
  if (!isOpen) return null;

  const supplierTransactions = transactions.filter(
    t => t.supplierId === supplier.id && t.type === 'purchase'
  );

  const totalPurchases = supplierTransactions.reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">{supplier.name}'s History</h2>
            <p className="text-sm text-gray-600">Supplier Code: {supplier.code}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="text-sm text-blue-600">Total Purchases</div>
          <div className="text-2xl font-bold text-blue-700">
            Ksh{totalPurchases.toFixed(2)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supplierTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{transaction.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{transaction.items.length} items</td>
                  <td className="px-6 py-4 whitespace-nowrap">Ksh{transaction.total.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{transaction.paymentMethod}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      transaction.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};