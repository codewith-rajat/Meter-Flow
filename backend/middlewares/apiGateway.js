import ApiKey from "../models/ApiKey.js";
import RateLimitService from "../services/RateLimitService.js";

export const validateKey = async (req, res, next) => {
  try {
    const key = req.headers["x-api-key"];

    if (!key) {
      return res.status(401).json({
        error: "No API key provided",
        code: "MISSING_API_KEY"
      });
    }

    // ✅ Find using raw key (not hashed - keys are stored raw in DB)
    const apiKey = await ApiKey.findOne({ key }).populate("userId");

    if (!apiKey) {
      return res.status(403).json({
        error: "Invalid API key",
        code: "INVALID_API_KEY"
      });
    }

    if (apiKey.status !== "active") {
      return res.status(403).json({
        error: `API key is ${apiKey.status}`,
        code: "API_KEY_NOT_ACTIVE"
      });
    }

    // Expiration check
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      apiKey.status = "expired";
      await apiKey.save();

      return res.status(403).json({
        error: "API key has expired",
        code: "API_KEY_EXPIRED"
      });
    }

    req.apiKey = apiKey;
    req.user = apiKey.userId;

    next();
  } catch (err) {
    console.error("API Gateway validation error:", err);
    res.status(500).json({ error: "Gateway error" });
  }
};

export const applyRateLimit = async (req, res, next) => {
  try {
    const apiKey = req.apiKey;
    const limit = apiKey.rateLimit || 1000; // requests per day

    const rateLimitResult = await RateLimitService.checkRateLimit(
      apiKey.key,
      apiKey.userId._id,
      limit
    );

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", rateLimitResult.remaining);
    res.setHeader("X-RateLimit-Reset", rateLimitResult.resetAt.toISOString());

    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        code: "RATE_LIMIT_EXCEEDED",
        limit,
        current: rateLimitResult.current,
        resetAt: rateLimitResult.resetAt
      });
    }

    next();
  } catch (err) {
    console.error("Rate limit error:", err);
    // Continue on error - don't block requests
    next();
  }
};