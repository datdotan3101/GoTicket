import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.warn("⚠️ Warning: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing in .env. Redis features will be disabled.");
}

export const redis = (url && token) 
  ? new Redis({ url, token }) 
  : null;

// Test connection helper
export const checkRedisConnection = async () => {
  if (!redis) {
    console.log("❌ Redis connection skipped: Missing environment variables.");
    return false;
  }
  try {
    await redis.ping();
    console.log("🚀 Redis (Upstash) connected successfully!");
    return true;
  } catch (error) {
    console.error("❌ Redis connection failed:", error.message);
    return false;
  }
};
