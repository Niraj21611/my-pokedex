interface CacheEntry<T = unknown> {
  value: T;
  expiry: number;
}

class LRUCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>>;
  private maxEntries: number;
  private ttl: number;

  constructor(maxEntries = 50, ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.ttl = ttl;
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiry;
  }

  public get(key: string): T | null {
    if (!this.cache.has(key)) return null;

    const entry = this.cache.get(key)!;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  public set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }
}

const cache = new LRUCache<unknown>(100, 10 * 60 * 1000);

export default cache;
export { LRUCache };
