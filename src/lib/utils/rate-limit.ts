import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 10 AI requests per user per minute
export const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "focusflow:ai",
});

// 60 general API requests per user per minute
export const apiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "focusflow:api",
});

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const { success, remaining, reset } = await limiter.limit(identifier);
  return { allowed: success, remaining, reset };
}

/** Cache AI response in Redis (TTL = 1 hour) */
export async function cacheAIResponse(key: string, value: unknown): Promise<void> {
  await redis.setex(`ai_cache:${key}`, 3600, JSON.stringify(value));
}

/** Get cached AI response */
export async function getCachedAIResponse<T>(key: string): Promise<T | null> {
  const cached = await redis.get<string>(`ai_cache:${key}`);
  if (!cached) return null;
  try { return JSON.parse(cached) as T; } catch { return null; }
}
