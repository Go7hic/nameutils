import type { DomainSearchResult } from '@/types/database';

export type AvailabilityProvider = 'vercel' | 'apininjas' | 'rapidapi';

export interface DomainSearchEnv {
  VERCEL_API_TOKEN?: string;
  VERCEL_TEAM_ID?: string;
  API_NINJAS_KEY?: string;
  RAPIDAPI_KEY?: string;
  RAPIDAPI_HOST?: string;
}

interface CacheStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, ttlSeconds: number): Promise<void>;
}

type AvailabilityFetcher = (
  provider: AvailabilityProvider,
  domain: string,
  env: DomainSearchEnv,
) => Promise<DomainSearchResult>;

type TldFetcher = (env: DomainSearchEnv) => Promise<string[]>;

interface GetDomainAvailabilityOptions {
  domain: string;
  cache: CacheStore;
  env: DomainSearchEnv;
  providers?: AvailabilityProvider[];
  fetcher?: AvailabilityFetcher;
  now?: string;
}

interface GetSupportedTldsOptions {
  cache: CacheStore;
  env: DomainSearchEnv;
  fetcher?: TldFetcher;
  now?: string;
}

interface CachedDomainLookup {
  result: DomainSearchResult;
  expiresAt: string;
}

interface CachedTlds {
  tlds: string[];
  expiresAt: string;
}

export const DOMAIN_LOOKUP_CACHE_TTL_SECONDS = 60 * 5;
export const TLD_CACHE_TTL_SECONDS = 60 * 60 * 24;
export const DEFAULT_TLDS = [
  'com',
  'net',
  'org',
  'io',
  'co',
  'dev',
  'app',
  'tech',
  'online',
  'site',
  'store',
  'blog',
  'info',
];

function parseJson<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getDomainCacheKey(domain: string) {
  return `domain:${domain.trim().toLowerCase()}`;
}

function isFresh(expiresAt: string, now: Date) {
  return new Date(expiresAt) > now;
}

function getEnabledProviders(
  env: DomainSearchEnv,
  providers?: AvailabilityProvider[],
): AvailabilityProvider[] {
  const preferredProviders = providers ?? ['vercel', 'apininjas', 'rapidapi'];

  return preferredProviders.filter((provider) => {
    switch (provider) {
      case 'vercel':
        return Boolean(env.VERCEL_API_TOKEN);
      case 'apininjas':
        return Boolean(env.API_NINJAS_KEY);
      case 'rapidapi':
        return Boolean(env.RAPIDAPI_KEY);
      default:
        return false;
    }
  });
}

async function fetchFromVercel(
  domain: string,
  env: DomainSearchEnv,
): Promise<DomainSearchResult> {
  if (!env.VERCEL_API_TOKEN) {
    throw new Error('Vercel API token is not configured');
  }

  const query = env.VERCEL_TEAM_ID
    ? `?teamId=${encodeURIComponent(env.VERCEL_TEAM_ID)}`
    : '';
  const availabilityResponse = await fetch(
    `https://api.vercel.com/v1/registrar/domains/${encodeURIComponent(domain)}/availability${query}`,
    {
      headers: {
        Authorization: `Bearer ${env.VERCEL_API_TOKEN}`,
      },
    },
  );

  if (!availabilityResponse.ok) {
    throw new Error(`Vercel availability error: ${availabilityResponse.statusText}`);
  }

  const availability = (await availabilityResponse.json()) as { available?: boolean };
  const result: DomainSearchResult = {
    domain,
    available: availability.available === true,
  };

  if (!result.available) {
    return result;
  }

  const priceResponse = await fetch(
    `https://api.vercel.com/v1/registrar/domains/${encodeURIComponent(domain)}/price${query}`,
    {
      headers: {
        Authorization: `Bearer ${env.VERCEL_API_TOKEN}`,
      },
    },
  );

  if (priceResponse.ok) {
    const price = (await priceResponse.json()) as {
      price?: number;
      currency?: string;
    };
    result.price = price.price;
    result.currency = price.currency;
  }

  return result;
}

