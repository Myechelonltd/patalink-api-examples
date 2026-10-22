import express from "express";
import dotenv from "dotenv";
import { createClient } from "@patalink/node-api-client";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// Initialize PataLink client
const client = createClient({
  apiKey:
    process.env.PATALINK_API_KEY ? process.env.PATALINK_API_KEY : "",
  encryptionKey:
    process.env.PATALINK_ENCRYPTION_KEY ? process.env.PATALINK_ENCRYPTION_KEY :
      "",
  baseUrl: process.env.PATALINK_BASE_URL || "https://api.patalink.me",
});

/**
 * HEALTH CHECK
 */
app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "PataLink Payment & Payout Gateway Example",
    version: "2.1.0",
    endpoints: {
      payments: {
        initiate: "POST /api/payments/initiate",
        verify: "GET /api/payments/:id/verify",
      },
      withdrawals: {
        initiate: "POST /api/withdrawals/initiate",
        verify: "GET /api/withdrawals/:id/verify",
      },
      account: "GET /api/account",
      webhook: "POST /api/webhooks/patalink",
    },
  });
});

/**
 * ACCOUNT & BALANCE
 * Check merchant wallet balances.
 */
app.get("/api/account", async (req, res) => {
  try {
    const account = await client.getAccountInfo();
    res.json({ success: true, account });
  } catch (error) {
    console.error("[ACCOUNT_ERROR]", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch account info",
    });
  }
});

/**
 * 1. INITIATE PAYMENT (Backend-to-Backend Collection)
 * Use this when you want to charge a customer via Mobile Money or Card.
 */
app.post("/api/payments/initiate", async (req, res) => {
  try {
    const {
      amount,
      paymentMethod,
      phoneNumber,
      customerName,
      customerEmail,
      callbackUrl,
    } = req.body;

    // Basic Validation
    if (!amount || !paymentMethod || !phoneNumber) {
      return res.status(400).json({
        error:
          "Missing required payment fields (amount, paymentMethod, phoneNumber)",
      });
    }

    // Call PataLink SDK
    const payment = await client.createPayment({
      amount: Number(amount),
      paymentMethod, // 'MTN' | 'AIRTEL' | 'PesaPal'
      phoneNumber,
      customerName: customerName || "Guest Customer",
      customerEmail: customerEmail || "customer@example.com",
      callbackUrl: callbackUrl || "https://your-site.com/callback",
    });

    console.log(`[PAYMENT_INITIATED] ID: ${payment.transactionId}`);

    res.status(201).json({
      success: true,
      transactionId: payment.transactionId,
      redirectUrl: payment.redirectUrl, // Useful for Card payments
      message: "Payment request sent to provider",
    });
  } catch (error) {
    console.error("[PAYMENT_ERROR]", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to initiate payment",
    });
  }
});

/**
 * 2. VERIFY PAYMENT STATUS
 * Use this to check if a collection transaction was completed.
 */
app.get("/api/payments/:id/verify", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Transaction ID is required" });
    }

    // Call PataLink SDK
    const statusData = await client.getTransactionStatus(id);

    console.log(`[STATUS_CHECK] ID: ${id} | Status: ${statusData.status}`);

    res.json({
      success: true,
      status: statusData.status, // 'pending' | 'success' | 'failed'
      amount: statusData.amount,
      reason: statusData.reason,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[VERIFY_ERROR]", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to verify payment",
    });
  }
});

/**
 * 3. INITIATE WITHDRAWAL / PAYOUT (B2C)
 * Disburse funds directly to a recipient's MTN Mobile Money wallet.
 */
