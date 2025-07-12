/**
 * Safely parse a fetch Response.  Always returns `{ ok, status, data }`
 * where `data` is JSON if possible, otherwise the raw text.
 */
const read = async (res) => {
  const raw = await res.text()
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(raw) }
  } catch {
    return { ok: res.ok, status: res.status, data: raw }
  }
}

// Toggle to `true` to bypass real Daraja requests in dev / preview environments
const SIMULATE_STK = process.env.MPESA_SIMULATE === "true"

const DARARA_BASE =
  (process.env.MPESA_ENVIRONMENT || "sandbox") === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke"

const getAccessToken = async () => {
  // Use environment variables instead of hardcoded values
  const consumerKey = process.env.MPESA_CONSUMER_KEY || "6cT4cBJUPASxjMlpAK6n4w6wxYwod8Ir5htAbwTMEbWfzybk"
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET || "myPfv4vuGJwuBFWgBvaf6ttp2HNKB42EtEruf6WEM0vfQTuwGFnjynxz5X6RS0JW"

  if (!consumerKey || !consumerSecret) {
    throw new Error("MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET is not set")
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")

  // console.log("Requesting access token from:", `${DARARA_BASE}/oauth/v1/generate?grant_type=client_credentials`)

  const res = await fetch(`${DARARA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      // Remove Content-Type header as it's not needed for OAuth and might cause issues
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })

  const { ok, data } = await read(res)
  if (!ok) {
    // console.error("M-Pesa Access-Token error:", data)
    throw new Error(typeof data === "string" ? data : data.errorMessage || "Failed to generate access token")
  }

  console.log("Access token obtained successfully")
  return data.access_token
}

const initiateSTKPush = async (phoneNumber, amount, accountReference, transactionDesc) => {
  const BusinessShortCode = process.env.MPESA_SHORTCODE || "174379"
  const PassKey = process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"

  if (!BusinessShortCode) {
    throw new Error("MPESA_SHORTCODE is not set")
  }

  if (!PassKey) {
    throw new Error("MPESA_PASSKEY is not set")
  }

  const Timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, -3)

  const Password = Buffer.from(`${BusinessShortCode}${PassKey}${Timestamp}`).toString("base64")

  // Use the callback URL from environment or construct one
  const callbackURL = process.env.MPESA_CALLBACK_URL || "https://everben.netlify.app/api/mpesa/callback"

  // Format phone number to international format
  const formattedPhone = phoneNumber.startsWith("0")
    ? "254" + phoneNumber.slice(1)
    : phoneNumber.startsWith("254")
      ? phoneNumber
      : "254" + phoneNumber

  // console.log("Formatted phone number:", formattedPhone)
  // console.log("Using callback URL:", callbackURL)

  const payload = {
    BusinessShortCode,
    Password,
    Timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(amount),
    PartyA: formattedPhone,
    PartyB: BusinessShortCode,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackURL,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  }

  // console.log("STK Push payload:", JSON.stringify(payload, null, 2))

  // ------------------------------------------------------------------
  // LOCAL DEV / CI SIMULATION
  // ------------------------------------------------------------------
  if (SIMULATE_STK) {
    console.warn("[MPESA] SIMULATION MODE – returning fake STK-Push response")
    return {
      MerchantRequestID: "0000-sim",
      CheckoutRequestID: "ws_CO_123456789",
      ResponseCode: "0",
      ResponseDescription: "Simulated Request accepted for processing",
      CustomerMessage: "Success. Request accepted for processing",
    }
  }

  // console.log("[MPESA] Making real STK Push request to Safaricom...")

  const accessToken = await getAccessToken()

  let res
  try {
    res = await fetch(`${DARARA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error("[MPESA] Network error:", err)
    throw new Error(`Network error contacting Safaricom: ${err.message}`)
  }

  const { ok, data: result } = await read(res)

  // console.log("STK Push response:", JSON.stringify(result, null, 2))

  if (!ok) {
    console.error("M-Pesa STK Push Error:", result)
    throw new Error(result.errorMessage || result.ResponseDescription || "STK Push failed")
  }

  return result
}

const querySTKPush = async (checkoutRequestID) => {
  const BusinessShortCode = process.env.MPESA_SHORTCODE || "174379"
  const PassKey = process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"

  if (!BusinessShortCode) {
    throw new Error("MPESA_SHORTCODE is not set")
  }

  const Timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, -3)

  const Password = Buffer.from(`${BusinessShortCode}${PassKey}${Timestamp}`).toString("base64")

  const payload = {
    BusinessShortCode,
    Password,
    Timestamp,
    CheckoutRequestID: checkoutRequestID,
  }

  if (SIMULATE_STK) {
    console.warn("[MPESA] SIMULATION MODE – returning fake query response")
    return {
      ResponseCode: "0",
      ResponseDescription: "The service request has been accepted successfully",
      MerchantRequestID: "0000-sim",
      CheckoutRequestID: checkoutRequestID,
      ResultCode: "0",
      ResultDesc: "The service request is processed successfully.",
    }
  }

  const accessToken = await getAccessToken()

  let res
  try {
    res = await fetch(`${DARARA_BASE}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error("[MPESA] Network error:", err)
    throw new Error(`Network error contacting Safaricom: ${err.message}`)
  }

  const { ok, data: result } = await read(res)

  // console.log("M-Pesa query result:", result)

  if (!ok) {
    // console.error("M-Pesa STK Query Error:", result)
    
    // Check if it's a "still processing" error
    if (result && typeof result === 'object' && result.errorMessage && result.errorMessage.includes("being processed")) {
      throw new Error("Transaction is still being processed")
    }
    
    throw new Error(result.errorMessage || result.ResponseDescription || "STK Query failed")
  }

  return result
}

// Export functions to match your current usage
export const initiateMpesaPayment = (request) => {
  return initiateSTKPush(request.phoneNumber, request.amount, request.accountReference, request.transactionDesc)
}

export const queryMpesaTransaction = (CheckoutRequestID) => {
  return querySTKPush(CheckoutRequestID)
}