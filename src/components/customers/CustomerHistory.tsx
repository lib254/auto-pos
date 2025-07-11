import React from 'react';
import { X } from 'lucide-react';
import { Customer, Transaction } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  transactions: Transaction[];
}

export const CustomerHistory: React.FC<Props> = ({ isOpen, onClose, customer, transactions }) => {
  if (!isOpen) return null;

  const customerTransactions = transactions.filter(
    t => t.customerId === customer.id
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">{customer.name}'s History</h2>
            <p className="text-sm text-gray-600">Customer Code: {customer.code}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600">Total Purchases</div>
            <div className="text-2xl font-bold text-blue-700">
              Ksh{customerTransactions
                .filter(t => t.type === 'sale')
                .reduce((sum, t) => sum + t.total, 0)
                .toFixed(2)}
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600">Total Payments</div>
            <div className="text-2xl font-bold text-green-700">
              Ksh{customerTransactions
                .filter(t => t.type === 'payment')
                .reduce((sum, t) => sum + t.total, 0)
                .toFixed(2)}
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-orange-600">Outstanding Balance</div>
            <div className="text-2xl font-bold text-orange-700">
              Ksh{customer.previousBalance.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="h-[calc(100vh-300px)] overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customerTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      transaction.type === 'sale' 
                        ? 'bg-blue-100 text-blue-800'
                        : transaction.type === 'payment'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{transaction.id}</td>
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