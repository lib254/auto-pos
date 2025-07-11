import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Customer } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onPayment: (payment: {
    amount: number;
    method: 'cash' | 'card' | 'mobile';
    reference: string;
  }) => void;
}

export const DebtPaymentModal: React.FC<Props> = ({ isOpen, onClose, customer, onPayment }) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [sendStkPush, setSendStkPush] = useState(false);
  const [mpesaNo, setMpesaNo] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    let reference = '';
    if (paymentMethod === 'cash') {
      reference = 'CASH';
    } else if (paymentMethod === 'card') {
      reference = formData.get('reference') as string;
    } else if (paymentMethod === 'mobile') {
      if (sendStkPush) {
        reference = mpesaNo;
      } else {
        reference = formData.get('reference') as string;
      }
    }
    onPayment({
      amount: Number(formData.get('amount')),
      method: paymentMethod,
      reference,
      // Optionally, you could pass sendStkPush as a flag if needed in parent
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Debt Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">Customer: {customer.name}</p>
          <p className="text-sm text-gray-600">Outstanding Balance: Ksh{customer.previousBalance}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Amount</label>
            <input
              type="number"
              name="amount"
              max={customer.previousBalance}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'mobile')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile">Mobile Money</option>
            </select>
          </div>


          {/* Card payment: transaction code */}
          {paymentMethod === 'card' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction Code</label>
              <input
                type="text"
                name="reference"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {/* Mobile payment: STK Push option and fields */}
          {paymentMethod === 'mobile' && (
            <>
              <div className="flex items-center mb-2">
                <input
                  id="send-stk-push"
                  type="checkbox"
                  checked={sendStkPush}
                  onChange={e => setSendStkPush(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="send-stk-push" className="text-sm text-gray-700 select-none">Send M-Pesa STK Push</label>
              </div>
              {sendStkPush ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">M-Pesa Phone Number</label>
                  <input
                    type="text"
                    name="mpesaNo"
                    value={mpesaNo}
                    onChange={e => setMpesaNo(e.target.value)}
                    pattern="254\d{9}"
                    placeholder="2547XXXXXXXX"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <span className="text-xs text-gray-500">Format: 2547XXXXXXXX</span>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">M-Pesa Transaction Code</label>
                  <input
                    type="text"
                    name="reference"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 mt-6">
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
              Process Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};