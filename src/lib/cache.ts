// TODO: Replace with Redis or dedicated caching solution when scaling

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

class MemoryCache {
    private cache = new Map<string, CacheEntry<unknown>>();
    private defaultTTL: number;

    constructor(defaultTTLSeconds = 60) {
        this.defaultTTL = defaultTTLSeconds * 1000;
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key) as CacheEntry<T> | undefined;

        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    set<T>(key: string, value: T, ttlSeconds?: number): void {
        const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttl,
        });
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    // Helper to get-or-set with async factory
    async getOrSet<T>(
        key: string,
        factory: () => Promise<T>,
        ttlSeconds?: number
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) return cached;

        const value = await factory();
        this.set(key, value, ttlSeconds);
        return value;
    }
}

// Singleton instance for stats caching (5 minute default TTL)
export const statsCache = new MemoryCache(300);
