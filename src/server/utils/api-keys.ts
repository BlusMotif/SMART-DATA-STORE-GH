import { randomBytes, createHash, timingSafeEqual } from 'crypto';

/**
 * Generate a cryptographically secure API key with prefix
 * Uses 32 bytes (256 bits) of random data for maximum security
 * @param prefix - The prefix for the API key (e.g., 'sk', 'pk')
 * @returns A secure API key string
 */
export function generateSecureApiKey(prefix: string = 'sk'): string {
  // Generate 32 bytes of cryptographically secure random data (256 bits)
  // This provides sufficient entropy to prevent brute force attacks
  const randomPart = randomBytes(32).toString('hex');
  
  // Add timestamp-based component for additional uniqueness
  const timestamp = Date.now().toString(36);
  
  return `${prefix}_${timestamp}_${randomPart}`;
}

/**
 * Generate a public API key (less sensitive)
 * @returns A public API key string
 */
export function generatePublicApiKey(): string {
  const randomPart = randomBytes(16).toString('hex');
  return `pk_${randomPart}`;
}

/**
 * Hash an API key for secure storage
 * Uses SHA-256 hashing for one-way encryption
 * @param key - The API key to hash
 * @returns Hashed API key
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Verify an API key against its hash using constant-time comparison
 * Prevents timing attacks
 * @param key - The plain API key
 * @param hash - The stored hash
 * @returns True if the key matches the hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
  const keyHash = hashApiKey(key);
  const keyHashBuffer = Buffer.from(keyHash, 'hex');
  const storedHashBuffer = Buffer.from(hash, 'hex');
  
  // Use timing-safe comparison to prevent timing attacks
  if (keyHashBuffer.length !== storedHashBuffer.length) {
    return false;
  }
  
  return timingSafeEqual(keyHashBuffer, storedHashBuffer);
}

/**
 * Validate API key format
 * @param key - The API key to validate
 * @returns True if the key format is valid
 */
export function validateApiKeyFormat(key: string): boolean {
  // Updated regex to support timestamp component
  // Format: sk_[timestamp]_[64 hex chars] or pk_[16 hex chars]
  const skRegex = /^sk_[a-z0-9]+_[a-f0-9]{64}$/;
  const pkRegex = /^pk_[a-f0-9]{32}$/;
  return skRegex.test(key) || pkRegex.test(key);
}

/**
 * Mask API key for display (show first 8 and last 4 characters)
 * @param key - The API key to mask
 * @returns Masked API key string
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 12) return key;
  return `${key.substring(0, 8)}****${key.substring(key.length - 4)}`;
}

/**
 * Check if API key has required permissions
 * @param keyPermissions - JSON string of key permissions
 * @param requiredPermissions - Array of required permissions
 * @returns True if key has all required permissions
 */
export function hasPermissions(keyPermissions: string, requiredPermissions: string[]): boolean {
  try {
    const permissions = JSON.parse(keyPermissions);
    return requiredPermissions.every(perm => permissions[perm] === true);
  } catch {
    return false;
  }
}

/**
 * Rate limit tracker for API key generation
 * Prevents abuse by limiting how many keys can be created per user per time period
 */
const keyGenerationAttempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if user has exceeded API key generation rate limit
 * Limits: 5 keys per hour per user
 * @param userId - The user ID
 * @returns Object with allowed status and remaining attempts
 */
export function checkKeyGenerationRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const limit = 5; // Maximum 5 keys per hour
  const windowMs = 60 * 60 * 1000; // 1 hour
  
  const record = keyGenerationAttempts.get(userId);
  
  if (!record || now > record.resetAt) {
    // Reset or create new record
    const resetAt = now + windowMs;
    keyGenerationAttempts.set(userId, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  
  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }
  
  record.count++;
  return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
}

/**
 * Clean up expired rate limit records (called periodically)
 */
export function cleanupRateLimitRecords(): void {
  const now = Date.now();
  for (const [userId, record] of keyGenerationAttempts.entries()) {
    if (now > record.resetAt) {
      keyGenerationAttempts.delete(userId);
    }
  }
}

// Clean up rate limit records every hour
setInterval(cleanupRateLimitRecords, 60 * 60 * 1000);