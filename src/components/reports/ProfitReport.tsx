import React, { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';
import { Transaction } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const ProfitReport = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'year'>('month');
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

      switch (timeFrame) {
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

  const calculateProfitMetrics = () => {
    const filteredTransactions = getFilteredTransactions();
    let revenue = 0;
    let costs = 0;
    let refunds = 0;

    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'sale') {
        revenue += transaction.total;
      } else if (transaction.type === 'purchase') {
        costs += transaction.total;
      } else if (transaction.type === 'refund') {
        refunds += transaction.total;
      }
    });

    const grossProfit = revenue - costs;
    const netProfit = grossProfit - refunds;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue,
      costs,
      refunds,
      grossProfit,
      netProfit,
      profitMargin
    };
  };

  const getProfitTrend = () => {
    const filteredTransactions = getFilteredTransactions();
    const profitByDate = new Map();

    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.createdAt).toLocaleDateString();
      const current = profitByDate.get(date) || {
        date,
        revenue: 0,
        costs: 0,
        profit: 0
      };

      if (transaction.type === 'sale') {
        current.revenue += transaction.total;
      } else if (transaction.type === 'purchase') {
        current.costs += transaction.total;
      }

      current.profit = current.revenue - current.costs;
      profitByDate.set(date, current);
    });

    return Array.from(profitByDate.values());
  };

  const metrics = calculateProfitMetrics();
  const trendData = getProfitTrend();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-x-4">
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value as any)}
            className="border rounded-lg px-3 py-2"
          >
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
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600">Revenue</div>
          <div className="text-2xl font-bold text-green-700">
            Ksh{metrics.revenue.toFixed(2)}
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600">Gross Profit</div>
          <div className="text-2xl font-bold text-blue-700">
            Ksh{metrics.grossProfit.toFixed(2)}
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600">Net Profit</div>
          <div className="text-2xl font-bold text-purple-700">
            Ksh{metrics.netProfit.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-red-600">Costs</div>
          <div className="text-2xl font-bold text-red-700">
            Ksh{metrics.costs.toFixed(2)}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-yellow-600">Refunds</div>
          <div className="text-2xl font-bold text-yellow-700">
            Ksh{metrics.refunds.toFixed(2)}
          </div>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg">
          <div className="text-sm text-indigo-600">Profit Margin</div>
          <div className="text-2xl font-bold text-indigo-700">
            {metrics.profitMargin.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Profit Trend</h3>
        <LineChart width={800} height={300} data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#10B981" name="Revenue" />
          <Line type="monotone" dataKey="costs" stroke="#EF4444" name="Costs" />
          <Line type="monotone" dataKey="profit" stroke="#3B82F6" name="Profit" />
        </LineChart>
      </div>
    </div>
  );
};