import { LRUCache } from "lru-cache";

interface RateLimitOptions {
    maxRequests: number;
    windowMs: number;
    message?: string;
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitCache = new LRUCache<string, RateLimitEntry>({
    max: 10000,
    ttl: 60000, // 1 minute default cleanup
});

export function createRateLimiter(options: RateLimitOptions) {
    const {
        maxRequests = 10,
        windowMs = 60000,
        message = "Too many requests, please try again later.",
    } = options;

    return {
        checkLimit: (identifier: string): { success: boolean; remaining: number; resetTime: number; message: string } => {
            const now = Date.now();
            const entry = rateLimitCache.get(identifier);

            if (!entry) {
                // First request from this identifier
                rateLimitCache.set(identifier, {
                    count: 1,
                    resetTime: now + windowMs,
                });
                return {
                    success: true,
                    remaining: maxRequests - 1,
                    resetTime: now + windowMs,
                    message,
                };
            }

            // Check if window has expired
            if (now > entry.resetTime) {
                rateLimitCache.set(identifier, {
                    count: 1,
                    resetTime: now + windowMs,
                });
                return {
                    success: true,
                    remaining: maxRequests - 1,
                    resetTime: now + windowMs,
                    message,
                };
            }

            // Check if limit exceeded
            if (entry.count >= maxRequests) {
                return {
                    success: false,
                    remaining: 0,
                    resetTime: entry.resetTime,
                    message,
                };
            }

            // Increment counter
            entry.count += 1;
            rateLimitCache.set(identifier, entry);

            return {
                success: true,
                remaining: maxRequests - entry.count,
                resetTime: entry.resetTime,
                message,
            };
        },
        resetLimit: (identifier: string) => {
            rateLimitCache.delete(identifier);
        },
    };
}

// Pre-configured limiters for common use cases
export const messageRateLimiter = createRateLimiter({
    maxRequests: 10,
    windowMs: 10000, // 10 messages per 10 seconds
    message: "You're sending messages too quickly. Please slow down.",
});

export const apiRateLimiter = createRateLimiter({
    maxRequests: 100,
    windowMs: 60000, // 100 requests per minute
    message: "Too many API requests. Please try again later.",
});

export const friendRequestRateLimiter = createRateLimiter({
    maxRequests: 5,
    windowMs: 60000, // 5 friend requests per minute
    message: "Too many friend requests. Please try again later.",
});

/**
 * Extract a unique identifier from a request for rate limiting
 * Uses Clerk user ID if available, otherwise falls back to IP
 */
export async function getIdentifierFromRequest(req: Request): Promise<string> {
    // Try to get user ID from headers (set by Clerk middleware)
    const userId = req.headers.get("x-clerk-user-id");
    if (userId) {
        return `user:${userId}`;
    }

    // Fallback to IP address
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0] || "unknown";
    return `ip:${ip}`;
}
