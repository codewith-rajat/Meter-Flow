import { createClient } from "redis";

let redisClient = null;

export const initRedis = async () => {
  if (redisClient) return redisClient;

  try {
    const redisUrl = process.env.REDIS_ENABLED === 'true' && process.env.REDIS_HOST
      ? `redis://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
      : null;

    if (!redisUrl) {
      console.log("⚠ Redis disabled or not configured - using fallback");
      return null;
    }

    redisClient = createClient({
      url: redisUrl
    });

    redisClient.on("error", (err) => console.error("Redis Error:", err));
    redisClient.on("connect", () => console.log("✓ Redis Connected"));

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.error("⚠ Redis Connection Failed:", err.message);
    // If Redis fails, system continues without rate limiting from Redis
    return null;
  }
};

export const getRedis = () => redisClient;

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
  }
};
