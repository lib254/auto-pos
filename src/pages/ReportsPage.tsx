import { useState } from 'react';
import { SalesReport } from '../components/reports/SalesReport';
import { ProductPerformanceReport } from '../components/reports/ProductPerformanceReport';
import { CustomerPerformanceReport } from '../components/reports/CustomerPerformanceReport';
import { ProfitReport } from '../components/reports/ProfitReport';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'customers' | 'profit'>('sales');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
      </div>

      {/* Report Type Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'sales'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Sales Report
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'products'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Product Performance
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'customers'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Customer Performance
          </button>
          <button
            onClick={() => setActiveTab('profit')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'profit'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Profit Analysis
          </button>
        </nav>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === 'sales' && <SalesReport />}
        {activeTab === 'products' && <ProductPerformanceReport />}
        {activeTab === 'customers' && <CustomerPerformanceReport />}
        {activeTab === 'profit' && <ProfitReport />}
      </div>
    </div>
  );
};

export default ReportsPage;