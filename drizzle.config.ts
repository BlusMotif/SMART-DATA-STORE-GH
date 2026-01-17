import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

console.log("DATABASE_URL from drizzle config:", process.env.DATABASE_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);

const isProduction = process.env.NODE_ENV === 'production';

const config = defineConfig({
  out: "./migrations",
  schema: "./src/shared/schema.ts",
  dialect: isProduction ? "postgresql" : "sqlite",
  dbCredentials: isProduction ? {
    url: process.env.DATABASE_URL!,
  } : {
    url: "./dev.db",
  },
});

export default config;
