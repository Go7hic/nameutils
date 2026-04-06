import { describe, expect, it, vi } from 'vitest';

import { DOMAIN_LOOKUP_CACHE_TTL_SECONDS, getDomainAvailability, getSupportedTlds } from '@/lib/server/domain-search/service';

describe('domain search service', () => {
  it('returns a cached availability result when present', async () => {
    const fetcher = vi.fn();

    const result = await getDomainAvailability({
      domain: 'example.com',
      cache: {
        async get() {
          return JSON.stringify({
            result: { domain: 'example.com', available: true, price: 10, currency: 'USD' },
            expiresAt: '2026-04-07T00:00:00.000Z',
          });
        },
        async put() {
          throw new Error('put should not be called');
        },
      },
      env: {},
      fetcher,
      now: '2026-04-06T00:00:00.000Z',
    });

    expect(result).toEqual({
      domain: 'example.com',
      available: true,
      price: 10,
      currency: 'USD',
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('tries providers in order and caches the first successful result', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('vercel failed'))
      .mockResolvedValueOnce({ domain: 'example.com', available: false });
    const puts: Array<{ key: string; value: string; ttl: number }> = [];

    const result = await getDomainAvailability({
      domain: 'example.com',
      cache: {
        async get() {
          return null;
        },
        async put(key, value, ttl) {
          puts.push({ key, value, ttl });
        },
      },
      env: {},
      fetcher,
      now: '2026-04-06T00:00:00.000Z',
      providers: ['vercel', 'apininjas'],
    });

    expect(result).toEqual({ domain: 'example.com', available: false });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenNthCalledWith(1, 'vercel', 'example.com', {});
    expect(fetcher).toHaveBeenNthCalledWith(2, 'apininjas', 'example.com', {});
    expect(puts).toHaveLength(1);
    expect(puts[0]).toMatchObject({
      key: 'domain:example.com',
      ttl: DOMAIN_LOOKUP_CACHE_TTL_SECONDS,
    });
  });

  it('returns cached TLDs when available and fresh', async () => {
    const fetcher = vi.fn();

    const result = await getSupportedTlds({
      cache: {
        async get() {
          return JSON.stringify({
            tlds: ['com', 'net'],
            expiresAt: '2026-04-07T00:00:00.000Z',
          });
        },
        async put() {
          throw new Error('put should not be called');
        },
      },
      env: {},
      fetcher,
      now: '2026-04-06T00:00:00.000Z',
    });

    expect(result).toEqual(['com', 'net']);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
