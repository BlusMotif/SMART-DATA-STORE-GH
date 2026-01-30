#!/usr/bin/env node
import * as dotenv from "dotenv";
dotenv.config();

const API_URL = "http://localhost:10000";

// Get a Supabase session token for vivian
async function getVivianToken() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    // Use the test user credentials if available
    const email = "vivian@gmail.com";
    const password = "Test@12345"; // Standard password for test accounts

    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      console.log("✓ Got Vivian's token");
      return data.access_token;
    } else {
      console.log("✗ Failed to get token:", data);
      return null;
    }
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
}

// Test checkout with authenticated agent
async function testCheckout(token) {
  try {
    const payload = {
      productType: "data_bundle",
      productId: "9706a8cb-c33c-445b-9569-83d07799b7ca", // MTN 1GB
      customerPhone: "0999888777",
      customerEmail: "vivian@gmail.com",
      isBulkOrder: false,
    };

    console.log("\n=== TESTING CHECKOUT ===");
    console.log("Payload:", payload);
    console.log("Authorization: Bearer [token]");

    const response = await fetch(`${API_URL}/api/checkout/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("\n=== CHECKOUT RESPONSE ===");
    console.log("Amount:", result.transaction?.amount);
    console.log("Product Name:", result.transaction?.productName);

    if (result.transaction?.amount === "9.00") {
      console.log("\n✓✓✓ SUCCESS! Checkout shows correct custom price: GHS 9.00");
    } else {
      console.log("\n✗✗✗ FAILED! Checkout shows wrong amount:", result.transaction?.amount);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function main() {
  console.log("Getting authentication token for vivian@gmail.com...");
  const token = await getVivianToken();

  if (!token) {
    console.log("Could not get token. Using direct API test instead...");
    // Test without authentication
    const payload = {
      productType: "data_bundle",
      productId: "9706a8cb-c33c-445b-9569-83d07799b7ca",
      customerPhone: "0999888777",
      customerEmail: "vivian@gmail.com",
      isBulkOrder: false,
    };

    const response = await fetch(`${API_URL}/api/checkout/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    console.log("Response:", result);
    return;
  }

  await testCheckout(token);
}

main();
