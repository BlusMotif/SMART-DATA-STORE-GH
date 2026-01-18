import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

console.log("DATABASE_URL from drizzle config:", process.env.DATABASE_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);

// Use SQLite for local development, PostgreSQL for production
const isProduction = process.env.NODE_ENV === "production";
const dialect = isProduction ? "postgresql" : "sqlite";
const dbCredentials = isProduction 
  ? { url: process.env.DATABASE_URL }
  : { url: path.resolve(__dirname, "dev.db") };

if (isProduction && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for production");
}

export default defineConfig({
  out: "./migrations",
  schema: "./src/shared/schema.ts",
  dialect: dialect as "postgresql" | "sqlite",
  dbCredentials,
});
