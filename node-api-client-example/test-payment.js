import dotenv from "dotenv";
import { createClient } from "@patalink/node-api-client";

dotenv.config();

// Initialize PataLink client
const client = createClient({
  apiKey:
    process.env.PATALINK_API_KEY ? process.env.PATALINK_API_KEY : "",
  encryptionKey:
    process.env.PATALINK_ENCRYPTION_KEY ? process.env.PATALINK_ENCRYPTION_KEY :
      "",
  baseUrl: process.env.PATALINK_BASE_URL || "https://api.patalink.me",
});

async function main() {
  console.log("----------------------------------------------------");
  console.log("🧪 Testing @patalink/node-api-client (Payment API)");
  console.log("----------------------------------------------------");
  console.log(`📡 Base URL: ${process.env.PATALINK_BASE_URL || "https://api.patalink.me"}`);

  // 1. Check account info & wallet balance
  console.log("\n[1/4] Fetching account info & wallet balances...");
  const account = await client.getAccountInfo();
  console.log("✅ Account info retrieved successfully:");
  console.log(`   - User / ID         : ${account.username || account.id}`);
  console.log(`   - Available Balance : ${account.availableBalance} RWF`);
  console.log(`   - Total Balance     : ${account.walletBalance} RWF`);
  console.log(`   - Pending Balance   : ${account.pendingBalance} RWF`);

  // 2. Create a payment request (MoMo collection)
  console.log("\n[2/4] Creating test payment collection of 100 RWF via MTN Mobile Money...");
  const payment = await client.createPayment({
    amount: 2200,
    paymentMethod: "MTN",
    phoneNumber: "",
    customerName: "Test Customer",
    customerEmail: "customer@example.com",
    callbackUrl: "https://example.com/api/webhooks/patalink",
  });

  console.log("✅ Payment initiated successfully:");
  console.log(`   - Transaction ID : ${payment.transactionId}`);
  console.log(`   - Status         : ${payment.status}`);
  if (payment.redirectUrl) {
    console.log(`   - Redirect URL   : ${payment.redirectUrl}`);
  }
  if (payment.message) {
    console.log(`   - Message        : ${payment.message}`);
  }

  // 3. Query payment status
  console.log("\n[3/4] Querying payment status by transaction ID...");
  const status = await client.getTransactionStatus(payment.transactionId);
  console.log(`✅ Status verified: ${status.status}`);
  if (status.amount) {
    console.log(`   - Amount         : ${status.amount} ${status.currency || "RWF"}`);
  }
  if (status.paymentMethod) {
    console.log(`   - Payment Method : ${status.paymentMethod}`);
  }
  if (status.providerRef) {
    console.log(`   - Provider Ref   : ${status.providerRef}`);
  }
  if (status.reason) {
    console.log(`   - Reason         : ${status.reason}`);
  }

  // 4. Poll for completion
  console.log("\n[4/4] Polling transaction status (up to 20 attempts)...");
  try {
    const completed = await client.waitForCompletion(payment.transactionId, {
      maxAttempts: 20,
      interval: 3000,
      onProgress: (attempt, currentStatus) => {
        console.log(`   ⏳ Poll #${attempt}: Status is ${currentStatus}`);
      },
    });
    console.log(`\n🎉 Terminal status reached: ${completed.status}`);
  } catch (timeoutErr) {
    console.log(`\nℹ️ Note: ${timeoutErr.message}`);
  }

  console.log("----------------------------------------------------\n");
}

main().catch(error => {
  console.error("\n❌ Test failed:", error.message);
  process.exit(1);
});
