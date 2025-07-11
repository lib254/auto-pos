import React from 'react';
import { X } from 'lucide-react';
import { HeldTransaction } from '../../types/pos';
import { storage } from '../../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRetrieve: (transaction: HeldTransaction) => void;
  heldTransactions: HeldTransaction[];
}

export const RetrieveHeldTransactionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRetrieve,
  heldTransactions
}) => {
  if (!isOpen) return null;

  const getCustomerName = (customerId?: string) => {
    if (!customerId) return 'No Customer';
    const customers = storage.getCustomers();
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const formatTotal = (transaction: HeldTransaction) => {
    const total = transaction.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return total - (total * transaction.discount / 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Retrieve Held Transaction</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {heldTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No held transactions</p>
        ) : (
          <div className="space-y-4">
            {heldTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  onRetrieve(transaction);
                  onClose();
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {getCustomerName(transaction.customerId)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-medium">
                    Ksh{formatTotal(transaction).toFixed(2)}
                  </p>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Items: {transaction.items.length}
                  </p>
                  {transaction.note && (
                    <p className="text-sm text-gray-600 mt-1">
                      Note: {transaction.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};