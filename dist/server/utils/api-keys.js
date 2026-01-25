import { randomBytes } from 'crypto';
/**
 * Generate a secure API key with prefix
 * @param prefix - The prefix for the API key (e.g., 'sk', 'pk')
 * @returns A secure API key string
 */
export function generateSecureApiKey(prefix = 'sk') {
    // Generate 32 bytes of random data (256 bits)
    const randomPart = randomBytes(32).toString('hex');
    return `${prefix}_${randomPart}`;
}
/**
 * Generate a public API key (less sensitive)
 * @returns A public API key string
 */
export function generatePublicApiKey() {
    const randomPart = randomBytes(16).toString('hex');
    return `pk_${randomPart}`;
}
/**
 * Validate API key format
 * @param key - The API key to validate
 * @returns True if the key format is valid
 */
export function validateApiKeyFormat(key) {
    // API keys should start with sk_ or pk_ followed by 64 hex characters for sk_ or 32 for pk_
    const skRegex = /^sk_[a-f0-9]{64}$/;
    const pkRegex = /^pk_[a-f0-9]{32}$/;
    return skRegex.test(key) || pkRegex.test(key);
}
/**
 * Mask API key for display (show first 8 and last 4 characters)
 * @param key - The API key to mask
 * @returns Masked API key string
 */
export function maskApiKey(key) {
    if (!key || key.length < 12)
        return key;
    return `${key.substring(0, 8)}****${key.substring(key.length - 4)}`;
}
/**
 * Check if API key has required permissions
 * @param keyPermissions - JSON string of key permissions
 * @param requiredPermissions - Array of required permissions
 * @returns True if key has all required permissions
 */
export function hasPermissions(keyPermissions, requiredPermissions) {
    try {
        const permissions = JSON.parse(keyPermissions);
        return requiredPermissions.every(perm => permissions[perm] === true);
    }
    catch {
        return false;
    }
}
