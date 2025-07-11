import { useState, useEffect } from 'react';
import { RegisterSession, RegisterState } from '../types/register';
import { PaymentMethod, Transaction } from '../types';
import { storage } from '../utils/storage';

// Define the payment totals type to match exactly with PaymentMethod
type PaymentTotals = {
  [K in PaymentMethod]: number;
};

const REGISTER_STATE_KEY = 'pos_register_state';

const refreshSessions = () => {
    // Implement logic to refresh previousSessions, e.g., refetch from API or reload state
  };

export const useRegister = () => {
  const [state, setState] = useState<RegisterState>(() => {
    const saved = localStorage.getItem(REGISTER_STATE_KEY);
    return saved ? JSON.parse(saved) : {
      currentSession: null,
      previousSessions: []
    };
  });

  useEffect(() => {
    localStorage.setItem(REGISTER_STATE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('register-update'));
  }, [state]);

  const openRegister = (openingBalance: number) => {
    const session: RegisterSession = {
      id: Date.now().toString(),
      openingBalance,
      expectedBalance: openingBalance,
      openedAt: new Date().toISOString(),
      status: 'open',
      paymentTotals: {
        cash: 0,
        card: 0,
        mobile: 0,
        exchange: 0  // Added exchange payment method
      },
      transactions: []
    };

    setState({
      ...state,
      currentSession: session
    });
  };

  const closeRegister = (closingBalance: number, notes?: string) => {
    if (!state.currentSession) return;

    const closedSession: RegisterSession = {
      ...state.currentSession,
      closingBalance,
      closedAt: new Date().toISOString(),
      status: 'closed',
      notes,
      difference: closingBalance - state.currentSession.expectedBalance
    };

    setState({
      currentSession: null,
      previousSessions: [closedSession, ...state.previousSessions]
    });
  };

  const recordTransaction = (transaction: Transaction) => {
    if (!state.currentSession) return;
  
    const transactionAmount = Math.abs(transaction.total);
    const discountPercentage = transaction.discount || 0;
    const subtotal = transactionAmount / (1 - (discountPercentage / 100));
    const discountAmount = subtotal * (discountPercentage / 100);
    let balanceImpact = 0;
    let paymentMethodImpact = 0;
  
    // Check for debt transactions
    if (transaction.type === 'debt') {
      // Only update transactions array without affecting balances
      setState({
        ...state,
        currentSession: {
          ...state.currentSession,
          transactions: [...state.currentSession.transactions, transaction.id]
        }
      });
      window.dispatchEvent(new Event('register-update'));
      return;
    }
  
    switch (transaction.type) {
      case 'sale':
        balanceImpact = transactionAmount;
        paymentMethodImpact = transactionAmount;
        break;
      case 'refund':
        balanceImpact = -(transactionAmount - discountAmount);
        paymentMethodImpact = -(transactionAmount - discountAmount);
        break;
      case 'payment':
        balanceImpact = transactionAmount;
        paymentMethodImpact = transactionAmount;
        break;
      case 'purchase':
        if (transaction.paymentMethod === 'exchange') {
          balanceImpact = 0;  // Exchange doesn't affect cash balance
          paymentMethodImpact = transactionAmount;
        } else {
          balanceImpact = -(transactionAmount - discountAmount);  // Purchases decrease balance
          paymentMethodImpact = -(transactionAmount - discountAmount);
        }
        break;
      default:
        break;
    }
  
    const updatedPaymentTotals: PaymentTotals = {
      ...state.currentSession.paymentTotals,
      [transaction.paymentMethod]: 
        state.currentSession.paymentTotals[transaction.paymentMethod] + paymentMethodImpact
    };
  
    const updatedSession = {
      ...state.currentSession,
      expectedBalance: state.currentSession.expectedBalance + balanceImpact,
      paymentTotals: updatedPaymentTotals,
      transactions: [...state.currentSession.transactions, transaction.id]
    };
  
    setState({
      ...state,
      currentSession: updatedSession
    });
  
    window.dispatchEvent(new Event('register-update'));
  
};

  const handleAddMoney = (amount: number, notes: string, paymentMethod: PaymentMethod) => {
    if (!state.currentSession) return;
    
    // Create a new transaction record
    const transaction: Transaction = {
      id: `ADD-${Date.now()}`,
      type: 'payment',  // Using 'payment' type for add money
      items: [], // No items for cash addition
      total: amount,
      discount: 0,
      paymentMethod,
      payments: [
        {
          method: paymentMethod,
          amount: amount,
          details: notes
        }
      ],
      paymentDetails: notes,
      status: 'completed',
      createdAt: new Date().toISOString()
    };
  
    // Record the transaction
    recordTransaction(transaction);
    
    // Also save to storage
    const existingTransactions = storage.getTransactions();
    storage.setTransactions([...existingTransactions, transaction]);
  };

  const handleWithdraw = (transaction: Transaction) => {
    // Record the transaction
    recordTransaction(transaction);
    
    // Also save to storage
    const existingTransactions = storage.getTransactions();
    storage.setTransactions([...existingTransactions, transaction]);
  };

  const reopenSession = (sessionId: string) => {
    const session = state.previousSessions.find(s => s.id === sessionId);
    if (!session) return;

    const reopenedSession: RegisterSession = {
      ...session,
      status: 'open',
      closingBalance: undefined,
      closedAt: undefined,
      difference: undefined,
      notes: undefined
    };

    setState({
      currentSession: reopenedSession,
      previousSessions: state.previousSessions.filter(s => s.id !== sessionId)
    });
  };

  return {
    isOpen: !!state.currentSession,
    currentSession: state.currentSession,
    previousSessions: state.previousSessions,
    openRegister,
    closeRegister,
    reopenSession,
    recordTransaction,
    handleAddMoney,
    handleWithdraw
  };
};