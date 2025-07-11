import { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';
import { Product, Transaction } from '../../types';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export const ProductPerformanceReport = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sortBy, setSortBy] = useState<'quantity' | 'revenue'>('revenue');
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    setProducts(storage.getProducts());
    setTransactions(storage.getTransactions());
  }, []);

  const getFilteredTransactions = () => {
    const now = new Date();
    const cutoff = new Date();

    switch (timeFrame) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    return transactions.filter(t => 
      t.type === 'sale' && new Date(t.createdAt) >= cutoff
    );
  };

  const getProductPerformance = () => {
    const filteredTransactions = getFilteredTransactions();
    const performance = new Map();

    filteredTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const current = performance.get(product.id) || {
            name: product.name,
            quantity: 0,
            revenue: 0
          };
          
          current.quantity += item.quantity;
          current.revenue += item.quantity * item.price;
          performance.set(product.id, current);
        }
      });
    });

    return Array.from(performance.values())
      .sort((a, b) => sortBy === 'quantity' 
        ? b.quantity - a.quantity 
        : b.revenue - a.revenue
      )
      .slice(0, 10);
  };

  const COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
  ];

  const performanceData = getProductPerformance();
  
  // Create chart data with top 5 products and aggregate the rest
  const createChartData = () => {
    const top5 = performanceData.slice(0, 5);
    const otherProducts = performanceData.slice(5);
    
    if (otherProducts.length === 0) return top5;

    const otherTotal = otherProducts.reduce((sum, product) => ({
      name: 'Others',
      quantity: sum.quantity + product.quantity,
      revenue: sum.revenue + product.revenue
    }), { name: 'Others', quantity: 0, revenue: 0 });

    return [...top5, otherTotal];
  };

  const chartData = createChartData();

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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="revenue">Sort by Revenue</option>
            <option value="quantity">Sort by Quantity</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Top 10 Products</h3>
          <div className="space-y-2">
            {performanceData.map((item, index) => (
              <div
                key={item.name}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <div>
                  <span className="font-medium">{index + 1}. {item.name}</span>
                  <div className="text-sm text-gray-600">
                    Quantity: {item.quantity.toFixed(2)} | 
                    Revenue: Ksh{item.revenue.toFixed(2)}
                  </div>
                </div>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: index < 5 
                      ? COLORS[index] 
                      : '#CBD5E1' // Light gray for products beyond top 5
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Top 5 Products Revenue Distribution</h3>
          <PieChart width={400} height={400}>
            <Pie
              data={chartData}
              dataKey="revenue"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label={({ name, percent }) => 
                `${name} (${(percent * 100).toFixed(1)}%)`
              }
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={entry.name} 
                  fill={index < 5 ? COLORS[index] : '#CBD5E1'} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `Ksh${value.toFixed(2)}`}
            />
            <Legend />
          </PieChart>
        </div>
      </div>
    </div>
  );
};