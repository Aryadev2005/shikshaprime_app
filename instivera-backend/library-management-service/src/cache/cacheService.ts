import Redis from "ioredis";
import { appConfig } from "../config/appConfig";

class CacheService {
  private memory = new Map<string, { value: string; expiresAt: number }>();
  private redis?: Redis;
  constructor() {
    if (appConfig.redis.url) this.redis = new Redis(appConfig.redis.url, { lazyConnect: true });
  }
  async get(key: string): Promise<string | null> {
    if (this.redis) {
      try { const v = await this.redis.get(key); if (v) return v; } catch {}
    }
    const item = this.memory.get(key);
    if (!item || item.expiresAt < Date.now()) return null;
    return item.value;
  }
  async set(key: string, value: string, ttlSec: number): Promise<void> {
    if (this.redis) {
      try { await this.redis.set(key, value, "EX", ttlSec); return; } catch {}
    }
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
  }
}
export const cacheService = new CacheService();
