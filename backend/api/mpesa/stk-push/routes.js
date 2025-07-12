import express from 'express';
import { initiateMpesaPayment } from '../../../lib/mpesa.js'; 

const router = express.Router();

// Handle POST requests for M-Pesa STK Push
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const { phoneNumber, amount, accountReference, transactionDesc } = body;

    // Validate required fields
    if (!phoneNumber || !amount || !accountReference) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["phoneNumber", "amount", "accountReference"],
        received: { phoneNumber: !!phoneNumber, amount: !!amount, accountReference: !!accountReference },
      });
    }

    // Validate phone number format
    const phoneRegex = /^(\+254|254|0)[17]\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        error: "Invalid phone number format. Use format: +254XXXXXXXXX, 254XXXXXXXXX, or 07XXXXXXXX"
      });
    }

    // Validate amount
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: "Amount must be a positive number" });
    }

    if (numAmount < 1) {
      return res.status(400).json({ error: "Minimum amount is KES 1" });
    }

    // Log the request for debugging
    // console.log("STK Push Request:", {
    //   phoneNumber,
    //   amount: numAmount,
    //   accountReference,
    //   transactionDesc: transactionDesc || "Payment for goods/services",
    // });

    // Initiate STK Push
    const result = await initiateMpesaPayment({
      phoneNumber,
      amount: numAmount,
      accountReference,
      transactionDesc: transactionDesc || "Payment for goods/services",
    });

    // Log the response for debugging
    // console.log("STK Push Response:", result);

    // Check if the request was successful
    if (result.ResponseCode === "0") {
      return res.json({
        success: true,
        message: "STK Push sent successfully",
        data: {
          MerchantRequestID: result.MerchantRequestID,
          CheckoutRequestID: result.CheckoutRequestID,
          CustomerMessage: result.CustomerMessage,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.ResponseDescription || "STK Push failed",
        code: result.ResponseCode,
      });
    }
  } catch (error) {
    console.error("STK Push Error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("access token")) {
        return res.status(401).json({
          error: "M-Pesa authentication failed. Please check your credentials."
        });
      }

      if (error.message.includes("network") || error.message.includes("fetch")) {
        return res.status(503).json({
          error: "Network error. Please try again later."
        });
      }
    }

    return res.status(500).json({
      error: "Failed to initiate payment",
      details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
    });
  }
});


export default router;