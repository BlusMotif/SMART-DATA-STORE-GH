import { storage } from "./dist/server/storage.js";

async function configureSkyTechAPI() {
  try {
    console.log("🔧 Configuring SkyTech GH API credentials...");

    // Set the API credentials
    await storage.setSetting(
      "external_api.key",
      "39616c47d95b7f2ce67b4184",
      "SkyTech GH API Key ID"
    );

    await storage.setSetting(
      "external_api.secret",
      "tok_53615840937d20b212ef551cc9388a932fc8fd8d",
      "SkyTech GH API Secret for HMAC signing"
    );

    await storage.setSetting(
      "external_api.endpoint",
      "https://skytechgh.com/api/v1/orders",
      "SkyTech GH API endpoint for order creation"
    );

    console.log("✅ SkyTech GH API credentials configured successfully!");
    console.log("🔑 API Key: 39616c47d95b7f2ce67b4184");
    console.log("🔐 API Secret: [HIDDEN]");
    console.log("🌐 Endpoint: https://skytechgh.com/api/v1/orders");

    // Test the configuration by trying to get balance
    console.log("\n🧪 Testing API connection...");
    const { getExternalBalance } = await import("./dist/server/providers.js");

    const balanceResult = await getExternalBalance();
    if (balanceResult.success) {
      console.log(`💰 Current Balance: GHS ${balanceResult.balance}`);
      console.log("🎉 API integration is working!");
    } else {
      console.log("⚠️  API test failed:", balanceResult.error);
      console.log("Please verify your API credentials with SkyTech GH support.");
    }

  } catch (error) {
    console.error("❌ Error configuring API:", error);
  } finally {
    process.exit(0);
  }
}

configureSkyTechAPI();