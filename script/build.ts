import { build as esbuild } from "esbuild";
import { rm, readFile } from "fs/promises";
import { execSync } from "child_process";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  // Ensure frontend dependencies are installed inside /client, then run Vite build from that cwd.
  // Use execSync so commands are run synchronously and inherit stdio for CI logs.
  try {
    console.log("installing client dependencies (client)...");
    execSync("npm install --no-audit --no-fund", { cwd: "client", stdio: "inherit" });

    console.log("running vite build (client)...");
    // Prefer using the project's npm build script, which runs `vite build`.
    execSync("npm run build", { cwd: "client", stdio: "inherit" });
  } catch (err) {
    console.error("Client build failed:", err);
    throw err;
  }

  console.log("building server...");
  // Compile server with tsc
  execSync("npx tsc --project . --outDir dist", { stdio: "inherit" });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
