import crypto from "crypto";
import { storage } from "./storage.js";
const PAYSTACK_BASE_URL = "https://api.paystack.co";
async function getPaystackKey() {
    const env = process.env.PAYSTACK_SECRET_KEY || "";
    if (env)
        return env;
    const stored = await storage.getSetting("paystack.secret_key");
    return stored || "";
}
export async function isPaystackTestMode() {
    const key = await getPaystackKey();
    return key.startsWith("sk_test_");
}
export async function initializePayment(params) {
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
    return data;
}
export async function verifyPayment(reference) {
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
        return data;
    }
    catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Payment verification timed out. Please try again.');
        }
        throw error;
    }
}
export async function validateWebhookSignature(rawBody, signature) {
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
export async function isPaystackConfigured() {
    const key = await getPaystackKey();
    return !!key;
}
export async function resolveBankAccount(accountNumber, bankCode) {
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
    const data = await response.json();
    if (!response.ok || !data.status) {
        throw new Error(data.message || "Failed to resolve bank account");
    }
    return data;
}
export async function createTransferRecipient(params) {
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
    return data;
}
export async function initiateTransfer(params) {
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
    return data;
}
export async function verifyTransfer(reference) {
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
        return data;
    }
    catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Transfer verification timed out. Please try again.');
        }
        throw error;
    }
}
