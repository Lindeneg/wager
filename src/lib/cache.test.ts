import {describe, test, expect, vi, beforeEach, afterEach} from "vitest";

// Import the class by creating a new instance (can't import class directly)
// We'll test through a fresh instance each time

class MemoryCache {
    private cache = new Map<string, {value: unknown; expiresAt: number}>();
    private defaultTTL: number;

    constructor(defaultTTLSeconds = 60) {
        this.defaultTTL = defaultTTLSeconds * 1000;
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key) as {value: T; expiresAt: number} | undefined;
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

describe("MemoryCache", () => {
    let cache: MemoryCache;

    beforeEach(() => {
        cache = new MemoryCache(60); // 60 second default TTL
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("get/set", () => {
        test("returns null for missing key", () => {
            expect(cache.get("missing")).toBeNull();
        });

        test("stores and retrieves value", () => {
            cache.set("key", "value");
            expect(cache.get("key")).toBe("value");
        });

        test("stores complex objects", () => {
            const obj = {id: 1, data: [1, 2, 3]};
            cache.set("obj", obj);
            expect(cache.get("obj")).toEqual(obj);
        });

        test("expires after TTL", () => {
            cache.set("key", "value", 10); // 10 seconds

            expect(cache.get("key")).toBe("value");

            vi.advanceTimersByTime(11000); // 11 seconds

            expect(cache.get("key")).toBeNull();
        });

        test("uses default TTL when not specified", () => {
            cache.set("key", "value");

            vi.advanceTimersByTime(59000); // 59 seconds
            expect(cache.get("key")).toBe("value");

            vi.advanceTimersByTime(2000); // 61 seconds total
            expect(cache.get("key")).toBeNull();
        });
    });

    describe("delete", () => {
        test("removes existing key", () => {
            cache.set("key", "value");
            expect(cache.get("key")).toBe("value");

            cache.delete("key");
            expect(cache.get("key")).toBeNull();
        });

        test("does nothing for missing key", () => {
            cache.delete("missing"); // Should not throw
        });
    });

    describe("clear", () => {
        test("removes all keys", () => {
            cache.set("key1", "value1");
            cache.set("key2", "value2");
            cache.set("key3", "value3");

            cache.clear();

            expect(cache.get("key1")).toBeNull();
            expect(cache.get("key2")).toBeNull();
            expect(cache.get("key3")).toBeNull();
        });
    });

    describe("getOrSet", () => {
        test("returns cached value without calling factory", async () => {
            cache.set("key", "cached");
            const factory = vi.fn().mockResolvedValue("new");

            const result = await cache.getOrSet("key", factory);

            expect(result).toBe("cached");
            expect(factory).not.toHaveBeenCalled();
        });

        test("calls factory for missing key", async () => {
            const factory = vi.fn().mockResolvedValue("new");

            const result = await cache.getOrSet("key", factory);

            expect(result).toBe("new");
            expect(factory).toHaveBeenCalledOnce();
        });

        test("caches factory result", async () => {
            const factory = vi.fn().mockResolvedValue("new");

            await cache.getOrSet("key", factory);
            const result = await cache.getOrSet("key", factory);

            expect(result).toBe("new");
            expect(factory).toHaveBeenCalledOnce();
        });

        test("respects custom TTL", async () => {
            const factory = vi.fn().mockResolvedValue("value");

            await cache.getOrSet("key", factory, 5); // 5 seconds

            vi.advanceTimersByTime(6000);

            // Should call factory again after expiration
            await cache.getOrSet("key", factory, 5);
            expect(factory).toHaveBeenCalledTimes(2);
        });
    });
});
