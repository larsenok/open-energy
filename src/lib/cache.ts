import NodeCache from 'node-cache';

type CacheKey = string;

const cache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 120 });

export function getCached<T>(key: CacheKey): T | undefined {
  return cache.get<T>(key);
}

export function setCached<T>(key: CacheKey, value: T, ttlSeconds?: number) {
  cache.set(key, value, ttlSeconds);
}

export function delCached(key: CacheKey) {
  cache.del(key);
}
