import crypto from "crypto";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_BASE_URL = "https://api.paystack.co";

export function isPaystackTestMode(): boolean {
  return PAYSTACK_SECRET_KEY.startsWith("sk_test_");
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
  };
}

export async function initializePayment(params: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}): Promise<PaystackInitializeResponse> {
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
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to verify payment");
  }

  return data as PaystackVerifyResponse;
}

export function validateWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
  if (!PAYSTACK_SECRET_KEY || !signature) {
    return false;
  }

  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  return hash === signature;
}

export function isPaystackConfigured(): boolean {
  return !!PAYSTACK_SECRET_KEY;
}