app.post("/api/withdrawals/initiate", async (req, res) => {
  try {
    const {
      amount,
      destinationNumber,
      phoneNumber,
      reference,
      recipientNote,
      callbackUrl,
      idempotencyKey,
    } = req.body;

    const phone = destinationNumber || phoneNumber;

    // Basic Validation
    if (!amount || !phone) {
      return res.status(400).json({
        error:
          "Missing required withdrawal fields (amount, destinationNumber)",
      });
    }

    if (Number(amount) < 1000) {
      return res.status(400).json({
        error: "Minimum withdrawal amount is 1,000 RWF",
      });
    }

    // Call PataLink SDK (Restricted strictly to MTN Mobile Money)
    const withdrawal = await client.createWithdrawal({
      amount: Number(amount),
      destinationNumber: phone,
      network: "MTN",
      reference: reference || `WD-${Date.now()}`,
      recipientNote: recipientNote || "Payout from Merchant",
      callbackUrl: callbackUrl || "https://your-site.com/api/webhooks/patalink",
      idempotencyKey: idempotencyKey || undefined,
    });

    console.log(
      `[WITHDRAWAL_INITIATED] ID: ${withdrawal.id || withdrawal.withdrawalId} | Status: ${withdrawal.status}`
    );

    res.status(201).json({
      success: true,
      withdrawalId: withdrawal.id || withdrawal.withdrawalId,
      status: withdrawal.status,
      amount: withdrawal.amount,
      network: withdrawal.network,
      destinationNumber: withdrawal.destinationNumber,
      fee: withdrawal.fee,
      netWalletBalance: withdrawal.netWalletBalance,
      reference: withdrawal.reference,
      message: "Withdrawal request dispatched to provider",
    });
  } catch (error) {
    console.error("[WITHDRAWAL_ERROR]", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to initiate withdrawal",
    });
  }
});

/**
 * 4. VERIFY WITHDRAWAL STATUS
 * Check payout status by Withdrawal ID or reference.
 */
app.get("/api/withdrawals/:id/verify", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Withdrawal ID is required" });
    }

    // Call PataLink SDK
    const statusData = await client.getWithdrawalStatus(id);

    console.log(`[WITHDRAWAL_STATUS] ID: ${id} | Status: ${statusData.status}`);

    res.json({
      success: true,
      id: statusData.id,
      status: statusData.status, // 'pending' | 'processing' | 'paid' | 'rejected' | 'failed'
      amount: statusData.amount,
      network: statusData.network,
      destinationNumber: statusData.destinationNumber,
      reference: statusData.reference,
      failureReason: statusData.failureReason,
      paidAt: statusData.paidAt,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[WITHDRAWAL_VERIFY_ERROR]", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to verify withdrawal",
    });
  }
});

/**
 * 5. WEBHOOK HANDLER
 * Handles both incoming payment updates and outgoing withdrawal status events.
 */
app.post("/api/webhooks/patalink", (req, res) => {
  const payload = req.body;
  const event = payload.event;

  console.log(`[WEBHOOK_RECEIVED] Event: ${event || "legacy"} | Data:`, payload);

  // Handle Withdrawal Events (Payouts)
  if (event === "withdrawal.paid") {
    const data = payload.data || payload;
    console.log(
      `✅ [WITHDRAWAL_PAID] ID: ${data.withdrawalId || data.id} | Amount: ${data.amount} RWF to ${data.destinationNumber} (Ref: ${data.reference})`
    );
    // TODO: Mark payout completed in your database
  } else if (event === "withdrawal.failed" || event === "withdrawal.rejected") {
    const data = payload.data || payload;
    console.log(
      `❌ [WITHDRAWAL_FAILED] ID: ${data.withdrawalId || data.id} | Reason: ${data.failureReason || data.reason}`
    );
    // TODO: Notify admin or refund balance in your internal system
  }
  // Handle Payment Events (Collections)
  else if (
    event === "payment.completed" ||
    payload.status === "COMPLETED" ||
    payload.status === "success"
  ) {
    const transactionId = payload.transactionId || payload.data?.transactionId;
    console.log(
      `💰 [PAYMENT_RECEIVED] ID: ${transactionId} | Amount: ${payload.amount || payload.data?.amount}`
    );
    // TODO: Fulfill order, deliver digital goods
  } else if (event === "payment.failed" || payload.status === "FAILED") {
    const transactionId = payload.transactionId || payload.data?.transactionId;
    console.log(
      `⚠️ [PAYMENT_FAILED] ID: ${transactionId} | Reason: ${payload.reason || payload.data?.reason}`
    );
  }

  // Always return 200 to acknowledge the webhook receipt
  res.status(200).send("OK");
});

// Start Server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`\n🚀 PataLink Backend Example Running`);
  console.log(`-----------------------------------`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`-----------------------------------\n`);
});
