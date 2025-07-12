import express from 'express';
import { queryMpesaTransaction } from '../../../lib/mpesa.js';

const router = express.Router();

// Helper function to map M-Pesa ResultCode to status and message
function mapMpesaResultCode(resultCode, resultDesc) {
  switch (resultCode) {
    case "0":
      return { status: "completed", message: "Payment completed successfully" };
    case "1":
      return { status: "insufficient_funds", message: "Insufficient funds" };
    case "1032":
      return { status: "cancelled", message: "Cancelled by user" };
    case "1037":
      return { status: "timeout", message: "Request timed out" };
    case "2001":
      return { status: "insufficient_funds", message: "Insufficient funds" };
    case "2002":
      return { status: "wrong_pin", message: "Wrong PIN entered" };
    case "2003":
      return { status: "transaction_limit_exceeded", message: "Transaction limit exceeded" };
    default:
      return { status: "failed", message: resultDesc || "Transaction failed" };
  }
}

// Handle POST requests for M-Pesa transaction query
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const { CheckoutRequestID } = body; // Changed to match Format 1 naming

    if (!CheckoutRequestID) {
      return res.status(400).json({ 
        success: false, 
        error: "CheckoutRequestID is required" 
      });
    }

    // console.log("Querying payment status for:", CheckoutRequestID);
    
    const result = await queryMpesaTransaction(CheckoutRequestID);
    
    // console.log("M-Pesa query result:", result);

    // Check if the query was successful
    if (result.ResponseCode === "0") {
      const { status, message } = mapMpesaResultCode(result.ResultCode, result.ResultDesc);

      return res.json({
        success: true,
        data: {
          MerchantRequestID: result.MerchantRequestID,
          CheckoutRequestID: result.CheckoutRequestID,
          ResultCode: result.ResultCode,
          ResultDesc: result.ResultDesc,
          status,
          message,
        },
        raw: process.env.NODE_ENV === "development" ? result : undefined,
        source: 'query',
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.ResponseDescription || "Query failed",
        code: result.ResponseCode,
        raw: process.env.NODE_ENV === "development" ? result : undefined,
        source: 'query',
      });
    }
  } catch (error) {
    // console.error("STK Push Query API Error:", error);
    
    // Check if it's a "still processing" error (like Format 1)
    if (error.message && error.message.includes("being processed")) {
      return res.status(200).json({
        success: false,
        error: "Transaction is still being processed"
      });
    }

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("access token")) {
        return res.status(401).json({
          success: false,
          error: "M-Pesa authentication failed. Please check your credentials."
        });
      }

      if (error.message.includes("network") || error.message.includes("fetch")) {
        return res.status(503).json({
          success: false,
          error: "Network error. Please try again later."
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to query payment status",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;