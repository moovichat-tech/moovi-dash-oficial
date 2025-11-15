/**
 * Simple client-side rate limiter using Map to track request timestamps
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const requestTimestamps = new Map<string, number[]>();

/**
 * Check if a request is allowed based on rate limit configuration
 * @param key - Unique identifier for the rate limit (e.g., 'send-code', 'verify-code')
 * @param config - Rate limit configuration
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const timestamps = requestTimestamps.get(key) || [];

  // Remove timestamps outside the current window
  const validTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < config.windowMs
  );

  // Check if we've exceeded the limit
  if (validTimestamps.length >= config.maxRequests) {
    return false;
  }

  // Add current timestamp and update the map
  validTimestamps.push(now);
  requestTimestamps.set(key, validTimestamps);

  return true;
}

/**
 * Get remaining time until rate limit resets (in milliseconds)
 */
export function getRateLimitResetTime(key: string, windowMs: number): number {
  const timestamps = requestTimestamps.get(key) || [];
  if (timestamps.length === 0) return 0;

  const oldestTimestamp = Math.min(...timestamps);
  const resetTime = oldestTimestamp + windowMs - Date.now();

  return Math.max(0, resetTime);
}
