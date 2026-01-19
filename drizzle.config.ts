import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: path.resolve(__dirname, ".env.development"), override: true });
}

console.log("DATABASE_URL from drizzle config:", process.env.DATABASE_URL);
console.log("NODE_ENV:", process.env.NODE_ENV);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const isSQLite = process.env.DATABASE_URL.startsWith('sqlite:');

export default defineConfig({
  out: "./migrations",
  schema: "./src/shared/schema.ts",
  dialect: isSQLite ? "sqlite" : "postgresql",
  dbCredentials: isSQLite ? { url: process.env.DATABASE_URL.replace('sqlite:', '') } : { url: process.env.DATABASE_URL },
});
