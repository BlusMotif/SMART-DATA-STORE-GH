import { storage } from "./storage.js";

// Minimal generic provider caller - extend per provider as needed
export async function fulfillDataBundleTransaction(transaction: any) {
  try {
    const network = transaction.network;
    if (!network) {
      return { success: false, error: "No network set on transaction" };
    }

    // Get stored API settings
    const mtnKey = await storage.getSetting("api.mtn.key");
    const mtnEndpoint = await storage.getSetting("api.mtn.endpoint");
    const telecelKey = await storage.getSetting("api.telecel.key");
    const atBigKey = await storage.getSetting("api.at_bigtime.key");
    const atIshareKey = await storage.getSetting("api.at_ishare.key");

    // Decide which provider to call based on transaction.network value
    let providerConfig: { endpoint?: string; key?: string; name: string } = { name: "unknown" };

    if (network === "mtn") {
      providerConfig = { endpoint: mtnEndpoint || undefined, key: mtnKey || undefined, name: "mtn" };
    } else if (network === "telecel") {
      providerConfig = { endpoint: undefined, key: telecelKey || undefined, name: "telecel" };
    } else if (network === "at_bigtime") {
      providerConfig = { endpoint: undefined, key: atBigKey || undefined, name: "at_bigtime" };
    } else if (network === "at_ishare") {
      providerConfig = { endpoint: undefined, key: atIshareKey || undefined, name: "at_ishare" };
    } else if (network === "airteltigo") {
      // Default airteltigo mapping can use mtn or specific settings
      providerConfig = { endpoint: mtnEndpoint || undefined, key: mtnKey || undefined, name: "airteltigo" };
    }

    // Compose recipients
    const recipients = transaction.phoneNumbers && Array.isArray(transaction.phoneNumbers)
      ? transaction.phoneNumbers.map((p: any) => p.phone)
      : [transaction.customerPhone];

    const results: any[] = [];

    for (const phone of recipients) {
      // For now, perform a generic POST if endpoint is present, otherwise simulate success
      if (providerConfig.endpoint) {
        try {
          const body = {
            phone,
            productId: transaction.productId,
            productName: transaction.productName,
            network: transaction.network,
            reference: transaction.reference,
          };

          const resp = await fetch(providerConfig.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(providerConfig.key ? { Authorization: `Bearer ${providerConfig.key}` } : {}),
            },
            body: JSON.stringify(body),
          });

          const data = await resp.json().catch(() => ({ status: resp.ok }));
          results.push({ phone, status: resp.ok ? "ok" : "failed", providerResponse: data });
        } catch (e: any) {
          results.push({ phone, status: "failed", error: e.message });
        }
      } else {
        // No endpoint configured for this provider - fallback: mark as not delivered
        results.push({ phone, status: "skipped", reason: "No provider endpoint configured for this network" });
      }
    }

    return { success: true, provider: providerConfig.name, results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
