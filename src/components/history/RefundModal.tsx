import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Transaction, TransactionItem, Customer } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  onRefund: (refundData: {
    originalTransaction: Transaction;
    items: TransactionItem[];
    method: 'cash' | 'mobile' | 'exchange';
    amount: number;
  }) => void;
  customer: Customer | null;
}

export const RefundModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  transaction, 
  onRefund,
  customer 
}) => {
  const [selectedItems, setSelectedItems] = useState<TransactionItem[]>([]);
  const [refundMethod, setRefundMethod] = useState<'cash' | 'mobile' | 'exchange'>('cash');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const hasOutstandingBalance = customer?.previousBalance && customer.previousBalance > 0;

  const handleQuantityChange = (itemId: string, quantity: number, maxQuantity: number) => {
    // Ensure quantity is not negative and doesn't exceed original quantity
    const validQuantity = Math.max(0, Math.min(quantity, maxQuantity));
    setQuantities({ ...quantities, [itemId]: validQuantity });
  };

  const handleItemSelect = (item: TransactionItem) => {
    const isSelected = selectedItems.some(i => i.productId === item.productId);
    if (isSelected) {
      setSelectedItems(selectedItems.filter(i => i.productId !== item.productId));
      const newQuantities = { ...quantities };
      delete newQuantities[item.productId];
      setQuantities(newQuantities);
    } else {
      setSelectedItems([...selectedItems, item]);
      setQuantities({ ...quantities, [item.productId]: 1 });
    }
  };

  const calculateRefundAmount = () => {
    return selectedItems.reduce((total, item) => {
      const quantity = quantities[item.productId] || 0;
      return total + (item.price * quantity);
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refundItems = selectedItems.map(item => ({
      ...item,
      quantity: quantities[item.productId] || 0
    }));

    onRefund({
      originalTransaction: transaction,
      items: refundItems,
      // If customer has debt, force refund method to be deducted from balance
      method: hasOutstandingBalance ? 'exchange' : refundMethod,
      amount: calculateRefundAmount()
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Process Refund</h2>
            <p className="text-sm text-gray-600">Reference: {transaction.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {hasOutstandingBalance && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Note: This customer has an outstanding balance of Ksh{customer?.previousBalance?.toFixed(2)}. 
              The refund amount will be deducted from their debt.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Select Items to Refund</h3>
            <div className="border rounded-lg divide-y">
              {transaction.items.map((item) => (
                <div key={item.productId} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.some(i => i.productId === item.productId)}
                      onChange={() => handleItemSelect(item)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">Product ID: {item.productId}</p>
                      <p className="text-sm text-gray-600">
                        Original Quantity: {item.quantity} × ${item.price}
                      </p>
                    </div>
                  </div>
                  {selectedItems.some(i => i.productId === item.productId) && (
                    <input
                      type="number"
                      min="1"
                      max={item.quantity}
                      value={quantities[item.productId] || 1}
                      onChange={(e) => handleQuantityChange(
                        item.productId, 
                        parseInt(e.target.value), 
                        item.quantity
                      )}
                      className="w-20 px-2 py-1 border rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Only show refund method if customer has no debt */}
          {!hasOutstandingBalance && (
            <div>
              <h3 className="font-medium mb-2">Refund Method</h3>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as any)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="cash">Cash Refund</option>
                <option value="mobile">Mobile Money</option>
                <option value="exchange">Product Exchange</option>
              </select>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Refund Amount</div>
            <div className="text-2xl font-bold">Ksh{calculateRefundAmount().toFixed(2)}</div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedItems.length === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              Process Refund
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};