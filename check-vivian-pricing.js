#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    // Get vivian's user
    const { data: vivianUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "vivian@gmail.com")
      .single();

    if (userError) {
      console.error("Error fetching vivian user:", userError);
      return;
    }

    console.log("\n=== VIVIAN USER ===");
    console.log("User ID:", vivianUser.id);
    console.log("Role:", vivianUser.role);

    // Get vivian's agent record
    const { data: vivianAgent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("user_id", vivianUser.id)
      .single();

    if (agentError) {
      console.error("Error fetching vivian agent:", agentError);
      return;
    }

    console.log("\n=== VIVIAN AGENT ===");
    console.log("Agent ID:", vivianAgent.id);
    console.log("Slug:", vivianAgent.slug);

    // Get all custom pricing for vivian
    const { data: customPricing, error: pricingError } = await supabase
      .from("custom_pricing")
      .select("*")
      .eq("role_owner_id", vivianAgent.id)
      .eq("role", "agent");

    if (pricingError) {
      console.error("Error fetching custom pricing:", pricingError);
      return;
    }

    console.log("\n=== VIVIAN'S CUSTOM PRICING ===");
    console.log(`Total custom prices set: ${customPricing.length}`);
    
    for (const pricing of customPricing) {
      // Get bundle name
      const { data: bundle } = await supabase
        .from("data_bundles")
        .select("name, base_price, agent_price")
        .eq("id", pricing.product_id)
        .single();

      console.log(`\nBundle: ${bundle?.name || pricing.product_id}`);
      console.log(`  Selling Price (Your Price): GHS ${pricing.selling_price}`);
      console.log(`  Stored Profit: GHS ${pricing.profit || "NOT SET"}`);
      console.log(`  Admin Base Price: GHS ${bundle?.base_price || "?"}`);
      console.log(`  Product Agent Price: GHS ${bundle?.agent_price || "?"}`);
    }

    // Also check role base prices for agent role
    const { data: roleBasePrices, error: roleError } = await supabase
      .from("role_base_prices")
      .select("*")
      .eq("role", "agent")
      .limit(3);

    if (!roleError && roleBasePrices.length > 0) {
      console.log("\n=== AGENT ROLE BASE PRICES (first 3) ===");
      for (const rbp of roleBasePrices) {
        const { data: bundle } = await supabase
          .from("data_bundles")
          .select("name")
          .eq("id", rbp.product_id)
          .single();
        console.log(`${bundle?.name || rbp.product_id}: GHS ${rbp.base_price}`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