async function fetchFromApiNinjas(
  domain: string,
  env: DomainSearchEnv,
): Promise<DomainSearchResult> {
  if (!env.API_NINJAS_KEY) {
    throw new Error('API Ninjas key is not configured');
  }

  const response = await fetch(
    `https://api.api-ninjas.com/v1/domain?domain=${encodeURIComponent(domain)}`,
    {
      headers: {
        'X-Api-Key': env.API_NINJAS_KEY,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`API Ninjas error: ${response.statusText}`);
  }

  const payload = (await response.json()) as { available?: boolean };
  return {
    domain,
    available: payload.available === true,
  };
}

async function fetchFromRapidApi(
  domain: string,
  env: DomainSearchEnv,
): Promise<DomainSearchResult> {
  if (!env.RAPIDAPI_KEY) {
    throw new Error('RapidAPI key is not configured');
  }

  const host = env.RAPIDAPI_HOST ?? 'domains-api.p.rapidapi.com';
  const response = await fetch(
    `https://${host}/domains/${encodeURIComponent(domain)}?mode=standard`,
    {
      headers: {
        'X-RapidAPI-Key': env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': host,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`RapidAPI error: ${response.statusText}`);
  }

  const payload = (await response.json()) as {
    availability?: string;
    available?: boolean;
  };

  return {
    domain,
    available:
      payload.availability === 'available' ||
      (payload.available === true && payload.availability !== 'taken'),
  };
}

async function defaultAvailabilityFetcher(
  provider: AvailabilityProvider,
  domain: string,
  env: DomainSearchEnv,
) {
  switch (provider) {
    case 'vercel':
      return fetchFromVercel(domain, env);
    case 'apininjas':
      return fetchFromApiNinjas(domain, env);
    case 'rapidapi':
      return fetchFromRapidApi(domain, env);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function defaultTldFetcher(env: DomainSearchEnv) {
  if (!env.VERCEL_API_TOKEN) {
    return DEFAULT_TLDS;
  }

  const query = env.VERCEL_TEAM_ID
    ? `?teamId=${encodeURIComponent(env.VERCEL_TEAM_ID)}`
    : '';
  const response = await fetch(
    `https://api.vercel.com/v1/registrar/tlds/supported${query}`,
    {
      headers: {
        Authorization: `Bearer ${env.VERCEL_API_TOKEN}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Vercel TLD error: ${response.statusText}`);
  }

  const payload = (await response.json()) as string[];
  return Array.isArray(payload)
    ? payload.map((tld) => tld.replace(/^\./, ''))
    : DEFAULT_TLDS;
}

export async function getDomainAvailability(
  options: GetDomainAvailabilityOptions,
): Promise<DomainSearchResult> {
  const domain = options.domain.trim().toLowerCase();
  const cacheKey = getDomainCacheKey(domain);
  const now = new Date(options.now ?? new Date().toISOString());
  const cached = parseJson<CachedDomainLookup>(await options.cache.get(cacheKey));

  if (cached && isFresh(cached.expiresAt, now)) {
    return cached.result;
  }

  const fetcher = options.fetcher ?? defaultAvailabilityFetcher;
  const providers = options.fetcher
    ? options.providers ?? ['vercel', 'apininjas', 'rapidapi']
    : getEnabledProviders(options.env, options.providers);
  let result: DomainSearchResult = { domain, available: false };

  for (const provider of providers) {
    try {
      result = await fetcher(provider, domain, options.env);
      break;
    } catch {
      continue;
    }
  }

  await options.cache.put(
    cacheKey,
    JSON.stringify({
      result,
      expiresAt: new Date(
        now.getTime() + DOMAIN_LOOKUP_CACHE_TTL_SECONDS * 1000,
      ).toISOString(),
    } satisfies CachedDomainLookup),
    DOMAIN_LOOKUP_CACHE_TTL_SECONDS,
  );

  return result;
}

export async function getSupportedTlds(
  options: GetSupportedTldsOptions,
): Promise<string[]> {
  const now = new Date(options.now ?? new Date().toISOString());
  const cacheKey = 'domain-search:tlds';
  const cached = parseJson<CachedTlds>(await options.cache.get(cacheKey));

  if (cached && isFresh(cached.expiresAt, now)) {
    return cached.tlds;
  }

  const fetcher = options.fetcher ?? defaultTldFetcher;
  const tlds = await fetcher(options.env);

  await options.cache.put(
    cacheKey,
    JSON.stringify({
      tlds,
      expiresAt: new Date(now.getTime() + TLD_CACHE_TTL_SECONDS * 1000).toISOString(),
    } satisfies CachedTlds),
    TLD_CACHE_TTL_SECONDS,
  );

  return tlds;
}
