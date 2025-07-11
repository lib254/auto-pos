import React from 'react';
import { X } from 'lucide-react';
import { Transaction, Customer, Product } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  customer: Customer | null;
  products: Product[];
}

export const TransactionDetailsModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  transaction,
  customer,
  products
}) => {
  if (!isOpen) return null;

  const getProductDetails = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Transaction Details</h2>
            <p className="text-sm text-gray-600">Reference: {transaction.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Transaction Type</h3>
              <p className="mt-1 text-sm text-gray-900 capitalize">{transaction.type}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date</h3>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(transaction.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
              <p className="mt-1 text-sm text-gray-900 capitalize">{transaction.paymentMethod}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1 text-sm text-gray-900 capitalize">{transaction.status}</p>
            </div>
          </div>

          {customer && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Customer Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{customer.name}</p>
                <p className="text-sm text-gray-600">{customer.phone}</p>
                <p className="text-sm text-gray-600">{customer.email}</p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Items</h3>
            <div className="border rounded-lg divide-y">
              {transaction.items.map((item) => {
                const product = getProductDetails(item.productId);
                return (
                  <div key={item.productId} className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{product?.name || 'Unknown Product'}</p>
                        <p className="text-sm text-gray-600">SKU: {product?.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {item.quantity} × Ksh{item.price.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Subtotal: Ksh{(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">Ksh{transaction.total.toFixed(2)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-green-600">
                  -Ksh{((transaction.total * transaction.discount) / 100).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>Ksh{(transaction.total - (transaction.total * transaction.discount / 100)).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};