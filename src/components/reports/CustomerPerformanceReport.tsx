import React, { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';
import { Customer, Transaction } from '../../types';

export const CustomerPerformanceReport = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeFrame, setTimeFrame] = useState<'month' | 'quarter' | 'year'>('month');
  const [sortBy, setSortBy] = useState<'total' | 'frequency'>('total');

  useEffect(() => {
    setCustomers(storage.getCustomers());
    setTransactions(storage.getTransactions());
  }, []);

  const getFilteredTransactions = () => {
    const now = new Date();
    const cutoff = new Date();

    switch (timeFrame) {
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoff.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    return transactions.filter(t => 
      t.type === 'sale' && new Date(t.createdAt) >= cutoff
    );
  };

  const getCustomerPerformance = () => {
    const filteredTransactions = getFilteredTransactions();
    const performance = new Map();

    customers.forEach(customer => {
      const customerTransactions = filteredTransactions.filter(
        t => t.customerId === customer.id
      );

      if (customerTransactions.length > 0) {
        performance.set(customer.id, {
          id: customer.id,
          name: customer.name,
          totalSpent: customerTransactions.reduce((sum, t) => sum + t.total, 0),
          transactionCount: customerTransactions.length,
          averageTransaction: customerTransactions.reduce((sum, t) => sum + t.total, 0) / customerTransactions.length,
          lastPurchase: new Date(Math.max(...customerTransactions.map(t => new Date(t.createdAt).getTime()))),
          currentDebt: customer.previousBalance
        });
      }
    });

    return Array.from(performance.values())
      .sort((a, b) => sortBy === 'total' 
        ? b.totalSpent - a.totalSpent 
        : b.transactionCount - a.transactionCount
      );
  };

  const performanceData = getCustomerPerformance();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-x-4">
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value as any)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="total">Sort by Total Spent</option>
            <option value="frequency">Sort by Purchase Frequency</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchases</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Transaction</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Purchase</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Debt</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {performanceData.map((customer) => (
              <tr key={customer.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {customer.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  Ksh{customer.totalSpent.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {customer.transactionCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  Ksh{customer.averageTransaction.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {customer.lastPurchase.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={customer.currentDebt > 0 ? 'text-red-600' : 'text-green-600'}>
                    Ksh{customer.currentDebt.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};