import { useState, useEffect } from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, History } from 'lucide-react';
import { useRegister } from '../hooks/useRegister';
import { OpenRegisterModal } from '../components/register/OpenRegisterModal';
import { CloseRegisterModal } from '../components/register/CloseRegisterModal';
import { PreviousSessionsModal } from '../components/register/PreviousSessionsModal';
import { AddMoneyModal } from '../components/register/AddMoneyModal';
import { WithdrawMoneyModal } from '../components/register/WithdrawMoneyModal';
import { TransactionReceipt } from '../components/register/TransactionReceipt';
import { Transaction } from '../types';
import { storage } from '../utils/storage';

const RegisterPage = () => {
  const {
    isOpen,
    currentSession,
    previousSessions,
    openRegister,
    closeRegister,
    reopenSession,
    handleAddMoney,
    handleWithdraw,
  } = useRegister();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isPreviousModalOpen, setIsPreviousModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  useEffect(() => {
    const loadTransactions = () => {
      if (currentSession) {
        const allTransactions = storage.getTransactions();
        const sessionStart = new Date(currentSession.openedAt);
        const sessionEnd = currentSession.closedAt ? new Date(currentSession.closedAt) : new Date();
        
        const sessionTransactions = allTransactions.filter(transaction => {
          const transactionDate = new Date(transaction.createdAt);
          return (
            transactionDate >= sessionStart && 
            transactionDate <= sessionEnd &&
            (transaction.type === 'sale' || 
             transaction.type === 'refund' || 
             transaction.type === 'payment' ||
             transaction.type === 'purchase' ||
             transaction.type === 'debt' ||
             transaction.id.startsWith('ADD-') ||
             transaction.id.startsWith('WD-'))
          );
        });
        
        const sortedTransactions = sessionTransactions.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setTransactions(sortedTransactions);
      } else {
        setTransactions([]);
      }
    };

    loadTransactions();

    const handleRegisterUpdate = () => {
      loadTransactions();
    };

    window.addEventListener('register-update', handleRegisterUpdate);
    return () => window.removeEventListener('register-update', handleRegisterUpdate);
  }, [currentSession]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cash Register</h1>
        <div className="flex gap-3">
          {!isOpen && (
            <button
              onClick={() => setIsOpenModalOpen(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Open Register
            </button>
          )}
          {isOpen && (
            <>
              <button
                onClick={() => setIsCloseModalOpen(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Close Register
              </button>
              <button
                onClick={() => setIsAddMoneyModalOpen(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Add Money
              </button>
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Withdraw Money
              </button>
            </>
          )}
          <button
            onClick={() => setIsPreviousModalOpen(true)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <History className="w-4 h-4 mr-2" />
            Previous Sessions
          </button>
        </div>
      </div>

      {currentSession ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Opening Balance</h3>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold">
                Ksh{currentSession.openingBalance.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Opened at: {new Date(currentSession.openedAt).toLocaleTimeString()}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Current Balance</h3>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold">
                Ksh{currentSession.expectedBalance.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Payment Methods</h3>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash:</span>
                  <span className="font-medium">
                    Ksh{currentSession.paymentTotals.cash.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Card:</span>
                  <span className="font-medium">
                    Ksh{currentSession.paymentTotals.card.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mobile:</span>
                  <span className="font-medium">
                    Ksh{currentSession.paymentTotals.mobile.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
            
            <div className="h-[calc(100vh-300px)] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => {
                    // Calculate original amount before discount
                    const originalTotal = transaction.type === 'sale' 
                      ? transaction.total / (1 - (transaction.discount || 0) / 100)
                      : transaction.total;

                    return (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            transaction.type === 'sale'
                              ? 'bg-green-100 text-green-800'
                              : transaction.type === 'refund'
                              ? 'bg-red-100 text-red-800'
                              : transaction.type === 'payment'
                              ? 'bg-blue-100 text-blue-800'
                              : transaction.type === 'purchase' && transaction.id.startsWith('WD-')
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {transaction.id.startsWith('WD-') 
                              ? 'Withdrawal'
                              : transaction.id.startsWith('ADD-')
                              ? 'Add Money'
                              : transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{transaction.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap capitalize">
                          {transaction.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={
                            transaction.type === 'refund' || 
                            (transaction.type === 'purchase' && transaction.id.startsWith('WD-'))
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }>
                            {transaction.type === 'refund' || 
                             (transaction.type === 'purchase' && transaction.id.startsWith('WD-'))
                              ? '-' 
                              : '+'}
                            Ksh{originalTotal.toFixed(2)}
                            {transaction.discount > 0 && (
                              <span className="text-xs text-gray-500 ml-1">
                                (-{transaction.discount}%)
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setIsReceiptModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600">Register is currently closed</p>
        </div>
      )}

      <OpenRegisterModal
        isOpen={isOpenModalOpen}
        onClose={() => setIsOpenModalOpen(false)}
        onOpen={openRegister}
      />

      {currentSession && (
        <CloseRegisterModal
          isOpen={isCloseModalOpen}
          onClose={() => setIsCloseModalOpen(false)}
          onCloseRegister={closeRegister}
          currentSession={currentSession}
        />
      )}

      <PreviousSessionsModal
        isOpen={isPreviousModalOpen}
        onClose={() => setIsPreviousModalOpen(false)}
        sessions={previousSessions}
        onReopen={reopenSession}
      />

      {currentSession && (
        <AddMoneyModal
          isOpen={isAddMoneyModalOpen}
          onClose={() => setIsAddMoneyModalOpen(false)}
          onAddMoney={handleAddMoney}
          currentSession={currentSession}
        />
      )}

      {currentSession && (
        <WithdrawMoneyModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          onWithdraw={handleWithdraw}
          currentSession={currentSession}
        />
      )}

      {selectedTransaction && (
        <TransactionReceipt
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
        />
      )}
    </div>
  );
};

export default RegisterPage;