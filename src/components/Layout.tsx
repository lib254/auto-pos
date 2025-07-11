import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  ShoppingCart, Users, Truck, Package, History, 
  Settings, CreditCard, FileText
} from 'lucide-react';

const Layout = () => {
  const location = useLocation();

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col h-full">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-800">AutoParts POS</h1>
        </div>
        
        <nav className="mt-4 flex-1">
          <Link
            to="/pos"
            className={`flex items-center px-4 py-3 ${
              isActive('/pos') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ShoppingCart className="w-5 h-5 mr-3" />
            POS
          </Link>
          
          <Link
            to="/customers"
            className={`flex items-center px-4 py-3 ${
              isActive('/customers') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5 mr-3" />
            Customers
          </Link>
          
          <Link
            to="/suppliers"
            className={`flex items-center px-4 py-3 ${
              isActive('/suppliers') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Truck className="w-5 h-5 mr-3" />
            Suppliers
          </Link>
          
          <Link
            to="/inventory"
            className={`flex items-center px-4 py-3 ${
              isActive('/inventory') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package className="w-5 h-5 mr-3" />
            Inventory
          </Link>
          
          <Link
            to="/history"
            className={`flex items-center px-4 py-3 ${
              isActive('/history') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History className="w-5 h-5 mr-3" />
            History
          </Link>

          <Link
            to="/reports"
            className={`flex items-center px-4 py-3 ${
              isActive('/reports') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5 mr-3" />
            Reports
          </Link>
          
          <Link
            to="/register"
            className={`flex items-center px-4 py-3 ${
              isActive('/register') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CreditCard className="w-5 h-5 mr-3" />
            Cash Register
          </Link>

          <Link
            to="/previous-sessions"
            className={`flex items-center px-4 py-3 ${
              isActive('/previous-sessions') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History className="w-5 h-5 mr-3" />
            Previous Sessions
          </Link>
          
          <Link
            to="/settings"
            className={`flex items-center px-4 py-3 ${
              isActive('/settings') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Link>
        </nav>

        {/* Date and Time at the bottom */}
        <div className="p-4 border-t text-xs text-gray-500 text-left">
          {now.toLocaleDateString()}<br />
          {now.toLocaleTimeString()}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;