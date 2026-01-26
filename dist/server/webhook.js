/**
 * Send webhook notification to external system
 * Implements retry logic with exponential backoff
 */
export async function sendWebhook(webhookUrl, payload, retries = 3) {
    const maxRetries = retries;
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Webhook] Attempting to send webhook (${attempt}/${maxRetries}) to ${webhookUrl}`);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Resellers-Hub-Webhook/1.0',
                    'X-Webhook-Signature': generateSignature(payload), // Optional: for security
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            // Success if status code is 2xx
            if (response.ok) {
                console.log(`[Webhook] Successfully sent webhook to ${webhookUrl}`);
                return {
                    success: true,
                    statusCode: response.status,
                    attempt,
                };
            }
            // Non-2xx status code
            const errorText = await response.text().catch(() => 'No response body');
            console.warn(`[Webhook] Webhook failed with status ${response.status}: ${errorText}`);
            lastError = new Error(`HTTP ${response.status}: ${errorText}`);
        }
        catch (error) {
            lastError = error;
            console.error(`[Webhook] Error sending webhook (attempt ${attempt}/${maxRetries}):`, error.message);
            // Don't retry on abort (timeout)
            if (error.name === 'AbortError') {
                console.error('[Webhook] Request timed out after 10 seconds');
                break;
            }
        }
        // Wait before retry with exponential backoff (1s, 2s, 4s)
        if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`[Webhook] Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    // All retries failed
    console.error(`[Webhook] Failed to send webhook after ${maxRetries} attempts:`, lastError?.message);
    return {
        success: false,
        error: lastError?.message || 'Unknown error',
        attempts: maxRetries,
    };
}
/**
 * Generate a simple signature for webhook verification
 * In production, use HMAC with a shared secret
 */
function generateSignature(payload) {
    // Simple signature for now - in production, use HMAC-SHA256 with shared secret
    const data = JSON.stringify(payload);
    return Buffer.from(data).toString('base64').substring(0, 32);
}
/**
 * Build webhook payload from transaction data
 */
export function buildWebhookPayload(transaction, event, previousStatus) {
    // Parse phone numbers for products array
    let products = [];
    try {
        if (transaction.phoneNumbers) {
            const phoneData = JSON.parse(transaction.phoneNumbers);
            if (Array.isArray(phoneData)) {
                products = phoneData.map((item) => ({
                    bundleId: item.bundleId || transaction.productId || '',
                    bundleName: item.bundleName || transaction.productName,
                    phone: item.phone || transaction.customerPhone || '',
                    network: transaction.network || '',
                }));
            }
        }
        else if (transaction.customerPhone) {
            // Single order
            products = [{
                    bundleId: transaction.productId || '',
                    bundleName: transaction.productName,
                    phone: transaction.customerPhone,
                    network: transaction.network || '',
                }];
        }
    }
    catch (e) {
        console.error('[Webhook] Error parsing phone numbers:', e);
        // Fallback to basic product info
        products = [{
                bundleId: transaction.productId || '',
                bundleName: transaction.productName,
                phone: transaction.customerPhone || '',
                network: transaction.network || '',
            }];
    }
    return {
        event,
        reference: transaction.reference,
        status: transaction.status,
        deliveryStatus: transaction.deliveryStatus,
        timestamp: new Date().toISOString(),
        order: {
            id: transaction.id,
            reference: transaction.reference,
            amount: parseFloat(transaction.amount),
            customerEmail: transaction.customerEmail || undefined,
            isBulkOrder: transaction.isBulkOrder || false,
            createdAt: transaction.createdAt.toISOString(),
            completedAt: transaction.completedAt?.toISOString(),
            ...(previousStatus ? { previousStatus } : {}),
            currentStatus: transaction.status,
        },
        products,
    };
}
