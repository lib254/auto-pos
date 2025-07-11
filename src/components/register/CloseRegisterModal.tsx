import React, { useState } from 'react';
import { X } from 'lucide-react';
import { RegisterSession } from '../../types/register';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCloseRegister: (closingBalance: number, notes?: string) => void;
  currentSession: RegisterSession;
}

export const CloseRegisterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCloseRegister,
  currentSession
}) => {
  const [closingBalance, setClosingBalance] = useState<number>(0);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const difference = closingBalance - currentSession.expectedBalance;
  const status = difference === 0 ? 'balanced' : difference > 0 ? 'excess' : 'shortage';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCloseRegister(closingBalance, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Close Register</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Expected Balance:</span>
            <span className="font-medium">Ksh{currentSession.expectedBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cash:</span>
            <span className="font-medium">Ksh{currentSession.paymentTotals.cash.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Card:</span>
            <span className="font-medium">Ksh{currentSession.paymentTotals.card.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Mobile Money:</span>
            <span className="font-medium">Ksh{currentSession.paymentTotals.mobile.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Closing Balance
            </label>
            <input
              type="number"
              value={closingBalance}
              onChange={(e) => setClosingBalance(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min="0"
              step="0.01"
              required
            />
          </div>

          {closingBalance > 0 && (
            <div className={`p-3 rounded-lg ${
              status === 'balanced' ? 'bg-green-50 text-green-700' :
              status === 'excess' ? 'bg-blue-50 text-blue-700' :
              'bg-red-50 text-red-700'
            }`}>
              {status === 'balanced' ? 'Register is balanced' :
               status === 'excess' ? `Excess: $${difference.toFixed(2)}` :
               `Shortage: $${Math.abs(difference).toFixed(2)}`}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              placeholder="Add any closing notes..."
            />
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Close Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};