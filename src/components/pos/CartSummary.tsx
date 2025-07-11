import React from 'react';
import { TransactionItem, Product } from '../../types';

interface Props {
  items: TransactionItem[];
  products: Product[];
  discount: number; // This will now be the cash amount instead of percentage
}

export const CartSummary: React.FC<Props> = ({ items, products, discount }) => {
  // Calculate the raw total before VAT and discounts
  const rawTotal = items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  // Calculate subtotal (exclusive of VAT)
  const subtotal = Number(((rawTotal * 100) / 116).toFixed(2));
  
  // Calculate VAT amount
  const vat = Number((rawTotal - subtotal).toFixed(2));
  
  // Calculate discount percentage based on cash amount
  const discountPercentage = Number(((discount / subtotal) * 100).toFixed(1));
  
  // Calculate final total (subtotal + VAT - discount)
  const total = Number((subtotal + vat - discount).toFixed(2));

  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex justify-between text-gray-600">
        <span>Subtotal (excl. VAT)</span>
        <span>Ksh{subtotal.toFixed(2)}</span>
      </div>
      
      {discount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Discount (Ksh{discount.toFixed(2)} ≈ {discountPercentage}%)</span>
          <span>-Ksh{discount.toFixed(2)}</span>
        </div>
      )}
      
      <div className="flex justify-between text-gray-600">
        <span>VAT (16%)</span>
        <span>Ksh{vat.toFixed(2)}</span>
      </div>
      
      <div className="flex justify-between text-lg font-bold border-t pt-2">
        <span>Total</span>
        <span>Ksh{total.toFixed(2)}</span>
      </div>
    </div>
  );
};