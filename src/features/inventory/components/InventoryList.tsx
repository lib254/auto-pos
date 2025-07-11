import React, { useState } from 'react';
import { Product } from '../../../types';

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export const InventoryList: React.FC<Props> = ({ products, onEdit, onDelete }) => {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      onDelete(productToDelete.id);
      setProductToDelete(null);
    }
  };

  return (
    <>
      <div className="h-[calc(100vh-300px)] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products
              .filter((product): product is Product => !!product) // Filter out null/undefined
              .slice()
              .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
              .map((product, idx) => (
                <tr key={product.id || `fallback-key-${idx}`}>
                  <td className="px-6 py-4">
                    <div className="font-medium">{product.name || <span className="text-gray-400 italic">No Name</span>}</div>
                    <div className="text-sm text-gray-500">{product.description || <span className="text-gray-300">No description</span>}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.sku || <span className="text-gray-300">N/A</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">{product.category || <span className="text-gray-300">N/A</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      Number(product.quantity) <= 5
                        ? 'text-orange-600 bg-orange-100'
                        : 'text-green-600 bg-green-100'
                    }`}>
                      {Number.isFinite(Number(product.quantity)) ? product.quantity : 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    Ksh{Number.isFinite(Number(product.price)) ? Number(product.price).toFixed(2) : '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-3">
                    <button
                      onClick={() => onEdit(product)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(product)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{productToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};