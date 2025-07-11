import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { PaymentMethod, Transaction } from '../../types';

import { RegisterSession } from '../../types/register';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (transaction: Transaction) => void;
  currentSession?: RegisterSession | null;
}

export const WithdrawMoneyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onWithdraw,
  currentSession
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDetails, setPaymentDetails] = useState('');

  if (!isOpen || !currentSession) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const transaction: Transaction = {
      id: `WD-${Date.now()}`,
      type: 'purchase',
      items: [],
      total: amount,
      discount: 0,
      paymentMethod,
      payments: [
        {
          method: paymentMethod,
          amount: amount,
          details: paymentDetails
        }
      ],
      paymentDetails,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    onWithdraw(transaction);
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
          <h2 className="text-xl font-semibold">Withdraw Money from Register</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cash Available:</span>
            <span className="font-medium">Ksh{currentSession.paymentTotals.cash.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total in Register:</span>
            <span className="font-medium">Ksh{(
              currentSession.paymentTotals.cash +
              currentSession.paymentTotals.card +
              currentSession.paymentTotals.mobile
            ).toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount to Withdraw
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
                max={currentSession.paymentTotals.cash}
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
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Withdrawal Details
            </label>
            <textarea
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              placeholder="Add withdrawal reason and any reference details..."
              required
            />
          </div>

          {amount > 0 && (
            <div className={`p-3 rounded-lg ${
              amount > currentSession.paymentTotals.cash
                ? 'bg-red-50 text-red-700'
                : 'bg-blue-50 text-blue-700'
            }`}>
              {amount > currentSession.paymentTotals.cash
                ? 'Insufficient cash in register'
                : `New cash balance will be: Ksh${(currentSession.paymentTotals.cash - amount).toFixed(2)}`}
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
              disabled={amount > currentSession.paymentTotals.cash}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Withdraw Money
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};