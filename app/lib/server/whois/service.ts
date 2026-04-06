import type { WhoisData } from '@/types/database';

export const WHOIS_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

interface WhoisCacheStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, ttlSeconds: number): Promise<void>;
}

interface GetWhoisDataOptions {
  domainName: string;
  apiKey: string;
  cache: WhoisCacheStore;
  now?: string;
  fetcher?: (domainName: string, apiKey: string) => Promise<WhoisData>;
}

interface CachedWhoisValue {
  whois: WhoisData;
  expiresAt: string;
}

function getCacheKey(domainName: string) {
  return `whois:${domainName.trim().toLowerCase()}`;
}

function parseCachedWhois(value: string | null): CachedWhoisValue | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as CachedWhoisValue;
  } catch {
    return null;
  }
}

async function fetchWhoisFromApi(domainName: string, apiKey: string): Promise<WhoisData> {
  const response = await fetch(
    `https://api.api-ninjas.com/v1/whois?domain=${encodeURIComponent(domainName)}`,
    {
      headers: {
        'X-Api-Key': apiKey,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`WHOIS API error: ${response.statusText}`);
  }

  return (await response.json()) as WhoisData;
}

export async function getWhoisData(options: GetWhoisDataOptions): Promise<WhoisData> {
  const domainName = options.domainName.trim().toLowerCase();
  const now = new Date(options.now ?? new Date().toISOString());
  const cacheKey = getCacheKey(domainName);
  const cached = parseCachedWhois(await options.cache.get(cacheKey));

  if (cached && new Date(cached.expiresAt) > now) {
    return cached.whois;
  }

  const fetcher = options.fetcher ?? fetchWhoisFromApi;
  const whois = await fetcher(domainName, options.apiKey);
  const expiresAt = new Date(now.getTime() + WHOIS_CACHE_TTL_SECONDS * 1000).toISOString();

  await options.cache.put(
    cacheKey,
    JSON.stringify({
      whois,
      expiresAt,
    } satisfies CachedWhoisValue),
    WHOIS_CACHE_TTL_SECONDS,
  );

  return whois;
}
