import { storage } from "./storage.js";

// Minimal generic provider caller - extend per provider as needed
export async function fulfillDataBundleTransaction(transaction: any, providerId?: string) {
  console.log(`[Fulfill] STARTING fulfillment for transaction ${transaction.reference}, type: ${transaction.type}, isBulk: ${transaction.isBulkOrder}`);
  
  try {
    const network = transaction.network;
    if (!network) {
      return { success: false, error: "No network set on transaction" };
    }

    // Get external API provider (use specified provider or default)
    let provider;
    if (providerId) {
      provider = await storage.getExternalApiProvider(providerId);
      console.log(`[Fulfill] Using specified provider ${providerId}:`, provider ? 'FOUND' : 'NOT FOUND');
    } else {
      provider = await storage.getDefaultExternalApiProvider();
      console.log(`[Fulfill] Using default provider:`, provider ? 'FOUND' : 'NOT FOUND');
    }

    if (!provider) {
      console.error(`[Fulfill] No external API provider configured`);
      return { success: false, error: "No external API provider configured" };
    }

    if (!provider.isActive) {
      console.error(`[Fulfill] External API provider is not active`);
      return { success: false, error: "External API provider is not active" };
    }

    console.log(`[Fulfill] Provider details:`, {
      name: provider.name,
      endpoint: provider.endpoint,
      hasApiKey: !!provider.apiKey,
      hasApiSecret: !!provider.apiSecret
    });

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
    let phoneData: any[] = [];
    
    if (transaction.phoneNumbers) {
      if (Array.isArray(transaction.phoneNumbers)) {
        phoneData = transaction.phoneNumbers;
        console.log("[Fulfill] phoneNumbers is already an array");
      } else if (typeof transaction.phoneNumbers === 'string') {
        console.log("[Fulfill] phoneNumbers is a string, attempting to parse");
        try {
          phoneData = JSON.parse(transaction.phoneNumbers);
          console.log("[Fulfill] Successfully parsed phoneNumbers string");
        } catch (e) {
          const error = e as Error;
          console.warn("Failed to parse phoneNumbers JSON string:", error.message);
          console.warn("Raw phoneNumbers string:", transaction.phoneNumbers);
          phoneData = [{ phone: transaction.customerPhone, dataAmount: transaction.productName?.match(/(\d+(?:\.\d+)?)\s*(?:GB|MB)/i)?.[1] || '1' }];
        }
      } else {
        console.log("[Fulfill] phoneNumbers is neither array nor string:", typeof transaction.phoneNumbers);
        phoneData = [{ phone: transaction.customerPhone, dataAmount: transaction.productName?.match(/(\d+(?:\.\d+)?)\s*(?:GB|MB)/i)?.[1] || '1' }];
      }
    } else {
      console.log("[Fulfill] No phoneNumbers found in transaction");
      phoneData = [{ phone: transaction.customerPhone, dataAmount: transaction.productName?.match(/(\d+(?:\.\d+)?)\s*(?:GB|MB)/i)?.[1] || '1' }];
    }

    console.log("[Fulfill] transaction.phoneNumbers:", transaction.phoneNumbers);
    console.log("[Fulfill] phoneData length:", phoneData.length);
    console.log("[Fulfill] phoneData:", phoneData);

    if (phoneData.length === 0) {
      console.log("[Fulfill] phoneData is empty, using fallback for single order");
      phoneData = [{ phone: transaction.customerPhone, dataAmount: transaction.productName?.match(/(\d+(?:\.\d+)?)\s*(?:GB|MB)/i)?.[1] || '1' }];
      console.log("[Fulfill] Fallback phoneData:", phoneData);
    }

    console.log(`[Fulfill] Starting to process ${phoneData.length} items`);

    const results: any[] = [];

    for (let i = 0; i < phoneData.length; i++) {
      const item = phoneData[i];
      console.log(`[Fulfill] Processing item ${i + 1}/${phoneData.length}:`, item);
      const phone = item.phone;
      const dataAmount = item.dataAmount || item.bundleName?.match(/(\d+(?:\.\d+)?)\s*(?:GB|MB)/i)?.[1] || '1';

      console.log(`[Fulfill] Item dataAmount: ${dataAmount}, bundleName: ${item.bundleName}`);

      // Convert data amount to capacity for API (in GB)
      const numAmount = parseFloat(dataAmount);
      const capacity = numAmount;

      console.log(`[Fulfill] Calculated capacity: ${capacity} GB`);

      // Map network to API format using provider's network mappings
      const apiNetwork = (networkMappings as Record<string, string>)[network] || network.toUpperCase();

      const body = JSON.stringify({
        network: apiNetwork,
        recipient: phone,
        capacity: Math.round(capacity)
      });

      console.log(`[Fulfill] API request body:`, body);

      // Generate signature
      const ts = Math.floor(Date.now() / 1000).toString();
      const method = 'POST';
      const path = '/api/v1/orders';
      const message = `${ts}\n${method}\n${path}\n${body}`;
      
      const crypto = await import('crypto');
      const signature = crypto.createHmac('sha256', apiSecret)
        .update(message)
        .digest('hex');

      console.log(`[Fulfill] Making API call for phone: ${phone}`);

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

        console.log(`[Fulfill] API response status for ${phone}: ${resp.status}`);

        const data = await resp.json().catch(() => ({ status: resp.ok ? 'success' : 'failed' })) as any;
        
        console.log(`[Fulfill] API response data for ${phone}:`, data);

        if (resp.ok && data.ref) {
          results.push({ 
            phone, 
            status: "pending", 
            ref: data.ref, 
            price: data.price,
            providerResponse: data 
          });
          console.log(`[Fulfill] Success for ${phone}: ${data.ref}`);
        } else {
          results.push({ 
            phone, 
            status: "failed", 
            providerResponse: data 
          });
          console.log(`[Fulfill] Failed for ${phone}:`, data);
        }
      } catch (e: any) {
        console.error(`[Fulfill] Exception for ${phone}:`, e.message);
        results.push({ phone, status: "failed", error: e.message });
      }
    }

    console.log("[Fulfill] Final results length:", results.length);
    console.log("[Fulfill] Final results:", results);

    return { success: true, provider: "skytechgh", results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Function to get balance from external API
export async function getExternalBalance(providerId?: string) {
  try {
    console.log("[getExternalBalance] Called with providerId:", providerId);

    // Get external API provider (use specified provider or default)
    let provider;
    if (providerId) {
      console.log("[getExternalBalance] Looking up provider by ID:", providerId);
      provider = await storage.getExternalApiProvider(providerId);
      console.log("[getExternalBalance] Found provider:", provider ? "YES" : "NO");
    } else {
      console.log("[getExternalBalance] Looking up default provider");
      provider = await storage.getDefaultExternalApiProvider();
      console.log("[getExternalBalance] Found default provider:", provider ? "YES" : "NO");
    }

    if (!provider) {
      console.log("[getExternalBalance] No provider found");
      return { success: false, error: "No external API provider configured" };
    }

    if (!provider.isActive) {
      console.log("[getExternalBalance] Provider is not active");
      return { success: false, error: "External API provider is not active" };
    }

    console.log("[getExternalBalance] Using provider:", provider.name, "endpoint:", provider.endpoint);

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
