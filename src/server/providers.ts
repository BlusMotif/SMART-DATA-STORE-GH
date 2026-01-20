import { storage } from "./storage.js";

// Minimal generic provider caller - extend per provider as needed
export async function fulfillDataBundleTransaction(transaction: any, providerId?: string) {
  try {
    const network = transaction.network;
    if (!network) {
      return { success: false, error: "No network set on transaction" };
    }

    // Get external API provider (use specified provider or default)
    let provider;
    if (providerId) {
      provider = await storage.getExternalApiProvider(providerId);
    } else {
      provider = await storage.getDefaultExternalApiProvider();
    }

    if (!provider || !provider.isActive) {
      return { success: false, error: "No active external API provider configured" };
    }

    const apiKey = provider.apiKey;
    const apiSecret = provider.apiSecret;
    const apiEndpoint = provider.endpoint;

    // Parse network mappings
    let networkMappings = {};
    try {
      networkMappings = provider.networkMappings ? JSON.parse(provider.networkMappings) : {};
    } catch (e) {
      console.warn("Failed to parse network mappings, using defaults");
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

      // Map network to API format using provider's network mappings
      const apiNetwork = (networkMappings as Record<string, string>)[network] || network.toUpperCase();

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

        const data = await resp.json().catch(() => ({ status: resp.ok ? 'success' : 'failed' })) as any;
        
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

// Function to get balance from external API
export async function getExternalBalance(providerId?: string) {
  try {
    // Get external API provider (use specified provider or default)
    let provider;
    if (providerId) {
      provider = await storage.getExternalApiProvider(providerId);
    } else {
      provider = await storage.getDefaultExternalApiProvider();
    }

    if (!provider || !provider.isActive) {
      return { success: false, error: "No active external API provider configured" };
    }

    const apiKey = provider.apiKey;
    const apiSecret = provider.apiSecret;
    const baseUrl = provider.endpoint.replace('/orders', ''); // Remove /orders to get base URL

    const ts = Math.floor(Date.now() / 1000).toString();
    const method = 'GET';
    const path = '/api/v1/balance';
    const body = '';
    const message = `${ts}\n${method}\n${path}\n${body}`;
    
    const crypto = await import('crypto');
    const signature = crypto.createHmac('sha256', apiSecret)
      .update(message)
      .digest('hex');

    const resp = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Timestamp": ts,
        "X-Signature": signature,
      },
    });

    const data = await resp.json().catch(() => ({ error: 'Invalid JSON response' })) as any;
    
    if (resp.ok) {
      return { success: true, balance: data.balance, celebrate: data.celebrate };
    } else {
      return { success: false, error: data.error || 'Failed to fetch balance' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Function to get prices from external API
export async function getExternalPrices(network?: string, minCapacity?: number, maxCapacity?: number, effective?: boolean, providerId?: string) {
  try {
    // Get external API provider (use specified provider or default)
    let provider;
    if (providerId) {
      provider = await storage.getExternalApiProvider(providerId);
    } else {
      provider = await storage.getDefaultExternalApiProvider();
    }

    if (!provider || !provider.isActive) {
      return { success: false, error: "No active external API provider configured" };
    }

    const apiKey = provider.apiKey;
    const apiSecret = provider.apiSecret;
    const baseUrl = provider.endpoint.replace('/orders', ''); // Remove /orders to get base URL

    const ts = Math.floor(Date.now() / 1000).toString();
    const method = 'GET';
    const path = '/api/v1/prices';
    let query = '';
    const params = new URLSearchParams();
    if (network) params.append('network', network);
    if (minCapacity !== undefined) params.append('min_capacity', minCapacity.toString());
    if (maxCapacity !== undefined) params.append('max_capacity', maxCapacity.toString());
    if (effective !== undefined) params.append('effective', effective ? '1' : '0');
    if (params.toString()) query = `?${params.toString()}`;
    
    const body = '';
    const message = `${ts}\n${method}\n${path}\n${body}`;
    
    const crypto = await import('crypto');
    const signature = crypto.createHmac('sha256', apiSecret)
      .update(message)
      .digest('hex');

    const resp = await fetch(`${baseUrl}${path}${query}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Timestamp": ts,
        "X-Signature": signature,
      },
    });

    const data = await resp.json().catch(() => ({ error: 'Invalid JSON response' })) as any;
    
    if (resp.ok) {
      return { success: true, data: data.data, effective: data.effective };
    } else {
      return { success: false, error: data.error || 'Failed to fetch prices' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Function to get order status from external API
export async function getExternalOrderStatus(ref: string, providerId?: string) {
  try {
    // Get external API provider (use specified provider or default)
    let provider;
    if (providerId) {
      provider = await storage.getExternalApiProvider(providerId);
    } else {
      provider = await storage.getDefaultExternalApiProvider();
    }

    if (!provider || !provider.isActive) {
      return { success: false, error: "No active external API provider configured" };
    }

    const apiKey = provider.apiKey;
    const apiSecret = provider.apiSecret;
    const baseUrl = provider.endpoint.replace('/orders', ''); // Remove /orders to get base URL

    const ts = Math.floor(Date.now() / 1000).toString();
    const method = 'GET';
    const path = `/api/v1/orders/${ref}`;
    const body = '';
    const message = `${ts}\n${method}\n${path}\n${body}`;
    
    const crypto = await import('crypto');
    const signature = crypto.createHmac('sha256', apiSecret)
      .update(message)
      .digest('hex');

    const resp = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Timestamp": ts,
        "X-Signature": signature,
      },
    });

    const data = await resp.json().catch(() => ({ error: 'Invalid JSON response' })) as any;
    
    if (resp.ok) {
      return { success: true, order: data };
    } else {
      return { success: false, error: data.error || 'Failed to fetch order status' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
