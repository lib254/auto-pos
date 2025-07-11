import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Product, Supplier, Transaction } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  products: Product[];
  onPurchase: (purchase: Transaction) => void;
}

export const StockPurchaseModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  suppliers, 
  products,
  onPurchase 
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState(0);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Only initialize purchase price when a new product is selected
  useEffect(() => {
    if (selectedProduct) {
      setPurchasePrice(selectedProduct.costPrice);
    } else {
      setPurchasePrice(0);
    }
  }, [selectedProductId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create purchase transaction without modifying the product's selling price
    const purchase: Transaction = {
      id: uuidv4(),
      type: 'purchase',
      supplierId: selectedSupplierId,
      items: [{
        productId: selectedProductId,
        quantity,
        price: purchasePrice, // This is the purchase price only
        discount: 0
      }],
      total: purchasePrice * quantity,
      discount: 0,
      paymentMethod: 'cash',
      paymentDetails: '',
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    onPurchase(purchase);
    onClose();

    // Reset form
    setSelectedSupplierId('');
    setSelectedProductId('');
    setQuantity(1);
    setPurchasePrice(0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Stock Purchase</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Current Selling Price</label>
                <div className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50">
                  Ksh{selectedProduct.price.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total Purchase Amount</div>
                <div className="text-2xl font-bold text-gray-900">
                  Ksh{(purchasePrice * quantity).toFixed(2)}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Complete Purchase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};