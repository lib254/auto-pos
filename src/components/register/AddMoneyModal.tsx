import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';

import { PaymentMethod } from '../../types';
import { RegisterSession } from '../../types/register';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddMoney: (amount: number, notes: string, paymentMethod: PaymentMethod) => void;
  currentSession?: RegisterSession | null;
}

export const AddMoneyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAddMoney,
  currentSession
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentDetails, setPaymentDetails] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  if (!isOpen || !currentSession) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMoney(amount, paymentDetails, paymentMethod);
    // Reset form
    setAmount(0);
    setPaymentDetails('');
    setPaymentMethod('cash');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Money to Register</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Current Balance:</span>
            <span className="font-medium">Ksh{currentSession.expectedBalance.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount to Add
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile">Mobile Money</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Details
            </label>
            <textarea
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              placeholder="Add payment details (e.g., source of funds, reference numbers)..."
            />
          </div>

          {amount > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 text-blue-700">
              New balance will be: Ksh{(currentSession.expectedBalance + amount).toFixed(2)}
            </div>
          )}

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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Money
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};