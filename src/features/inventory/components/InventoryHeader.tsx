import React from 'react';
import { Plus } from 'lucide-react';

interface Props {
  onAddProduct: () => void;
  onImport: () => void;
  onStockPurchase: () => void;
}

export const InventoryHeader: React.FC<Props> = ({ 
  onAddProduct, 
  onImport, 
  onStockPurchase 
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">
        Inventory
      </h1>
      <div className="flex gap-3">
        <button
          onClick={onStockPurchase}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Stock Purchase
        </button>
        <button 
          onClick={onImport}
          className="flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
        >
          Import Products
        </button>
        <button
          onClick={onAddProduct}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>
    </div>
  );
};