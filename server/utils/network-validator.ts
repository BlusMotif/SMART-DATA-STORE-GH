/**
 * Network Validation Utility for Ghana Mobile Networks
 * Validates phone numbers against their respective network providers
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
 * Normalizes a phone number by removing common prefixes and formatting
 * @param phone - The phone number to normalize
 * @returns Normalized 10-digit phone number
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, "");
  
  // Remove country code if present (233)
  if (normalized.startsWith("233")) {
    normalized = "0" + normalized.substring(3);
  }
  
  // Ensure it starts with 0
  if (!normalized.startsWith("0")) {
    normalized = "0" + normalized;
  }
  
  return normalized;
}

/**
 * Validates if a phone number is exactly 10 digits
 * @param phone - The phone number to validate
 * @returns true if valid length, false otherwise
 */
export function isValidPhoneLength(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return normalized.length === 10;
}

/**
 * Detects the network provider from a phone number
 * @param phone - The phone number to check
 * @returns The detected network or null if invalid
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
 * Validates if a phone number belongs to a specific network
 * @param phone - The phone number to validate
 * @param expectedNetwork - The expected network provider
 * @returns true if the phone matches the network, false otherwise
 */
export function validatePhoneNetwork(
  phone: string,
  expectedNetwork: string
): boolean {
  const detectedNetwork = detectNetwork(phone);
  
  if (!detectedNetwork) {
    return false;
  }
  
  return detectedNetwork.toLowerCase() === expectedNetwork.toLowerCase();
}

/**
 * Gets a human-readable error message for network mismatch
 * @param phone - The phone number
 * @param expectedNetwork - The expected network
 * @returns Error message string
 */
export function getNetworkMismatchError(
  phone: string,
  expectedNetwork: string
): string {
  const detectedNetwork = detectNetwork(phone);
  const normalized = normalizePhoneNumber(phone);
  const prefix = normalized.substring(0, 3);
  
  if (!isValidPhoneLength(normalized)) {
    return "Phone number must be exactly 10 digits including the prefix (e.g., 0241234567)";
  }
  
  if (!detectedNetwork) {
    return `Invalid phone number. The prefix '${prefix}' does not belong to any supported network (MTN, Telecel, or AirtelTigo)`;
  }
  
  const networkName = getNetworkDisplayName(detectedNetwork);
  const expectedName = getNetworkDisplayName(expectedNetwork);
  const validPrefixes = NETWORK_PREFIXES[expectedNetwork as GhanaNetwork] || [];
  
  return `Phone number mismatch! This number (${prefix}) belongs to ${networkName}, but you selected ${expectedName}. ${expectedName} numbers start with: ${validPrefixes.join(", ")}`;
}

/**
 * Gets the display name for a network
 * @param network - The network identifier
 * @returns Human-readable network name
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
 * Gets all valid prefixes for a network
 * @param network - The network identifier
 * @returns Array of valid prefixes
 */
export function getNetworkPrefixes(network: string): string[] {
  return NETWORK_PREFIXES[network as GhanaNetwork] || [];
}

/**
 * Validates and provides detailed information about a phone number
 * @param phone - The phone number to validate
 * @param expectedNetwork - Optional expected network
 * @returns Validation result with details
 */
export function validatePhoneNumberDetailed(
  phone: string,
  expectedNetwork?: string
): {
  isValid: boolean;
  normalized: string;
  detectedNetwork: GhanaNetwork | null;
  matchesExpected: boolean;
  error: string | null;
} {
  const normalized = normalizePhoneNumber(phone);
  const detectedNetwork = detectNetwork(phone);
  
  if (!isValidPhoneLength(normalized)) {
    return {
      isValid: false,
      normalized,
      detectedNetwork: null,
      matchesExpected: false,
      error: "Phone number must be exactly 10 digits",
    };
  }
  
  if (!detectedNetwork) {
    return {
      isValid: false,
      normalized,
      detectedNetwork: null,
      matchesExpected: false,
      error: `Invalid prefix '${normalized.substring(0, 3)}'. Not a valid Ghana mobile number`,
    };
  }
  
  const matchesExpected = expectedNetwork
    ? detectedNetwork.toLowerCase() === expectedNetwork.toLowerCase()
    : true;
  
  if (expectedNetwork && !matchesExpected) {
    return {
      isValid: false,
      normalized,
      detectedNetwork,
      matchesExpected: false,
      error: getNetworkMismatchError(phone, expectedNetwork),
    };
  }
  
  return {
    isValid: true,
    normalized,
    detectedNetwork,
    matchesExpected: true,
    error: null,
  };
}
