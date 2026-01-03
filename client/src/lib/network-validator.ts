/**
 * Client-side Network Validation Utility
 * Validates phone numbers against Ghana mobile networks
 */

export enum GhanaNetwork {
  MTN = "mtn",
  TELECEL = "telecel",
  AIRTELTIGO = "airteltigo",
}

// Network prefix mappings
const NETWORK_PREFIXES: Record<GhanaNetwork, string[]> = {
  [GhanaNetwork.MTN]: ["024", "025", "053", "054", "055", "059"],
  [GhanaNetwork.TELECEL]: ["020", "050"],
  [GhanaNetwork.AIRTELTIGO]: ["026", "027", "056", "057"],
};

/**
 * Normalizes a phone number
 */
export function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace(/\D/g, "");
  
  if (normalized.startsWith("233")) {
    normalized = "0" + normalized.substring(3);
  }
  
  if (!normalized.startsWith("0")) {
    normalized = "0" + normalized;
  }
  
  return normalized;
}

/**
 * Validates phone number length
 */
export function isValidPhoneLength(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return normalized.length === 10;
}

/**
 * Detects network from phone number
 */
export function detectNetwork(phone: string): GhanaNetwork | null {
  const normalized = normalizePhoneNumber(phone);
  
  if (!isValidPhoneLength(normalized)) {
    return null;
  }
  
  const prefix = normalized.substring(0, 3);
  
  for (const [network, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.includes(prefix)) {
      return network as GhanaNetwork;
    }
  }
  
  return null;
}

/**
 * Gets network display name
 */
export function getNetworkDisplayName(network: string): string {
  const names: Record<string, string> = {
    mtn: "MTN Ghana",
    telecel: "Telecel",
    airteltigo: "AirtelTigo",
  };
  
  return names[network.toLowerCase()] || network.toUpperCase();
}

/**
 * Gets valid prefixes for a network
 */
export function getNetworkPrefixes(network: string): string[] {
  return NETWORK_PREFIXES[network as GhanaNetwork] || [];
}

/**
 * Validates phone against expected network
 */
export function validatePhoneNetwork(
  phone: string,
  expectedNetwork: string
): { isValid: boolean; error?: string } {
  const normalized = normalizePhoneNumber(phone);
  
  if (!isValidPhoneLength(normalized)) {
    return {
      isValid: false,
      error: "Phone number must be exactly 10 digits (e.g., 0241234567)",
    };
  }
  
  const detectedNetwork = detectNetwork(normalized);
  const prefix = normalized.substring(0, 3);
  
  if (!detectedNetwork) {
    return {
      isValid: false,
      error: `Invalid prefix '${prefix}'. Not a valid Ghana mobile number`,
    };
  }
  
  if (detectedNetwork.toLowerCase() !== expectedNetwork.toLowerCase()) {
    const validPrefixes = getNetworkPrefixes(expectedNetwork);
    return {
      isValid: false,
      error: `This number belongs to ${getNetworkDisplayName(
        detectedNetwork
      )}. ${getNetworkDisplayName(expectedNetwork)} numbers start with: ${validPrefixes.join(", ")}`,
    };
  }
  
  return { isValid: true };
}
