import crypto from "crypto";
import { storage } from "./storage";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

async function getPaystackKey(): Promise<string> {
  const env = process.env.PAYSTACK_SECRET_KEY || "";
  if (env) return env;
  const stored = await storage.getSetting("paystack.secret_key");
  return stored || "";
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

  const data = await response.json();

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to verify payment");
    }

    return data as PaystackVerifyResponse;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Payment verification timed out. Please try again.');
    }
    throw error;
  }
}

export async function validateWebhookSignature(rawBody: string | Buffer, signature: string): Promise<boolean> {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  if (!PAYSTACK_SECRET_KEY || !signature) {
    return false;
  }

  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  return hash === signature;
}

export async function isPaystackConfigured(): Promise<boolean> {
  const key = await getPaystackKey();
  return !!key;
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

  const data = await response.json();

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

  const data = await response.json();

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

    const data = await response.json();

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
