// Customer related types
export interface Customer {
  id: string;
  code: string;
  name: string;
  idNumber: string;
  phone: string;
  email: string;
  address: string;
  previousBalance: number;
  totalSpent: number;
  createdAt: string;
}

export interface Supplier {
  code: any;
  idNumber: any;
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  costPrice: number;
  quantity: number;
  supplierId: string;
  category: string;
  createdAt: string;
}

export type TransactionType = 'sale' | 'refund' | 'purchase' | 'payment' | 'debt';
export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'exchange';
export type TransactionStatus = 'completed' | 'pending' | 'cancelled';


export interface Transaction {
  paymentConfirmation: any;
  failureReason: any;
  id: string;
  type: TransactionType;
  customerId?: string;
  supplierId?: string;
  items: TransactionItem[];
  total: number;
  discount: number;
  paymentMethod: PaymentMethod;
  payments: Payment[];
  paymentDetails: string;
  status: TransactionStatus;
  createdAt: string;
  isDebt?: boolean;
}

export interface Payment {
  method: PaymentMethod;
  amount: number;
  details: string;
}

export interface TransactionItem {
  productId: string;
  quantity: number;
  price: number;
  discount: number;
}

export interface CashRegister {
  id: string;
  openingBalance: number;
  closingBalance: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  cashierId: string;
}