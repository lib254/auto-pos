import express from 'express';
import { getItem, setItem, getTransactions, setTransactions } from '../backendStorage.js';

const router = express.Router();

// Handle POST requests for M-Pesa callback
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    // Log the callback for debugging
    // console.log("M-Pesa Callback received:", JSON.stringify(body, null, 2));

    // Extract callback data
    const { Body } = body;
    const { stkCallback } = Body || {};

    if (stkCallback) {
      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

      // Save callback result in local storage for later query
      try {
        let mpesaResults = await getItem('mpesaResults');
        if (!mpesaResults) mpesaResults = {};
        mpesaResults[CheckoutRequestID] = {
          MerchantRequestID,
          CheckoutRequestID,
          ResultCode,
          ResultDesc,
          raw: stkCallback
        };
        await setItem('mpesaResults', mpesaResults);
        
        // Debug: print the saved file content
        try {
          const fs = await import('fs');
          const path = await import('path');
          const dataPath = path.resolve(process.cwd(), 'data', 'mpesaResults.json');
          if (fs.existsSync(dataPath)) {
            const fileContent = fs.readFileSync(dataPath, 'utf-8');
            console.log('mpesaResults.json file content:', fileContent);
          } else {
            console.log('mpesaResults.json file does not exist yet.');
          }
        } catch (debugErr) {
          console.error('Error reading mpesaResults.json for debug:', debugErr);
        }
      } catch (err) {
        console.error('Error saving mpesaResults to storage:', err);
      }

      if (String(ResultCode) === "0") {
        // Payment successful
        console.log("Payment successful:", {
          MerchantRequestID,
          CheckoutRequestID,
          ResultDesc,
        });

        // Extract payment details if available
        if (stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
          const metadata = stkCallback.CallbackMetadata.Item;
          console.log("Payment metadata found, processing..."); // Fixed: Only log when metadata exists
          
          if (Array.isArray(metadata)) {
            const paymentData = metadata.reduce((acc, item) => {
              acc[item.Name] = item.Value;
              return acc;
            }, {});

            console.log("Payment Details:", paymentData);
            console.log("Looking for CheckoutRequestID in transactions:", CheckoutRequestID);

            // --- Update transaction status in storage ---
            try {
              const transactions = await getTransactions(); // Fixed: Define transactions variable
              console.log("All transactions:", JSON.stringify(transactions, null, 2));
              
              const idx = transactions.findIndex(
                tx =>
                  tx.checkoutRequestID === CheckoutRequestID ||
                  tx.paymentDetails === paymentData.MpesaReceiptNumber
              );
              
              if (idx !== -1) {
                transactions[idx].status = "completed";
                transactions[idx].paymentDetails = paymentData.MpesaReceiptNumber;
                transactions[idx].paymentConfirmation = paymentData;
                await setTransactions(transactions);
                console.log("Transaction updated successfully:", transactions[idx]);
              } else {
                console.warn("Transaction not found for M-Pesa payment:", paymentData);
              }
            } catch (err) {
              console.error("Error updating transaction in storage:", err);
            }
            // --- End update ---
          } else {
            console.warn("CallbackMetadata.Item is not an array:", metadata);
          }
        } else {
          console.warn("Callback missing payment metadata");
        }
      } else {
        // Payment failed or cancelled
        console.log("Payment failed or cancelled:", {
          MerchantRequestID,
          CheckoutRequestID,
          ResultCode,
          ResultDesc,
        });

        // --- Update transaction status to failed in storage ---
        try {
          const transactions = await getTransactions();
          const idx = transactions.findIndex(
            tx => tx.checkoutRequestID === CheckoutRequestID
          );
          if (idx !== -1) {
            transactions[idx].status = "failed";
            transactions[idx].failureReason = ResultDesc;
            await setTransactions(transactions);
            console.log("Transaction marked as failed:", transactions[idx]);
          } else {
            console.warn("Transaction not found for failed payment:", CheckoutRequestID);
          }
        } catch (err) {
          console.error("Error updating failed transaction in storage:", err);
        }
        // --- End update ---
      }
    } else {
      console.warn("Invalid callback format received - missing stkCallback");
    }

    // Always return success to M-Pesa to acknowledge receipt
    return res.json({
      ResultCode: 0,
      ResultDesc: "Success",
    });
  } catch (error) {
    console.error("M-Pesa Callback Error:", error);

    // Still return success to M-Pesa to avoid retries
    return res.json({
      ResultCode: 0,
      ResultDesc: "Success",
    });
  }
});

export default router;