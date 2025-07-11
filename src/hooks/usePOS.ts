import { useState, useEffect } from 'react';
import { HeldTransaction } from '../types/pos';
import { TransactionItem, Customer, Product } from '../types';
import { storage } from '../utils/storage';

const HELD_TRANSACTIONS_KEY = 'pos_held_transactions';

export const usePOS = () => {
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>(() => {
    const saved = localStorage.getItem(HELD_TRANSACTIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState(0);
  const [saveAsDebt, setSaveAsDebt] = useState(false);

  useEffect(() => {
    localStorage.setItem(HELD_TRANSACTIONS_KEY, JSON.stringify(heldTransactions));
  }, [heldTransactions]);

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) return;
    
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        quantity: 1,
        price: product.price,
        discount: 0
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const product = storage.getProducts().find(p => p.id === productId);
    if (!product || quantity > product.quantity) return;

    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const holdTransaction = (note: string) => {
    const held: HeldTransaction = {
      id: Date.now().toString(),
      items: cart,
      customerId: selectedCustomer?.id,
      discount,
      createdAt: new Date().toISOString(),
      note
    };

    setHeldTransactions([...heldTransactions, held]);
    resetCart();
  };

  const retrieveTransaction = (transaction: HeldTransaction) => {
    setCart(transaction.items);
    setDiscount(transaction.discount);
    if (transaction.customerId) {
      const customer = storage.getCustomers().find(c => c.id === transaction.customerId);
      setSelectedCustomer(customer || null);
    }
    setHeldTransactions(heldTransactions.filter(t => t.id !== transaction.id));
  };

  const resetCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setSaveAsDebt(false);
  };

  return {
    cart,
    selectedCustomer,
    discount,
    saveAsDebt,
    heldTransactions,
    addToCart,
    removeFromCart,
    updateQuantity,
    setSelectedCustomer,
    setDiscount,
    setSaveAsDebt,
    holdTransaction,
    retrieveTransaction,
    resetCart
  };
};