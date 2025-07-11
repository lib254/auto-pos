import React, { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';
import { Transaction } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const SalesReport = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    setTransactions(storage.getTransactions());
  }, []);

  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      const txDate = new Date(transaction.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && end) {
        return txDate >= start && txDate <= end;
      }

      const today = new Date();
      const rangeStart = new Date();

      switch (dateRange) {
        case 'day':
          rangeStart.setDate(today.getDate() - 1);
          break;
        case 'week':
          rangeStart.setDate(today.getDate() - 7);
          break;
        case 'month':
          rangeStart.setMonth(today.getMonth() - 1);
          break;
        case 'year':
          rangeStart.setFullYear(today.getFullYear() - 1);
          break;
      }

      return txDate >= rangeStart && txDate <= today;
    });
  };

  const getSalesData = () => {
    const filteredTransactions = getFilteredTransactions();
    const salesByDate = new Map();

    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'sale') {
        const date = new Date(transaction.createdAt).toLocaleDateString();
        salesByDate.set(date, (salesByDate.get(date) || 0) + transaction.total);
      }
    });

    return Array.from(salesByDate.entries()).map(([date, amount]) => ({
      date,
      amount
    }));
  };

  const getTotalSales = () => {
    return getFilteredTransactions()
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.total, 0);
  };

  const getAverageSale = () => {
    const sales = getFilteredTransactions().filter(t => t.type === 'sale');
    return sales.length > 0 ? getTotalSales() / sales.length : 0;
  };

  const salesData = getSalesData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600">Total Sales</div>
          <div className="text-2xl font-bold text-blue-700">
            Ksh{getTotalSales().toFixed(2)}
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600">Average Sale</div>
          <div className="text-2xl font-bold text-green-700">
            Ksh{getAverageSale().toFixed(2)}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600">Total Transactions</div>
          <div className="text-2xl font-bold text-purple-700">
            {getFilteredTransactions().filter(t => t.type === 'sale').length}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
        <BarChart width={800} height={300} data={salesData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="amount" fill="#3B82F6" name="Sales Amount" />
        </BarChart>
      </div>
    </div>
  );
};