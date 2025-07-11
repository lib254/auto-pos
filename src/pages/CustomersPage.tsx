import React, { useState, useEffect } from 'react';
  
import { Plus, Search, Download, Upload } from 'lucide-react';
import { storage } from '../utils/storage';
import { Customer, Transaction } from '../types';
import { CustomerModal } from '../components/customers/CustomerModal';
import { DebtPaymentModal } from '../components/customers/DebtPaymentModal';
import { CustomerHistory } from '../components/customers/CustomerHistory';
import { generateCustomerCode, generateCustomerTemplate, parseCustomerCSV, validateCustomerImport } from '../utils/customerUtils';
import { v4 as uuidv4 } from 'uuid';
import { useRegister } from '../hooks/useRegister';

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const { recordTransaction, isOpen } = useRegister();
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // M-Pesa modal state
  const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [mpesaResultDesc, setMpesaResultDesc] = useState<string | null>(null);
  const [mpesaResultCode, setMpesaResultCode] = useState<string | null>(null);

  useEffect(() => {
    setCustomers(storage.getCustomers());
    setTransactions(storage.getTransactions());
  }, []);

  const handleDownloadTemplate = () => {
    const template = generateCustomerTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCustomers = () => {
    const headers = ['Customer Code', 'Full Name', 'ID No', 'Phone No', 'Address', 'Previous Balance', 'Total Spent'];
    const rows = customers.map(customer => [
      customer.code,
      customer.name,
      customer.idNumber,
      customer.phone,
      customer.address,
      customer.previousBalance.toString(),
      customer.totalSpent.toString()
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCustomers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedCustomers = parseCustomerCSV(text);
      const validation = validateCustomerImport(importedCustomers);

      if (!validation.valid) {
        setImportError(validation.errors.join('\n'));
        return;
      }

      const newCustomers = importedCustomers.map(customer => ({
        ...customer,
        id: uuidv4(),
        code: generateCustomerCode(customers),
        email: '',
        totalSpent: 0,
        createdAt: new Date().toISOString()
      }));

      const updatedCustomers = [...customers, ...newCustomers];
      storage.setCustomers(updatedCustomers);
      setCustomers(updatedCustomers);
      setImportError(null);
    } catch (error) {
      setImportError('Failed to import customers. Please check the file format.');
    }
  };

  const handleSaveCustomer = (customerData: Partial<Customer>) => {
    const isEdit = selectedCustomer !== null;
    
    if (isEdit && selectedCustomer) {
      const updatedCustomers = customers.map(c => 
        c.id === selectedCustomer.id 
          ? { ...selectedCustomer, ...customerData }
          : c
      );
      storage.setCustomers(updatedCustomers);
      setCustomers(updatedCustomers);
    } else {
      const newCustomer: Customer = {
        id: uuidv4(),
        code: generateCustomerCode(customers),
        email: '',
        totalSpent: 0,
        createdAt: new Date().toISOString(),
        ...customerData as any
      };
      storage.setCustomers([...customers, newCustomer]);
      setCustomers(prev => [...prev, newCustomer]);
    }
    
    setIsAddModalOpen(false);
    setSelectedCustomer(null);
  };

  const handlePayment = async (payment: { amount: number; method: 'cash' | 'card' | 'mobile'; reference: string }) => {
    if (!selectedCustomer || !isOpen) {
      alert('Please ensure the register is open before processing payments');
      return;
    }

    // M-Pesa STK Push flow
    if (payment.method === 'mobile') {
      const phone = payment.reference.trim();
      if (!/^254\d{9}$/.test(phone)) {
        alert('Please enter a valid M-Pesa phone number (format: 254XXXXXXXXX)');
        return;
      }
      setIsMpesaModalOpen(true);
      setMpesaStatus('pending');
      setMpesaMessage('Initiating M-Pesa payment...');
      setMpesaResultCode(null);
      setMpesaResultDesc(null);

      try {
        // Initiate STK Push
        const res = await fetch('http://localhost:5000/api/mpesa/stk-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: phone,
            amount: payment.amount,
            accountReference: selectedCustomer.code || selectedCustomer.id,
            transactionDesc: 'Debt Payment'
          })
        });
        const data = await res.json();

        if (data.success && data.data.CheckoutRequestID) {
          setMpesaMessage('STK Push sent. Please complete payment on your phone.');
          let attempts = 0;
          const maxAttempts = 10;
          

          const pollPaymentStatus = async () => {
            attempts++;
            try {
              const statusRes = await fetch('http://localhost:5000/api/mpesa/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ CheckoutRequestID: data.data.CheckoutRequestID })
              });
              const statusData = await statusRes.json();
              setMpesaResultCode(statusData?.data?.ResultCode || null);
              setMpesaResultDesc(statusData?.data?.ResultDesc || null);
              const terminalStates = ['completed', 'failed', 'insufficient_funds', 'cancelled'];
              if (statusData.success && terminalStates.includes(statusData.data.status)) {
                if (statusData.data.status === 'completed') {
                  setMpesaStatus('success');
                  setMpesaMessage(statusData.data.message || 'Payment successful!');

                  // Save transaction and update customer
                  const transaction: Transaction = {
                    id: uuidv4(),
                    type: 'payment',
                    customerId: selectedCustomer.id,
                    items: [],
                    total: payment.amount,
                    discount: 0,
                    paymentMethod: payment.method,
                    paymentDetails: data.data.CheckoutRequestID,
                    status: 'completed',
                    createdAt: new Date().toISOString(),
                    payments: [
                      {
                        method: 'mobile',
                        amount: payment.amount,
                        details: phone
                      }
                    ],
                    paymentConfirmation: statusData.data,
                    failureReason: undefined
                  };
                  const updatedCustomers = customers.map(c =>
                    c.id === selectedCustomer.id
                      ? { ...c, previousBalance: c.previousBalance - payment.amount }
                      : c
                  );
                  storage.setCustomers(updatedCustomers);
                  storage.setTransactions([...transactions, transaction]);
                  setCustomers(updatedCustomers);
                  setTransactions(prev => [...prev, transaction]);
                  recordTransaction(transaction);
                  // WhatsApp message logic
                  if (selectedCustomer && selectedCustomer.phone) {
                    const phoneW = selectedCustomer.phone.replace(/^0/, '254');
                    const newBalance = updatedCustomers.find(c => c.id === selectedCustomer.id)?.previousBalance || 0;
                    let paymentDetails = `Payment Method: M-Pesa\nM-Pesa Code: ${data.data.CheckoutRequestID}`;
                    const message =
                      `*Everben Enterprises* (Till No: 620432)\n\n` +
                      `Hello ${selectedCustomer.name},\n\n` +
                      `We have received your payment of Ksh${payment.amount.toFixed(2)}.\n` +
                      `*${paymentDetails}*\n` +
                      `Your new balance is Ksh${newBalance.toFixed(2)}.\n\n` +
                      `Thank you for your payment!`;
                    const url = `https://wa.me/${phoneW}?text=${encodeURIComponent(message)}`;
                    window.open(url, '_blank');
                  }
                  setTimeout(() => {
                    setIsMpesaModalOpen(false);
                    setIsPaymentModalOpen(false);
                    setSelectedCustomer(null);
                  }, 2000);
                } else {
                  setMpesaStatus('failed');
                  const failureMessage = statusData.data.message || statusData.data.ResultDesc || 'Payment failed or cancelled.';
                  setMpesaMessage(failureMessage);
                  setTimeout(() => {
                    setIsMpesaModalOpen(false);
                  }, 3000);
                }
              } else if (attempts < maxAttempts) {
                setTimeout(pollPaymentStatus, 5000);
              } else {
                setMpesaStatus('failed');
                const failureMessage = 'Payment not confirmed. Please try again.';
                setMpesaMessage(failureMessage);
                setTimeout(() => {
                  setIsMpesaModalOpen(false);
                }, 3000);
              }
            } catch (err) {
              setMpesaStatus('failed');
              const failureMessage = 'Error checking payment status. Please try again.';
              setMpesaMessage(failureMessage);
              setTimeout(() => {
                setIsMpesaModalOpen(false);
              }, 3000);
            }
          };
          setTimeout(pollPaymentStatus, 5000);
        } else {
          setMpesaStatus('failed');
          setMpesaMessage('Failed to initiate M-Pesa payment.');
          setTimeout(() => {
            setIsMpesaModalOpen(false);
          }, 3000);
        }
      } catch (err) {
        setMpesaStatus('failed');
        setMpesaMessage('Error initiating M-Pesa payment.');
        setTimeout(() => {
          setIsMpesaModalOpen(false);
        }, 3000);
      }
      return;
    }

    // Non-mobile payment (cash/card)
    const transaction: Transaction = {
      id: uuidv4(),
      type: 'payment',
      customerId: selectedCustomer.id,
      items: [],
      total: payment.amount,
      discount: 0,
      paymentMethod: payment.method,
      paymentDetails: payment.reference,
      status: 'completed',
      createdAt: new Date().toISOString(),
      payments: [],
      paymentConfirmation: undefined,
      failureReason: undefined
    };
    const updatedCustomers = customers.map(c =>
      c.id === selectedCustomer.id
        ? { ...c, previousBalance: c.previousBalance - payment.amount }
        : c
    );
    storage.setCustomers(updatedCustomers);
    storage.setTransactions([...transactions, transaction]);
    setCustomers(updatedCustomers);
    setTransactions(prev => [...prev, transaction]);
    recordTransaction(transaction);
    // WhatsApp message logic (final fix: only for cash/card, not mobile, and payment.method is always 'cash' or 'card' here)
    if (selectedCustomer && selectedCustomer.phone && (payment.method === 'cash' || payment.method === 'card')) {
      const phoneW = selectedCustomer.phone.replace(/^0/, '254');
      const newBalance = updatedCustomers.find(c => c.id === selectedCustomer.id)?.previousBalance || 0;
      let paymentDetails = `Payment Method: ${payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}`;
      if (payment.method === 'card' && payment.reference) {
        paymentDetails += `\nCard Ref: ${payment.reference}`;
      }
      const message =
        `*Everben Enterprises* (Till No: 620432)\n\n` +
        `Hello ${selectedCustomer.name},\n\n` +
        `We have received your payment of Ksh${payment.amount.toFixed(2)}.\n` +
        `*${paymentDetails}*\n` +
        `Your new balance is Ksh${newBalance.toFixed(2)}.\n\n` +
        `Thank you for your payment!`;
      const url = `https://wa.me/${phoneW}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
    setIsPaymentModalOpen(false);
    setSelectedCustomer(null);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const handleDeleteCustomer = (customer: Customer) => {
    if (customer.previousBalance > 0) {
      alert('Cannot delete customer with outstanding debt. Please clear their balance first.');
      return;
    }
    setCustomerToDelete(customer);
  };
  
  const handleDeleteConfirm = () => {
    if (customerToDelete) {
      const updatedCustomers = customers.filter(c => c.id !== customerToDelete.id);
      storage.setCustomers(updatedCustomers);
      setCustomers(updatedCustomers);
      setCustomerToDelete(null);
    }
  };

  const totalDebt = customers.reduce((sum, customer) => sum + customer.previousBalance, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Customers ({customers.length})
          </h1>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </button>
          <label className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Import Customers
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCustomers}
            />
          </label>
          <button
            onClick={handleExportCustomers}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Customers
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </button>
        </div>
      </div>

      {importError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Import Error:</p>
          <pre className="mt-2 text-sm whitespace-pre-wrap">{importError}</pre>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="relative flex-1 mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>

        <div className="h-[calc(100vh-300px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onDoubleClick={() => {
                    setSelectedCustomer(customer);
                    setIsHistoryModalOpen(true);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">{customer.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>{customer.phone}</div>
                    <div className="text-sm text-gray-500">{customer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.previousBalance > 0 ? (
                      <span className="text-red-600">Ksh{customer.previousBalance.toFixed(2)}</span>
                    ) : (
                      <span className="text-green-600">Ksh 0.00</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">Ksh{customer.totalSpent.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-3">
                    {customer.previousBalance > 0 && (
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setIsPaymentModalOpen(true);
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        Pay
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsAddModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    {customer.previousBalance === 0 && (
                    <button
                      onClick={() => handleDeleteCustomer(customer)}
                      className="text-red-600 hover:text-red-800 ml-3"
                    >
                      Delete
                    </button>
                  )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Total Debt Information */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Total Outstanding Debt: <span className="font-medium text-red-600">Ksh{totalDebt.toFixed(2)}</span>
          </p>
        </div>
      </div>

      <CustomerModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSave={handleSaveCustomer}
      />

      {isPaymentModalOpen && selectedCustomer && (
        <DebtPaymentModal
          isOpen={true}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          onPayment={handlePayment}
        />
      )}

      <CustomerHistory
        isOpen={isHistoryModalOpen && !!selectedCustomer}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer!}
        transactions={transactions}
      />

      {/* M-Pesa Payment Modal - always rendered, visibility controlled by CSS */}
      <div
        className={`fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-200 ${isMpesaModalOpen ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'}`}
        aria-hidden={!isMpesaModalOpen}
      >
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">M-Pesa Payment</h2>
          <div className="mb-4">
            <p className="text-gray-700">{mpesaMessage}</p>
            {mpesaResultDesc && (
              <div className="mt-2 text-sm text-gray-500">
                <span className="font-semibold">M-Pesa Response:</span> {mpesaResultDesc}
                {mpesaResultCode && (
                  <span className="ml-2">(Code: {mpesaResultCode})</span>
                )}
              </div>
            )}
            {mpesaStatus === 'pending' && (
              <div className="mt-4 flex items-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></span>
                <span>Waiting for payment confirmation...</span>
              </div>
            )}
            {mpesaStatus === 'success' && (
              <div className="mt-4 text-green-600 font-semibold">
                Payment successful!
              </div>
            )}
            {mpesaStatus === 'failed' && (
              <div className="mt-4 text-red-600 font-semibold">
                Payment failed. Please try again.
              </div>
            )}
          </div>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => {
              setIsMpesaModalOpen(false);
              setMpesaResultCode(null);
              setMpesaResultDesc(null);
            }}
            disabled={mpesaStatus === 'pending'}
          >
            Close
          </button>
        </div>
      </div>

      {customerToDelete && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete "{customerToDelete.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setCustomerToDelete(null)}
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
    </div>
  );
};

export default CustomersPage;