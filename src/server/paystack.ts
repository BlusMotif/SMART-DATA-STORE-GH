import crypto from "crypto";
import { storage } from "./storage.js";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

// Cache for Paystack key to reduce database calls
let cachedPaystackKey: string | null = null;
let keyLastFetched = 0;
const KEY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Environment detection
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

async function getPaystackKey(): Promise<string> {
  // Check cache first
  const now = Date.now();
  if (cachedPaystackKey && (now - keyLastFetched) < KEY_CACHE_TTL) {
    return cachedPaystackKey;
  }
  
  // Priority: Database settings FIRST, then environment variable
  // This allows admin to override via settings without redeploying
  const stored = await storage.getSetting("paystack.secret_key");
  if (stored) {
    const isLive = stored.startsWith("sk_live_");
    console.log(`[Paystack] Using key from database settings: ${isLive ? "LIVE MODE" : "TEST MODE"} (env: ${process.env.NODE_ENV || 'development'})`);
    
    // Warn if using test key in production
    if (isProduction && !isLive) {
      console.warn("[Paystack] ⚠️ WARNING: Using TEST key in PRODUCTION environment!");
    }
    
    cachedPaystackKey = stored;
    keyLastFetched = now;
    return stored;
  }
  
  // Fallback to environment variable
  const env = process.env.PAYSTACK_SECRET_KEY || "";
  if (env) {
    const isLive = env.startsWith("sk_live_");
    console.log(`[Paystack] Using key from environment: ${isLive ? "LIVE MODE" : "TEST MODE"} (env: ${process.env.NODE_ENV || 'development'})`);
    
    // Warn if using test key in production
    if (isProduction && !isLive) {
      console.warn("[Paystack] ⚠️ WARNING: Using TEST key in PRODUCTION environment!");
    }
    
    // Warn if using live key in development
    if (isDevelopment && isLive) {
      console.warn("[Paystack] ⚠️ WARNING: Using LIVE key in DEVELOPMENT environment! Consider using test key for safety.");
    }
    
    cachedPaystackKey = env;
    keyLastFetched = now;
    return env;
  }
  
  console.warn("[Paystack] No Paystack secret key configured!");
  return "";
}

// Function to clear the key cache (useful after admin updates the key)
export function clearPaystackKeyCache(): void {
  cachedPaystackKey = null;
  keyLastFetched = 0;
  console.log("[Paystack] Key cache cleared");
}

export async function isPaystackTestMode(): Promise<boolean> {
  const key = await getPaystackKey();
  return key.startsWith("sk_test_");
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: "success" | "failed" | "abandoned" | "pending";
    reference: string;
    amount: number;
    gateway_response: string;
    paid_at: string | null;
    created_at: string;
    channel: string;
    currency: string;
    customer: {
      email: string;
      phone: string | null;
    };
    metadata?: Record<string, any>;
  };
}

export async function initializePayment(params: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}): Promise<PaystackInitializeResponse> {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }
  
  console.log("[Paystack] Initializing payment:", {
    email: params.email,
    amount: params.amount,
    reference: params.reference,
    callbackUrl: params.callbackUrl,
    mode: PAYSTACK_SECRET_KEY.startsWith("sk_live_") ? "LIVE" : "TEST",
    keyPrefix: PAYSTACK_SECRET_KEY.substring(0, 15) + "..."
  });
  
  // Validate inputs
  if (!params.email || typeof params.email !== 'string' || !params.email.includes('@')) {
    throw new Error("Invalid email address");
  }
  
  if (!params.amount || typeof params.amount !== 'number' || params.amount <= 0) {
    throw new Error("Invalid amount");
  }
  
  if (!params.reference || typeof params.reference !== 'string' || params.reference.length < 5) {
    throw new Error("Invalid reference");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amount), // Amount already in pesewas from caller
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  const data = await response.json() as any;

  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to initialize payment");
  }

  return data as PaystackInitializeResponse;
}

export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }

  console.log("[Paystack] Verifying payment:", {
    reference,
    mode: PAYSTACK_SECRET_KEY.startsWith("sk_live_") ? "LIVE" : "TEST",
    keyPrefix: PAYSTACK_SECRET_KEY.substring(0, 15) + "..."
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json() as any;

    console.log("[Paystack] Verify response:", {
      status: response.status,
      ok: response.ok,
      paymentStatus: data?.data?.status,
      gatewayResponse: data?.data?.gateway_response
    });

    if (!response.ok) {
      throw new Error(data.message || "Failed to verify payment");
    }

    return data as PaystackVerifyResponse;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("[Paystack] Verify error:", error.message);
    if (error.name === 'AbortError') {
      throw new Error('Payment verification timed out. Please try again.');
    }
    throw error;
  }
}

