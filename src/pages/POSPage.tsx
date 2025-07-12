  import { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { AlertCircle, PauseCircle, PlayCircle } from 'lucide-react';
  import { storage } from '../utils/storage';
  import { Product, Customer, Transaction } from '../types';
  import { usePOS } from '../hooks/usePOS';
  import { useRegister } from '../hooks/useRegister';
  import { ProductSearch } from '../components/pos/ProductSearch';
  import { CartSummary } from '../components/pos/CartSummary';
  import { HoldTransactionModal } from '../components/pos/HoldTransactionModal';
  import { RetrieveHeldTransactionModal } from '../components/pos/RetrieveHeldTransactionModal';
  import { generateTransactionReference } from '../utils/transactionUtils';
  import toast from 'react-hot-toast';

  const POSPage = () => {
    const navigate = useNavigate();
    const { isOpen: isRegisterOpen, recordTransaction } = useRegister();
    const {
      cart,
      selectedCustomer,
      discount,
      saveAsDebt,
      heldTransactions,
      addToCart,
      removeFromCart,
      updateQuantity,
      setSelectedCustomer,
      setDiscount,
      setSaveAsDebt,
      holdTransaction,
      retrieveTransaction,
      resetCart
    } = usePOS();

    const [products, setProducts] = useState<Product[]>([]);
    const [messageCustomer, setMessageCustomer] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [useMultiplePayments, setUseMultiplePayments] = useState(false);
    const [cashRendered, setCashRendered] = useState<number>(0);
    const [primaryPayment, setPrimaryPayment] = useState({
      method: 'cash' as 'cash' | 'card' | 'mobile',
      amount: 0,
      details: ''
    });
    const [secondaryPayment, setSecondaryPayment] = useState({
      method: 'mobile' as 'cash' | 'card' | 'mobile',
      amount: 0,
      details: ''
    });
    const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
    const [isRetrieveModalOpen, setIsRetrieveModalOpen] = useState(false);
    const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);
    const [mpesaStatus, setMpesaStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
    const [mpesaMessage, setMpesaMessage] = useState<string>('');
    const [mpesaResultDesc, setMpesaResultDesc] = useState<string | null>(null);
    const [mpesaResultCode, setMpesaResultCode] = useState<string | null>(null);


    useEffect(() => {
      setProducts(storage.getProducts());
      setCustomers(storage.getCustomers());
    }, []);

    const calculateTotal = () => {
      const subtotal = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product?.price || 0) * item.quantity;
      }, 0);
      // If the discount is in actual amount
      const discountAmount = discount;  // Use the discount amount directly
      // If the discount should be percentage, then:
      // const discountAmount = parseFloat((subtotal * (discount/100)).toFixed(2));
      return subtotal - discountAmount;
  };
    
    const calculateChange = () => {
      return cashRendered - calculateTotal();
    };

    const handleCheckout = async () => {
      if (cart.length === 0) return;

      // Helper: update inventory in storage
      const updateInventory = (cartItems: typeof cart, allProducts: typeof products) => {
        return allProducts.map(product => {
          const cartItem = cartItems.find(item => item.productId === product.id);
          if (cartItem) {
            return {
              ...product,
              quantity: Math.max(0, product.quantity - cartItem.quantity)
            };
          }
          return product;
        });
      };

      // Helper: update customer balances
      const updateCustomerBalances = (customersArr: typeof customers, customerId: string, unpaid: number, total: number) => {
        return customersArr.map(customer =>
          customer.id === customerId
            ? {
                ...customer,
                previousBalance: (customer.previousBalance || 0) + unpaid,
                totalSpent: (customer.totalSpent || 0) + total
              }
            : customer
        );
      };

      // Single payment, M-Pesa flow
      if (!useMultiplePayments && primaryPayment.method === 'mobile') {
        const phone = primaryPayment.details.trim();
        if (!/^254\d{9}$/.test(phone)) {
          toast.error('Please enter a valid M-Pesa phone number (format: 254XXXXXXXX)');
          return;
        }

        setIsMpesaModalOpen(true);
        setMpesaStatus('pending');
        setMpesaMessage('Initiating M-Pesa payment...');

        try {
          // Initiate STK Push
          const res = await fetch('http://localhost:5000/api/mpesa/stk-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phoneNumber: phone,
              amount: calculateTotal(),
              accountReference: generateTransactionReference(),
              transactionDesc: 'POS Sale'
            })
          });
          const data = await res.json();

          if (data.success && data.data.CheckoutRequestID) {
            setMpesaMessage('STK Push sent. Please complete payment on your phone.');

            // Poll for payment status
            let attempts = 0;
            const maxAttempts = 10;
            const pollInterval = 3000; // 3 seconds

            const pollPaymentStatus = async () => {
              attempts++;

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
                if (statusData.data.status === "completed") {
                  setMpesaStatus('success');
                  setMpesaMessage(statusData.data.message || 'Payment successful!');

                  // Save transaction as completed
                  const transaction: Transaction = {
                    id: data.data.CheckoutRequestID,
                    type: 'sale',
                    customerId: selectedCustomer?.id,
                    items: cart,
                    total: calculateTotal(),
                    discount,
                    paymentMethod: 'mobile',
                    payments: [
                      {
                        method: 'mobile',
                        amount: calculateTotal(),
                        details: phone
                      }
                    ],
                    paymentDetails: data.data.CheckoutRequestID,
                    status: 'completed',
                    createdAt: new Date().toISOString(),
                    paymentConfirmation: statusData.data,
                    failureReason: undefined
                  };
                  // Update inventory and save
                  const updatedProducts = updateInventory(cart, products);
                  storage.setProducts(updatedProducts);
                  // Update customer balances if needed
                  if (selectedCustomer) {
                    const updatedCustomers = updateCustomerBalances(customers, selectedCustomer.id, 0, calculateTotal());
                    storage.setCustomers(updatedCustomers);
                  }
                  // Save transaction
                  storage.setTransactions([...storage.getTransactions(), transaction]);
                  recordTransaction(transaction);
                  toast.success('Payment successful and transaction saved!');
                  setTimeout(() => {
                    setIsMpesaModalOpen(false);
                    resetCart();
                    setPrimaryPayment({ method: 'cash', amount: 0, details: '' });
                    setMpesaResultCode(null);
                    setMpesaResultDesc(null);
                  }, 2000);
                } else {
                  setMpesaStatus('failed');
                  const failureMessage = statusData.data.message || statusData.data.ResultDesc || 'Payment failed or cancelled.';
                  setMpesaMessage(failureMessage);

                  toast.error(failureMessage);
                  setTimeout(() => {
                    setIsMpesaModalOpen(false);
                    setMpesaResultCode(null);
                    setMpesaResultDesc(null);
                  }, pollInterval);
                }
              } else if (attempts < maxAttempts) {
                setTimeout(pollPaymentStatus, 5000);
              } else {
                setMpesaStatus('failed');
                const failureMessage = 'Payment not confirmed. Please try again.';
                setMpesaMessage(failureMessage);
                
                toast.error(failureMessage);
                setTimeout(() => {
                  setIsMpesaModalOpen(false);
                  setMpesaResultCode(null);
                  setMpesaResultDesc(null);
                }, 3000);
              }
            };

            setTimeout(pollPaymentStatus, 5000);
          }
        } catch (err) {
          setMpesaStatus('failed');
          const failureMessage = 'Error checking payment status. Please try again.';
          setMpesaMessage(failureMessage);

          toast.error(failureMessage);
          setTimeout(() => {
            setIsMpesaModalOpen(false);
            setMpesaResultCode(null);
            setMpesaResultDesc(null);
          }, 3000);
        }
        return; // Prevent further processing for M-Pesa
      }

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product?.price || 0) * item.quantity;
      }, 0);
      // Discount is a value, not percent
      const discountAmount = discount;
      const total = subtotal - discountAmount;
      const transactionId = generateTransactionReference();

      // Payments array
      const payments = saveAsDebt ? [] : (useMultiplePayments
        ? [
            {
              method: primaryPayment.method,
              amount: primaryPayment.amount,
              details: primaryPayment.details
            },
            {
              method: secondaryPayment.method,
              amount: secondaryPayment.amount,
              details: secondaryPayment.details
            }
          ]
        : [
            {
              method: primaryPayment.method,
              amount: total,
              details: primaryPayment.details
            }
          ]);

      // Create transaction
      const transaction: Transaction = {
        id: transactionId,
        type: saveAsDebt ? 'debt' : 'sale',
        customerId: selectedCustomer?.id,
        items: cart,
        total: total,
        discount,
        paymentMethod: saveAsDebt ? 'cash' : primaryPayment.method,
        payments,
        paymentDetails: saveAsDebt
          ? `Debt Sale for ${selectedCustomer?.name}`
          : (useMultiplePayments
            ? `Split Payment - ${primaryPayment.method}: ${primaryPayment.amount}, ${secondaryPayment.method}: ${secondaryPayment.amount}`
            : primaryPayment.details),
        status: 'completed',
        createdAt: new Date().toISOString(),
        paymentConfirmation: undefined,
        failureReason: undefined
      };

      // Update inventory and save
      const updatedProducts = updateInventory(cart, products);
      storage.setProducts(updatedProducts);

      // For debt sales, the entire amount is unpaid
      const unpaidAmount = saveAsDebt ? total : (total - (useMultiplePayments
        ? (primaryPayment.amount + secondaryPayment.amount)
        : total));

      // Update customer balance
      if (selectedCustomer && (unpaidAmount > 0 || saveAsDebt)) {
        const updatedCustomers = updateCustomerBalances(customers, selectedCustomer.id, unpaidAmount, total);
        storage.setCustomers(updatedCustomers);
      }

      // Save transaction
      const existingTransactions = storage.getTransactions();
      storage.setTransactions([...existingTransactions, transaction]);

      // Record in register
      if (saveAsDebt) {
        recordTransaction(transaction);
      } else if (useMultiplePayments) {
        if (primaryPayment.amount > 0) {
          recordTransaction({
            ...transaction,
            total: primaryPayment.amount,
            discount: discount,
            paymentMethod: primaryPayment.method,
            payments,
            paymentDetails: primaryPayment.details || ''
          });
        }
        if (secondaryPayment.amount > 0) {
          recordTransaction({
            ...transaction,
            total: secondaryPayment.amount,
            discount: discount,
            paymentMethod: secondaryPayment.method,
            payments,
            paymentDetails: secondaryPayment.details || ''
          });
        }
      } else {
        recordTransaction({
          ...transaction,
          total: calculateTotal(),
          discount: discount
        });
      }

      // WhatsApp message for debt
      if (saveAsDebt && messageCustomer && selectedCustomer) {
        const phone = selectedCustomer.phone.replace(/^0/, '254');
        const prevBalance = selectedCustomer.previousBalance || 0;
        // Get time based greeting
        const getTimeBasedGreeting = () => {
          const hour = new Date().getHours();
          if (hour < 12) return "Good Morning";
          if (hour < 18) return "Good Afternoon";
          return "Good Evening";
        };
        const message =
          `*Everben Enterprises* (Till No: 620432)\n\n` +
          `Hello ${selectedCustomer.name}, ${getTimeBasedGreeting()},\n\n` +
          `*Previous Balance:* Ksh${prevBalance.toFixed(2)}\n` +
          `*New Items:*\n` +
          cart.map(item => {
            const product = products.find(p => p.id === item.productId);
            return `- ${product?.name || 'Unnamed'} x${item.quantity} @ Ksh${Number(product?.price).toFixed(2)}`;
          }).join('\n') +
          `\n\n*New Debt Total:* Ksh${(prevBalance + total).toFixed(2)}\n\n` +
          `Thank you for your business!`;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }

      toast.success('Payment successful and transaction saved!');

      // Reset state
      resetCart();
      setPrimaryPayment({ method: 'cash', amount: 0, details: '' });
      setSecondaryPayment({ method: 'mobile', amount: 0, details: '' });
      setUseMultiplePayments(false);
      setCashRendered(0);
      setSaveAsDebt(false);
    };

    if (!isRegisterOpen) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Register Is Closed</h2>
          <p className="text-gray-600 mb-6">Open Register to make a sale</p>
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Open Register
          </button>
        </div>
      );
    }


    return (
      <>
        {isMpesaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
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
        )}
        <div className="flex h-full gap-6">
        
        <div className="flex-1 overflow-auto space-y-6">
          <ProductSearch
            products={products}
            onSelect={addToCart}
          />

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Current Cart</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsRetrieveModalOpen(true)}
                  className="flex items-center px-3 py-1 border rounded hover:bg-gray-50"
                >
                  <PlayCircle className="w-4 h-4 mr-1" />
                  Retrieve
                </button>
                <button
                  onClick={() => setIsHoldModalOpen(true)}
                  className="flex items-center px-3 py-1 border rounded hover:bg-gray-50"
                  disabled={cart.length === 0}
                >
                  <PauseCircle className="w-4 h-4 mr-1" />
                  Hold
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cart.map(item => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <div key={item.productId} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium">{product?.name}</p>
                      <p className="text-sm text-gray-600">Ksh{product?.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 border rounded"
                        min="0.1"
                        step="0.1"
                      />
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Summary */}
            <CartSummary
              items={cart}
              products={products}
              discount={discount}
            />
          </div>
        </div>

        {/* Checkout Panel */}
        <div className="w-96 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Checkout</h2>
          
          <div className="space-y-4">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer (Optional)
              </label>
              <select
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === e.target.value);
                  setSelectedCustomer(customer || null);
                }}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            {/* Save as Debt Option (Only for registered customers) */}
            {selectedCustomer && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="saveAsDebt"
                  checked={saveAsDebt}
                  onChange={(e) => setSaveAsDebt(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label
                  htmlFor="saveAsDebt"
                  className="ml-2 text-sm text-gray-700"
                >
                  Save as debt
                </label>
              </div>
            )}

            {selectedCustomer && saveAsDebt && (
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="messageCustomer"
                  checked={messageCustomer}
                  onChange={(e) => setMessageCustomer(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="messageCustomer" className="ml-2 text-sm text-gray-700">
                  Message items to customer
                </label>
              </div>
            )}

            {/* Multiple Payment Methods Toggle */}
            {!saveAsDebt && (
            <>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="multiplePayments"
                checked={useMultiplePayments}
                onChange={(e) => setUseMultiplePayments(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label
                htmlFor="multiplePayments"
                className="ml-2 text-sm text-gray-700"
              >
                Pay with multiple payment methods
              </label>
            </div>

            {useMultiplePayments ? (
              <>
                {/* Primary Payment */}
                <div className="space-y-2">
                  <h3 className="font-medium">Primary Payment</h3>
                  <select
                    value={primaryPayment.method}
                    onChange={(e) => setPrimaryPayment({
                      ...primaryPayment,
                      method: e.target.value as any
                    })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile">Mobile Money</option>
                  </select>
                  <input
                    type="number"
                    value={primaryPayment.amount}
                    onChange={(e) => setPrimaryPayment({
                      ...primaryPayment,
                      amount: Number(e.target.value)
                    })}
                    placeholder="Amount"
                    className="w-full p-2 border rounded-lg"
                    min="0"
                    step="0.01"
                  />
                  {primaryPayment.method !== 'cash' && (
                    <input
                      type="text"
                      value={primaryPayment.details}
                      onChange={(e) => setPrimaryPayment({
                        ...primaryPayment,
                        details: e.target.value
                      })}
                      placeholder="Transaction Reference"
                      className="w-full p-2 border rounded-lg"
                    />
                  )}
                </div>

                {/* Secondary Payment */}
                <div className="space-y-2">
                  <h3 className="font-medium">Secondary Payment</h3>
                  <select
                    value={secondaryPayment.method}
                    onChange={(e) => setSecondaryPayment({
                      ...secondaryPayment,
                      method: e.target.value as any
                    })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile">Mobile Money</option>
                  </select>
                  <input
                    type="number"
                    value={secondaryPayment.amount}
                    onChange={(e) => setSecondaryPayment({
                      ...secondaryPayment,
                      amount: Number(e.target.value)
                    })}
                    placeholder="Amount"
                    className="w-full p-2 border rounded-lg"
                    min="0"
                    step="0.01"
                  />
                  {secondaryPayment.method !== 'cash' && (
                    <input
                      type="text"
                      value={secondaryPayment.details}
                      onChange={(e) => setSecondaryPayment({
                        ...secondaryPayment,
                        details: e.target.value
                      })}
                      placeholder="Transaction Reference"
                      className="w-full p-2 border rounded-lg"
                    />
                  )}
                </div>

                <div className="text-sm text-gray-600">
                  Total to Pay: Ksh{calculateTotal().toFixed(2)}
                  <br />
                  Amount Covered: Ksh{(primaryPayment.amount + secondaryPayment.amount).toFixed(2)}
                  <br />
                  Remaining: Ksh{Math.max(0, calculateTotal() - (primaryPayment.amount + secondaryPayment.amount)).toFixed(2)}
                  <br />
                  Change: Ksh{calculateChange().toFixed(2)}
                </div>
              </>
            ) : (
              <>
                {/* Single Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={primaryPayment.method}
                    onChange={(e) => setPrimaryPayment({
                      ...primaryPayment,
                      method: e.target.value as any
                    })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mobile">Mobile Money</option>
                  </select>
                </div>

                {primaryPayment.method === 'cash' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cash Rendered
                    </label>
                    <input
                      type="number"
                      value={cashRendered}
                      onChange={(e) => setCashRendered(Number(e.target.value))}
                      className="w-full p-2 border rounded-lg"
                      min="0"
                      step="0.01"
                    />
                    {cashRendered > 0 && (
                      <div className="mt-2 text-sm">
                        Change: Ksh{calculateChange().toFixed(2)}
                      </div>
                    )}
                  </div>
                )}

                {primaryPayment.method !== 'cash' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {primaryPayment.method === 'mobile'
                        ? 'M-Pesa Phone Number (format: 254XXXXXXXX)'
                        : 'Transaction Reference'}
                    </label>
                    <input
                      type={primaryPayment.method === 'mobile' ? 'tel' : 'text'}
                      value={primaryPayment.details}
                      onChange={(e) => setPrimaryPayment({
                        ...primaryPayment,
                        details: e.target.value
                      })}
                      className="w-full p-2 border rounded-lg"
                      required
                      placeholder={
                        primaryPayment.method === 'mobile'
                          ? 'e.g. 25412345678'
                          : 'Enter transaction reference'
                      }
                      pattern={primaryPayment.method === 'mobile' ? '^254\\d{9}$' : undefined}
                      maxLength={primaryPayment.method === 'mobile' ? 12 : undefined}
                    />
                    {primaryPayment.method === 'mobile' && primaryPayment.details && !/^254\d{9}$/.test(primaryPayment.details) && (
                      <div className="text-red-600 text-xs mt-1">
                        Please enter a valid M-Pesa number (format: 254XXXXXXXX)
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            </>
            )}

            {/* Complete Sale Button */}
            <button
              onClick={handleCheckout}
              disabled={
                cart.length === 0 ||
                (useMultiplePayments && (primaryPayment.amount + secondaryPayment.amount) === 0) ||
                (!useMultiplePayments &&
                  primaryPayment.method === 'mobile' &&
                  !/^254\d{9}$/.test(primaryPayment.details))
              }
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Complete Sale
            </button>
          </div>
        </div>

        <HoldTransactionModal
          isOpen={isHoldModalOpen}
          onClose={() => setIsHoldModalOpen(false)}
          items={cart}
          customerId={selectedCustomer?.id}
          discount={discount}
          onHold={holdTransaction}
        />

        <RetrieveHeldTransactionModal
          isOpen={isRetrieveModalOpen}
          onClose={() => setIsRetrieveModalOpen(false)}
          onRetrieve={retrieveTransaction}
          heldTransactions={heldTransactions}
        />
      </div>
      </>
    );
  };

  export default POSPage;


