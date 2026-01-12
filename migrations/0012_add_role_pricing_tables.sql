-- Add role-specific pricing tables and role base prices
-- Migration: 0012_add_role_pricing_tables.sql

-- Create dealer pricing table
CREATE TABLE "dealer_pricing" (
  "id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "dealer_id" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "bundle_id" varchar(36) NOT NULL REFERENCES "data_bundles"("id") ON DELETE CASCADE,
  "dealer_price" numeric(10, 2) NOT NULL,
  "admin_base_price" numeric(10, 2) NOT NULL,
  "dealer_profit" numeric(10, 2) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create super dealer pricing table
CREATE TABLE "super_dealer_pricing" (
  "id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "super_dealer_id" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "bundle_id" varchar(36) NOT NULL REFERENCES "data_bundles"("id") ON DELETE CASCADE,
  "super_dealer_price" numeric(10, 2) NOT NULL,
  "admin_base_price" numeric(10, 2) NOT NULL,
  "super_dealer_profit" numeric(10, 2) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create master pricing table
CREATE TABLE "master_pricing" (
  "id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "master_id" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "bundle_id" varchar(36) NOT NULL REFERENCES "data_bundles"("id") ON DELETE CASCADE,
  "master_price" numeric(10, 2) NOT NULL,
  "admin_base_price" numeric(10, 2) NOT NULL,
  "master_profit" numeric(10, 2) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create role base prices table
CREATE TABLE "role_base_prices" (
  "id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "bundle_id" varchar(36) NOT NULL REFERENCES "data_bundles"("id") ON DELETE CASCADE,
  "role" text NOT NULL,
  "base_price" numeric(10, 2) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX "dealer_pricing_dealer_idx" ON "dealer_pricing"("dealer_id");
CREATE INDEX "dealer_pricing_bundle_idx" ON "dealer_pricing"("bundle_id");
CREATE UNIQUE INDEX "dealer_pricing_unique" ON "dealer_pricing"("dealer_id", "bundle_id");

CREATE INDEX "super_dealer_pricing_super_dealer_idx" ON "super_dealer_pricing"("super_dealer_id");
CREATE INDEX "super_dealer_pricing_bundle_idx" ON "super_dealer_pricing"("bundle_id");
CREATE UNIQUE INDEX "super_dealer_pricing_unique" ON "super_dealer_pricing"("super_dealer_id", "bundle_id");

CREATE INDEX "master_pricing_master_idx" ON "master_pricing"("master_id");
CREATE INDEX "master_pricing_bundle_idx" ON "master_pricing"("bundle_id");
CREATE UNIQUE INDEX "master_pricing_unique" ON "master_pricing"("master_id", "bundle_id");

CREATE INDEX "role_base_prices_bundle_idx" ON "role_base_prices"("bundle_id");
CREATE INDEX "role_base_prices_role_idx" ON "role_base_prices"("role");
CREATE UNIQUE INDEX "role_base_prices_unique" ON "role_base_prices"("bundle_id", "role");

-- Initialize role base prices with existing bundle base prices as admin base prices
INSERT INTO "role_base_prices" ("bundle_id", "role", "base_price")
SELECT "id", 'admin', "base_price" FROM "data_bundles" WHERE "is_active" = true;

-- For backward compatibility, set agent base prices to current agent prices from data_bundles
INSERT INTO "role_base_prices" ("bundle_id", "role", "base_price")
SELECT "id", 'agent', COALESCE("agent_price", "base_price") FROM "data_bundles" WHERE "is_active" = true;

-- Set dealer base prices (can be adjusted by admin later)
INSERT INTO "role_base_prices" ("bundle_id", "role", "base_price")
SELECT "id", 'dealer', COALESCE("dealer_price", "base_price") FROM "data_bundles" WHERE "is_active" = true;

-- Set super dealer base prices
INSERT INTO "role_base_prices" ("bundle_id", "role", "base_price")
SELECT "id", 'super_dealer', COALESCE("super_dealer_price", "base_price") FROM "data_bundles" WHERE "is_active" = true;

-- Set master base prices
INSERT INTO "role_base_prices" ("bundle_id", "role", "base_price")
SELECT "id", 'master', COALESCE("master_price", "base_price") FROM "data_bundles" WHERE "is_active" = true;