export async function validateWebhookSignature(rawBody: string | Buffer, signature: string): Promise<boolean> {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  
  console.log("[Webhook Validation] Key present:", !!PAYSTACK_SECRET_KEY);
  console.log("[Webhook Validation] Key mode:", PAYSTACK_SECRET_KEY?.startsWith("sk_live_") ? "LIVE" : "TEST");
  console.log("[Webhook Validation] Signature present:", !!signature);
  console.log("[Webhook Validation] Signature length:", signature?.length || 0);
  
  if (!PAYSTACK_SECRET_KEY || !signature) {
    console.error("[Webhook Validation] Missing key or signature");
    return false;
  }

  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  const isValid = hash === signature;
  
  console.log("[Webhook Validation] Computed hash (first 20 chars):", hash.substring(0, 20) + "...");
  console.log("[Webhook Validation] Received signature (first 20 chars):", signature.substring(0, 20) + "...");
  console.log("[Webhook Validation] Signature match:", isValid);
  
  if (!isValid) {
    console.error("[Webhook Validation] ⚠️ SIGNATURE MISMATCH - This often means the webhook secret key doesn't match the payment initialization key");
    console.error("[Webhook Validation] Key prefix being used:", PAYSTACK_SECRET_KEY.substring(0, 15) + "...");
  }

  return isValid;
}

export async function isPaystackConfigured(): Promise<boolean> {
  const key = await getPaystackKey();
  return !!key;
}

// Bank account verification interface
interface PaystackBankResolveResponse {
  status: boolean;
  message: string;
  data: {
    account_number: string;
    account_name: string;
    bank_id: number;
  };
}

export async function resolveBankAccount(accountNumber: string, bankCode: string): Promise<PaystackBankResolveResponse> {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }

  // Validate inputs
  if (!accountNumber || !bankCode) {
    throw new Error("Account number and bank code are required");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json() as any;

  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to resolve bank account");
  }

  return data as PaystackBankResolveResponse;
}

// Transfer API interfaces
interface PaystackTransferRecipientResponse {
  status: boolean;
  message: string;
  data: {
    active: boolean;
    createdAt: string;
    currency: string;
    domain: string;
    id: number;
    integration: number;
    name: string;
    recipient_code: string;
    type: string;
    updatedAt: string;
    is_deleted: boolean;
    details: {
      authorization_code?: string;
      account_number: string;
      account_name: string;
      bank_code: string;
      bank_name: string;
    };
  };
}

interface PaystackTransferResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    integration: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: "pending" | "success" | "failed";
    transfer_code: string;
    id: number;
    createdAt: string;
    updatedAt: string;
  };
}

interface PaystackTransferVerificationResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    integration: number;
    domain: string;
    amount: number;
    currency: string;
    source: string;
    reason: string;
    recipient: number;
    status: "pending" | "success" | "failed";
    transfer_code: string;
    id: number;
    createdAt: string;
    updatedAt: string;
    failures?: any;
  };
}

export async function createTransferRecipient(params: {
  type: "nuban" | "mobile_money";
  name: string;
  account_number: string;
  bank_code: string;
  currency?: "GHS";
}): Promise<PaystackTransferRecipientResponse> {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }

  // Validate inputs
  if (!params.name || !params.account_number || !params.bank_code) {
    throw new Error("Missing required recipient details");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: params.type,
      name: params.name,
      account_number: params.account_number,
      bank_code: params.bank_code,
      currency: params.currency || "GHS",
    }),
  });

  const data = await response.json() as any;

  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to create transfer recipient");
  }

  return data as PaystackTransferRecipientResponse;
}

export async function initiateTransfer(params: {
  source: "balance";
  amount: number;
  recipient: string; // recipient_code
  reason?: string;
  reference?: string;
}): Promise<PaystackTransferResponse> {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }

  // Validate inputs
  if (!params.amount || params.amount <= 0) {
    throw new Error("Invalid transfer amount");
  }

  if (!params.recipient) {
    throw new Error("Recipient code is required");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: params.source,
      amount: Math.round(params.amount * 100), // Convert to pesewas
      recipient: params.recipient,
      reason: params.reason || "Agent withdrawal",
      reference: params.reference,
    }),
  });

  const data = await response.json() as any;

  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to initiate transfer");
  }

  return data as PaystackTransferResponse;
}

export async function verifyTransfer(reference: string): Promise<PaystackTransferVerificationResponse> {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transfer/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json() as any;

    if (!response.ok) {
      throw new Error(data.message || "Failed to verify transfer");
    }

    return data as PaystackTransferVerificationResponse;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Transfer verification timed out. Please try again.');
    }
    throw error;
  }
}
