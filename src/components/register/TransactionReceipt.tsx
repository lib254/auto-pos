import React from 'react';
import { Transaction, Customer, Product } from '../../types';
import { storage } from '../../utils/storage';
import { Printer } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
}

export const TransactionReceipt: React.FC<Props> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  if (!isOpen) return null;

  const customer = transaction.customerId
    ? storage.getCustomers().find((c) => c.id === transaction.customerId)
    : null;

  const products = storage.getProducts();

  const getProductDetails = (productId: string) => {
    return products.find((p) => p.id === productId);
  };

  const calculateAmounts = () => {
    const rawTotal = transaction.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0);
    
    const subtotal = Number(((rawTotal * 100) / 116).toFixed(2));
    const vat = Number((rawTotal - subtotal).toFixed(2));
    const discountAmount = Number(transaction.discount || 0);
    const discountPercentage = Number(((discountAmount / subtotal) * 100).toFixed(1));
    const total = Number((subtotal + vat - discountAmount).toFixed(2));

    return { 
      rawTotal,
      subtotal,
      vat,
      discountAmount,
      discountPercentage,
      total
    };
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Add print-specific styles
    const printStyles = `
      @media print {
        @page {
          size: 80mm 297mm;
          margin: 0;
        }
        body {
          padding: 10mm;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.3;
        }
        .receipt-header {
          text-align: center;
          margin-bottom: 10px;
        }
        .receipt-details {
          margin: 10px 0;
        }
        .receipt-items {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 10px 0;
          margin: 10px 0;
        }
        .receipt-totals {
          margin: 10px 0;
        }
        .receipt-footer {
          text-align: center;
          margin-top: 10px;
          border-top: 1px dashed #000;
          padding-top: 10px;
        }
        .flex-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
      }
    `;

    // Generate receipt content
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${transaction.id}</title>
          <style>${printStyles}</style>
        </head>
        <body>
          <div class="receipt-header">
            <h2>Everben Enterprises</h2>
            <p>PIN: P051512680F</p>
            <p>Phone: (+254) 726-287939</p>
          </div>

          <div class="receipt-details">
            <div class="flex-row">
              <span>Receipt No:</span>
              <span>${transaction.id}</span>
            </div>
            <div class="flex-row">
              <span>Date:</span>
              <span>${new Date(transaction.createdAt).toLocaleString()}</span>
            </div>
            <div class="flex-row">
              <span>Type:</span>
              <span>${transaction.type}</span>
            </div>
            ${customer ? `
              <div style="margin-top: 10px;">
                <strong>Customer Details:</strong>
                <p>${customer.name}</p>
                <p>${customer.phone}</p>
              </div>
            ` : ''}
          </div>

          ${transaction.type === 'sale' ? `
            <div class="receipt-items">
              <strong>Products</strong>
              ${transaction.items.map(item => {
                const product = getProductDetails(item.productId);
                return `
                  <div class="flex-row">
                    <span>${product?.name} x ${item.quantity}</span>
                    <span>Ksh${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="receipt-totals">
              ${(() => {
                const { subtotal, vat, discountAmount, discountPercentage, total } = calculateAmounts();
                return `
                  <div class="flex-row">
                    <span>Subtotal (excl. VAT)</span>
                    <span>Ksh${subtotal.toFixed(2)}</span>
                  </div>
                  ${discountAmount > 0 ? `
                    <div class="flex-row">
                      <span>Discount (Ksh${discountAmount.toFixed(2)} ≈ ${discountPercentage}%)</span>
                      <span>-Ksh${discountAmount.toFixed(2)}</span>
                    </div>
                  ` : ''}
                  <div class="flex-row">
                    <span>VAT (16%)</span>
                    <span>Ksh${vat.toFixed(2)}</span>
                  </div>
                  <div class="flex-row" style="font-weight: bold;">
                    <span>Total</span>
                    <span>Ksh${total.toFixed(2)}</span>
                  </div>
                `;
              })()}
            </div>
          ` : `
            <div class="receipt-totals">
              <div class="flex-row">
                <span>Payment Amount</span>
                <span>Ksh${transaction.total.toFixed(2)}</span>
              </div>
              <div class="flex-row">
                <span>Previous Balance</span>
                <span>Ksh${(customer?.previousBalance || 0 + transaction.total).toFixed(2)}</span>
              </div>
              <div class="flex-row">
                <span>New Balance</span>
                <span>Ksh${(customer?.previousBalance || 0).toFixed(2)}</span>
              </div>
            </div>
          `}

          <div class="receipt-footer">
            <p>Payment Method: ${transaction.paymentMethod}</p>
            ${transaction.paymentDetails ? `
              <p>Payment Details/M-pesa Code: ${transaction.paymentDetails}</p>
            ` : ''}
            <p>Thank you for your business!</p>
            <p>Please come again</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print();
      // Close the window after printing (optional)
      // printWindow.onafterprint = () => printWindow.close();
    };
  };

  const renderTransactionDetails = () => {
    // Add new cases for Add Money and Withdrawal at the start
    if (transaction.id.startsWith('ADD-')) {
      return (
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="font-semibold">Add Money Details</h3>
            <div className="flex justify-between text-sm">
              <span>Amount Added:</span>
              <span>Ksh{transaction.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      );
    }

    if (transaction.id.startsWith('WD-')) {
      return (
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="font-semibold">Withdrawal Details</h3>
            <div className="flex justify-between text-sm">
              <span>Amount Withdrawn:</span>
              <span>Ksh{transaction.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      );
    }

    // Keep existing switch statement and cases unchanged
    switch (transaction.type) {
      case 'sale': {
        const { subtotal, vat, discountAmount, discountPercentage, total } = calculateAmounts();
        
        return (
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-semibold">Products</h3>
              {transaction.items.map((item) => {
                const product = getProductDetails(item.productId);
                return (
                  <div
                    key={item.productId}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {product?.name} x {item.quantity}
                    </span>
                    <span>Ksh{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal (excl. VAT)</span>
                <span>Ksh{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount (Ksh{discountAmount.toFixed(2)} ≈ {discountPercentage}%)</span>
                  <span>-Ksh{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>VAT (16%)</span>
                <span>Ksh{vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Total</span>
                <span>Ksh{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        );
      }

      case 'payment':
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Payment Amount</span>
                <span>Ksh{transaction.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Previous Balance</span>
                <span>
                  Ksh
                  {(customer?.previousBalance || 0 + transaction.total).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>New Balance</span>
                <span>Ksh{(customer?.previousBalance || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">Everben Enterprises</h2>
          <p className="text-sm text-gray-600">PIN: P051512680F</p>
          <p className="text-sm text-gray-600">Phone: (+254) 726-287939</p>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm">
            <span>Receipt No:</span>
            <span>{transaction.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Date:</span>
            <span>{new Date(transaction.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Type:</span>
            <span className="capitalize">{transaction.type}</span>
          </div>
          {customer && (
            <div className="mt-2 p-2 bg-gray-50 rounded">
              <h3 className="font-semibold mb-1">Customer Details</h3>
              <p className="text-sm">{customer.name}</p>
              <p className="text-sm">{customer.phone}</p>
            </div>
          )}
        </div>

        {renderTransactionDetails()}

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span>Payment Method:</span>
            <span className="capitalize">{transaction.paymentMethod}</span>
          </div>
          {transaction.paymentDetails && (
            <div className="flex justify-between text-sm">
              <span>Payment Details/M-pesa Code:</span>
              <span>{transaction.paymentDetails}</span>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Thank you for your business!</p>
          <p>Please come again</p>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-2"
          >
            <Printer size={16} />
            <span>Print</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};