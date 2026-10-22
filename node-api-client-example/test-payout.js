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
  console.log("🧪 Testing @patalink/node-api-client (Withdrawal API)");
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

  // 2. Create a withdrawal
  console.log("\n[2/4] Creating test withdrawal of 1,500 RWF to MTN Mobile Money...");
  const payout = await client.createWithdrawal({
    amount: 1500,
    destinationNumber: "",
    network: "MTN",
    reference: `TEST-${Date.now()}`,
    recipientNote: "Package verification test",
  });

  console.log("✅ Withdrawal created successfully:");
  console.log(`   - Withdrawal ID : ${payout.id}`);
  console.log(`   - Status        : ${payout.status}`);
  console.log(`   - Amount        : ${payout.amount} ${payout.currency || "RWF"}`);
  console.log(`   - Recipient     : ${payout.destinationNumber} (${payout.network})`);
  console.log(`   - Reference     : ${payout.reference}`);

  // 3. Query status
  console.log("\n[3/4] Querying withdrawal status by ID...");
  const status = await client.getWithdrawalStatus(payout.id);
  console.log(`✅ Status verified: ${status.status}`);

  // 4. Poll for completion
  console.log("\n[4/4] Polling until terminal status...");
  const completed = await client.waitForWithdrawalCompletion(payout.id, {
    maxAttempts: 5,
    interval: 1000,
    onProgress: (attempt, currentStatus) => {
      console.log(`   ⏳ Poll #${attempt}: Status is ${currentStatus}`);
    },
  });

  console.log(`\n🎉 Success! Terminal status reached: ${completed.status}`);
  console.log("----------------------------------------------------\n");
}

main().catch(error => {
  console.error("\n❌ Test failed:", error.message);
  process.exit(1);
});
