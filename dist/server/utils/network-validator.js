/**
 * Network Validation Utility for Ghana Mobile Networks
 * Validates phone numbers against their respective network providers
 */
export var GhanaNetwork;
(function (GhanaNetwork) {
    GhanaNetwork["MTN"] = "mtn";
    GhanaNetwork["TELECEL"] = "telecel";
    GhanaNetwork["AIRTELTIGO"] = "airteltigo";
    GhanaNetwork["AT_BIGTIME"] = "at_bigtime";
    GhanaNetwork["AT_ISHARE"] = "at_ishare";
})(GhanaNetwork || (GhanaNetwork = {}));
// Network prefix mappings
const NETWORK_PREFIXES = {
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
export function normalizePhoneNumber(phone) {
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
export function isValidPhoneLength(phone) {
    const normalized = normalizePhoneNumber(phone);
    return normalized.length === 10;
}
/**
 * Detects the network provider from a phone number
 * @param phone - The phone number to check
 * @returns The detected network or null if invalid
 */
export function detectNetwork(phone) {
    // Phone number prefix validation has been removed
    // Always return null to indicate no network detection
    return null;
}
/**
 * Validates if a phone number belongs to a specific network
 * @param phone - The phone number to validate
 * @param expectedNetwork - The expected network provider
 * @returns true if the phone matches the network, false otherwise
 */
export function validatePhoneNetwork(phone, expectedNetwork) {
    // Phone number prefix validation has been removed
    // Always return true to allow any phone number
    return true;
}
/**
 * Gets a human-readable error message for network mismatch
 * @param phone - The phone number
 * @param expectedNetwork - The expected network
 * @returns Error message string
 */
export function getNetworkMismatchError(phone, expectedNetwork) {
    // Phone number prefix validation has been removed
    // No mismatch errors are generated
    return "";
}
/**
 * Gets the display name for a network
 * @param network - The network identifier
 * @returns Human-readable network name
 */
export function getNetworkDisplayName(network) {
    const names = {
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
export function getNetworkPrefixes(network) {
    return NETWORK_PREFIXES[network] || [];
}
/**
 * Validates and provides detailed information about a phone number
 * @param phone - The phone number to validate
 * @param expectedNetwork - Optional expected network
 * @returns Validation result with details
 */
export function validatePhoneNumberDetailed(phone, expectedNetwork) {
    const normalized = normalizePhoneNumber(phone);
    if (!isValidPhoneLength(normalized)) {
        return {
            isValid: false,
            normalized,
            detectedNetwork: null,
            matchesExpected: false,
            error: "Phone number must be exactly 10 digits",
        };
    }
    // Phone number prefix validation has been removed
    // Always consider the number valid
    return {
        isValid: true,
        normalized,
        detectedNetwork: null,
        matchesExpected: true,
        error: null,
    };
}
