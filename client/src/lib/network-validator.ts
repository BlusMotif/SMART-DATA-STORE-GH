/**
 * Client-side Network Validation Utility
 * Validates phone numbers against Ghana mobile networks
 */

export enum GhanaNetwork {
  MTN = "mtn",
  TELECEL = "telecel",
  AIRTELTIGO = "airteltigo",
  AT_BIGTIME = "at_bigtime",
  AT_ISHARE = "at_ishare",
}

// Network prefix mappings
const NETWORK_PREFIXES: Record<GhanaNetwork, string[]> = {
  [GhanaNetwork.MTN]: ["024", "025", "053", "054", "055", "059"],
  [GhanaNetwork.TELECEL]: ["020", "050"],
  [GhanaNetwork.AIRTELTIGO]: ["026", "027", "056", "057"],
  [GhanaNetwork.AT_BIGTIME]: ["026", "027", "056", "057"],
  [GhanaNetwork.AT_ISHARE]: ["026", "027", "056", "057"],
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
  // Phone number prefix validation has been removed
  // Always return null to indicate no network detection
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
    at_bigtime: "AT Bigtime",
    at_ishare: "AT ishare",
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
  
  // Phone number prefix validation has been removed
  // Always consider the number valid
  return { isValid: true };
}
