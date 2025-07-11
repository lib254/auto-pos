import { Customer, Supplier, Product, Transaction, CashRegister } from '../types';

const STORAGE_KEYS = {
  CUSTOMERS: 'pos_customers',
  SUPPLIERS: 'pos_suppliers',
  PRODUCTS: 'pos_products',
  TRANSACTIONS: 'pos_transactions',
  CASH_REGISTER: 'pos_cash_register',
};

export const storage = {
  getItem: <T>(key: string): T[] => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  setItem: <T>(key: string, value: T[]): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getCustomers: () => storage.getItem<Customer>(STORAGE_KEYS.CUSTOMERS),
  setCustomers: (customers: Customer[]) => storage.setItem(STORAGE_KEYS.CUSTOMERS, customers),

  getSuppliers: () => storage.getItem<Supplier>(STORAGE_KEYS.SUPPLIERS),
  setSuppliers: (suppliers: Supplier[]) => storage.setItem(STORAGE_KEYS.SUPPLIERS, suppliers),

  getProducts: () => storage.getItem<Product>(STORAGE_KEYS.PRODUCTS),
  setProducts: (products: Product[]) => storage.setItem(STORAGE_KEYS.PRODUCTS, products),

  getTransactions: () => storage.getItem<Transaction>(STORAGE_KEYS.TRANSACTIONS),
  setTransactions: (transactions: Transaction[]) => storage.setItem(STORAGE_KEYS.TRANSACTIONS, transactions),

  getCashRegister: () => {
    const data = localStorage.getItem(STORAGE_KEYS.CASH_REGISTER);
    return data ? JSON.parse(data) as CashRegister : null;
  },
  setCashRegister: (register: CashRegister) => {
    localStorage.setItem(STORAGE_KEYS.CASH_REGISTER, JSON.stringify(register));
  },

  clearData: () => {
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CASH_REGISTER);
  },

  resetToDefaults: () => {
    // Optionally, set default values for each key, or just clear all data
    storage.clearData();
    // You can add default data here if needed, e.g.:
    // storage.setCustomers([]);
    // storage.setSuppliers([]);
    // storage.setProducts([]);
    // storage.setTransactions([]);
    // storage.setCashRegister(null);
  },
  
  exportData: () => {
    const data = {
      customers: storage.getCustomers(),
      suppliers: storage.getSuppliers(),
      products: storage.getProducts(),
      transactions: storage.getTransactions(),
      cashRegister: storage.getCashRegister(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.customers) storage.setCustomers(data.customers);
      if (data.suppliers) storage.setSuppliers(data.suppliers);
      if (data.products) storage.setProducts(data.products);
      if (data.transactions) storage.setTransactions(data.transactions);
      if (data.cashRegister) storage.setCashRegister(data.cashRegister);
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  },
};