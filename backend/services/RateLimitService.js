import { getRedis } from "../config/redis.js";
import RateLimitLog from "../models/RateLimitLog.js";

export class RateLimitService {
  // Check if request is allowed
  static async checkRateLimit(apiKey, userId, limit = 1000) {
    const redis = getRedis();

    if (!redis) {
      // Fallback to database-based rate limiting if Redis unavailable
      return this.checkRateLimitDb(apiKey, userId, limit);
    }

    try {
      const key = `ratelimit:${apiKey}`;
      const current = await redis.incr(key);

      // Set expiry on first request of the day
      if (current === 1) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const ttl = Math.ceil((tomorrow - new Date()) / 1000);
        await redis.expire(key, ttl);
      }

      const allowed = current <= limit;

      if (!allowed) {
        // Log rate limit violation
        await RateLimitLog.create({
          userId,
          apiKeyId: null,
          apiKey,
          limit,
          used: current,
          resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      }

      return {
        allowed,
        current,
        limit,
        remaining: Math.max(0, limit - current),
        resetAt: new Date(new Date().setHours(24, 0, 0, 0))
      };
    } catch (error) {
      console.error("Rate limit check error:", error);
      // Allow request on error
      return { allowed: true, error: true };
    }
  }

  // Database-based rate limiting (fallback)
  static async checkRateLimitDb(apiKey, userId, limit) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get count of requests today
    const count = await RateLimitLog.countDocuments({
      apiKey,
      violatedAt: { $gte: today, $lt: tomorrow }
    });

    const allowed = count < limit;

    return {
      allowed,
      current: count,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt: tomorrow
    };
  }

  // Reset rate limit for an API key
  static async resetRateLimit(apiKey) {
    const redis = getRedis();

    if (redis) {
      try {
        await redis.del(`ratelimit:${apiKey}`);
      } catch (error) {
        console.error("Error resetting Redis rate limit:", error);
      }
    }
  }

  // Get rate limit stats
  static async getRateLimitStats(userId, period = "day") {
    const startDate = new Date();

    if (period === "day") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const violations = await RateLimitLog.find({
      userId,
      violatedAt: { $gte: startDate }
    }).sort({ violatedAt: -1 });

    return {
      period,
      totalViolations: violations.length,
      violations,
      summary: this.summarizeViolations(violations)
    };
  }

  static summarizeViolations(violations) {
    return violations.reduce((acc, v) => {
      const key = v.apiKey;
      if (!acc[key]) {
        acc[key] = { apiKey: key, count: 0, limits: [] };
      }
      acc[key].count++;
      acc[key].limits.push(v.limit);
      return acc;
    }, {});
  }
}

export default RateLimitService;
