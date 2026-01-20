import { storage } from "./storage.js";

// Minimal generic provider caller - extend per provider as needed
export async function fulfillDataBundleTransaction(transaction: any) {
  try {
    const network = transaction.network;
    if (!network) {
      return { success: false, error: "No network set on transaction" };
    }

    // Get external API settings
    const apiKey = await storage.getSetting("external_api.key") || "5df3120e44b3cc29b8c61f63";
    const apiSecret = await storage.getSetting("external_api.secret");
    const apiEndpoint = await storage.getSetting("external_api.endpoint") || "https://skytechgh.com/api/v1/orders";

    if (!apiSecret) {
      return { success: false, error: "External API secret not configured" };
    }

    // Compose recipients
    const phoneData = transaction.phoneNumbers && Array.isArray(transaction.phoneNumbers)
      ? transaction.phoneNumbers
      : [{ phone: transaction.customerPhone, dataAmount: transaction.productName?.match(/(\d+(?:\.\d+)?)\s*(?:GB|MB)/i)?.[1] || '1' }];

    const results: any[] = [];

    for (const item of phoneData) {
      const phone = item.phone;
      const dataAmount = item.dataAmount || item.bundleName?.match(/(\d+(?:\.\d+)?)\s*(?:GB|MB)/i)?.[1] || '1';

      // Convert data amount to MB for capacity
      let capacity = 0;
      if (dataAmount.toLowerCase().includes('gb')) {
        capacity = parseFloat(dataAmount) * 1024; // GB to MB
      } else {
        capacity = parseFloat(dataAmount); // Already MB
      }

      // Map network to API format
      const networkMap: Record<string, string> = {
        'mtn': 'MTN',
        'telecel': 'TELECEL',
        'at_bigtime': 'AIRTELTIGO',
        'at_ishare': 'AIRTELTIGO',
        'airteltigo': 'AIRTELTIGO'
      };
      const apiNetwork = networkMap[network] || network.toUpperCase();

      const body = JSON.stringify({
        network: apiNetwork,
        recipient: phone,
        capacity: Math.round(capacity)
      });

      // Generate signature
      const ts = Math.floor(Date.now() / 1000).toString();
      const method = 'POST';
      const path = '/api/v1/orders';
      const message = `${ts}\n${method}\n${path}\n${body}`;
      
      const crypto = await import('crypto');
      const signature = crypto.createHmac('sha256', apiSecret)
        .update(message)
        .digest('hex');

      try {
        const resp = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "X-Timestamp": ts,
            "X-Signature": signature,
          },
          body: body,
        });

        const data = await resp.json().catch(() => ({ status: resp.ok ? 'success' : 'failed' }));
        
        if (resp.ok && data.ref) {
          results.push({ 
            phone, 
            status: "delivered", 
            ref: data.ref, 
            price: data.price,
            providerResponse: data 
          });
        } else {
          results.push({ 
            phone, 
            status: "failed", 
            providerResponse: data 
          });
        }
      } catch (e: any) {
        results.push({ phone, status: "failed", error: e.message });
      }
    }

    return { success: true, provider: "skytechgh", results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
