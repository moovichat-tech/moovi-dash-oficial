/**
 * Server-side rate limiter for Edge Functions
 * Tracks requests by IP address using in-memory storage
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestLog {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RequestLog>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, log] of rateLimitStore.entries()) {
    if (log.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address or user ID)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;
  
  let log = rateLimitStore.get(key);
  
  // Initialize or reset if window expired
  if (!log || log.resetAt < now) {
    log = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, log);
  }
  
  // Check if limit exceeded
  if (log.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: log.resetAt,
    };
  }
  
  // Increment counter
  log.count++;
  
  return {
    allowed: true,
    remaining: config.maxRequests - log.count,
    resetAt: log.resetAt,
  };
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: Request): string {
  // Try to get real IP from headers (considering proxies)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a generic identifier
  return 'unknown';
}
