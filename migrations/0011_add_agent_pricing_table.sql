-- Create new agent pricing table with explicit pricing fields
CREATE TABLE "agent_pricing" (
  "id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "agent_id" varchar(36) NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
  "bundle_id" varchar(36) NOT NULL REFERENCES "data_bundles"("id") ON DELETE CASCADE,
  "agent_price" numeric(10, 2) NOT NULL,
  "admin_base_price" numeric(10, 2) NOT NULL,
  "agent_profit" numeric(10, 2) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX "agent_pricing_agent_idx" ON "agent_pricing"("agent_id");
CREATE INDEX "agent_pricing_bundle_idx" ON "agent_pricing"("bundle_id");
CREATE UNIQUE INDEX "agent_pricing_unique" ON "agent_pricing"("agent_id", "bundle_id");

-- Migrate existing data from agent_custom_pricing to agent_pricing
-- For each existing custom price, we need to calculate admin_base_price and agent_profit
-- Since we don't have the admin base price in the old table, we'll use the bundle's basePrice as admin_base_price
INSERT INTO "agent_pricing" ("agent_id", "bundle_id", "agent_price", "admin_base_price", "agent_profit")
SELECT
  acp."agent_id",
  acp."bundle_id",
  acp."custom_price"::numeric,
  db."base_price"::numeric,
  (acp."custom_price"::numeric - db."base_price"::numeric)
FROM "agent_custom_pricing" acp
JOIN "data_bundles" db ON db."id" = acp."bundle_id"
WHERE acp."custom_price"::numeric >= db."base_price"::numeric;

-- Drop the old table
DROP TABLE "agent_custom_pricing";