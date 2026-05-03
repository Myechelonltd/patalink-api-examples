import express from "express";
import { createRequire } from 'module';
import dotenv from "dotenv";
// import { createClient } from '@patalink/node-api-client';

const require = createRequire(import.meta.url);
const { createClient } = require('@patalink/node-api-client'); // Using standard client

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// Initialize PataLink client
const client = createClient({
  apiKey: process.env.PATALINK_API_KEY || "pt_live_I2IDt-mrT0QNGdhH5UseJzP6rc-dIVGx",
  encryptionKey: process.env.PATALINK_ENCRYPTION_KEY || "GKRy2jlusn3uAzhrU87qKH9SbQi+26ni8rg7PXnToyg=",
  baseUrl: process.env.PATALINK_BASE_URL || "https://genuine-choux-bd2e69.netlify.app",
});

/**
 * HEALTH CHECK
 */
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "PataLink Payment Gateway Example",
    version: "2.0.0"
  });
});

/**
 * 1. INITIATE PAYMENT (Backend-to-Backend)
 * Use this when you want to handle the payment logic on your own server.
 */
app.post("/api/payments/initiate", async (req, res) => {
  try {
    const { amount, paymentMethod, phoneNumber, customerName, customerEmail, callbackUrl } = req.body;

    // Basic Validation
    if (!amount || !paymentMethod || !phoneNumber) {
      return res.status(400).json({ error: "Missing required payment fields (amount, paymentMethod, phoneNumber)" });
    }

    // Call PataLink SDK
    const payment = await client.createPayment({
      amount: Number(amount),
      paymentMethod, // 'MTN' | 'AIRTEL' | 'PesaPal'
      phoneNumber,
      customerName: customerName || "Guest Customer",
      customerEmail: customerEmail || "customer@example.com",
      callbackUrl: callbackUrl || "https://your-site.com/callback"
    });

    console.log(`[PAYMENT_INITIATED] ID: ${payment.transactionId}`);

    res.status(201).json({
      success: true,
      transactionId: payment.transactionId,
      redirectUrl: payment.redirectUrl, // Useful for Card payments
      message: "Payment request sent to provider"
    });

  } catch (error) {
    console.error("[PAYMENT_ERROR]", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to initiate payment"
    });
  }
});

/**
 * 2. VERIFY STATUS
 * Use this to check if a transaction was completed.
 */
app.get("/api/payments/:id/verify", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ error: "Transaction ID is required" });

    // Call PataLink SDK
    const statusData = await client.getTransactionStatus(id);

    console.log(`[STATUS_CHECK] ID: ${id} | Status: ${statusData.status}`);

    res.json({
      success: true,
      status: statusData.status, // PENDING, COMPLETED, FAILED, REJECTED
      amount: statusData.amount,
      reason: statusData.reason,
      verifiedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("[VERIFY_ERROR]", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to verify payment"
    });
  }
});

/**
 * 3. WEBHOOK HANDLER
 * The recommended way to fulfill orders.
 */
app.post("/api/webhooks/patalink", (req, res) => {
  const { transactionId, status, amount, reason } = req.body;

  console.log(`[WEBHOOK_RECEIVED] ID: ${transactionId} | Status: ${status}`);

  // TODO: Your Fulfillment Logic
  // if (status === 'COMPLETED') {
  //    await Order.update({ transactionId }, { status: 'paid' });
  //    await sendEmailNotification(transactionId);
  // }

  // Always return 200 to acknowledge the webhook
  res.status(200).send("OK");
});

// Start Server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`\n🚀 PataLink Backend Example Running`);
  console.log(`-----------------------------------`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🛠️ API Key: ${client.apiKey.substring(0, 10)}...`);
  console.log(`-----------------------------------\n`);
});
