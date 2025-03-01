/**
 * Simple in-memory cache with TTL
 */
export class Cache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();

  constructor(private ttlMs: number = 5 * 60 * 1000) {}

  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);

    if (!item) {
      return undefined;
    }

    // Check if the item has expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlMs,
    });
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Export singleton instances for different types of data
export const storyCache = new Cache<any>();
export const commentCache = new Cache<any>();
export const userCache = new Cache<any>();
export const searchCache = new Cache<any>(60 * 1000); // 1 minute TTL for search results
