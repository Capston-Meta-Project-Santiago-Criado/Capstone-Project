// Stale-while-revalidate frontend cache
// Survives route changes; lost on hard reload.

const _store    = new Map(); // key -> { data, fetchedAt }
const _inflight = new Map(); // key -> Promise  (deduplication)

/**
 * Fetch with cache. Returns cached data immediately when fresh.
 * When stale, fetches in background and resolves with fresh data.
 * When completely missing, waits for the first fetch.
 *
 * @param {string}   key    Cache key (usually the URL or a derived key)
 * @param {Function} fetcher  async () => data
 * @param {number}   ttlMs  Time-to-live in ms (default 5 min)
 * @param {object}   opts
 *   revalidate: true  - always revalidate in background even if fresh (SWR)
 */
export async function cachedFetch(key, fetcher, ttlMs = 5 * 60_000, opts = {}) {
  const entry = _store.get(key);
  const now   = Date.now();
  const isStale = !entry || now - entry.fetchedAt >= ttlMs;

  const doFetch = () => {
    if (_inflight.has(key)) return _inflight.get(key);
    const p = fetcher()
      .then((data) => { _store.set(key, { data, fetchedAt: Date.now() }); return data; })
      .finally(() => _inflight.delete(key));
    _inflight.set(key, p);
    return p;
  };

  if (!isStale && !opts.revalidate) {
    // Fresh — return immediately
    return entry.data;
  }

  if (entry && isStale) {
    // Stale-while-revalidate: return old data now, refresh in background
    doFetch().catch(() => {});
    return entry.data;
  }

  // No cache — must wait
  return doFetch();
}

/** Read cached value synchronously (null if missing) */
export function getCached(key) {
  return _store.get(key)?.data ?? null;
}

export function isCacheStale(key, ttlMs = 5 * 60_000) {
  const entry = _store.get(key);
  return !entry || Date.now() - entry.fetchedAt >= ttlMs;
}

export function invalidate(key) {
  _store.delete(key);
  _inflight.delete(key);
}

export function invalidatePrefix(prefix) {
  for (const k of _store.keys()) if (k.startsWith(prefix)) _store.delete(k);
}
