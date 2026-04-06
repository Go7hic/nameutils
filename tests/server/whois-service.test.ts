import { describe, expect, it, vi } from 'vitest';

import { getWhoisData } from '@/lib/server/whois/service';

describe('getWhoisData', () => {
  it('returns cached WHOIS data when the KV entry is still fresh', async () => {
    const fetcher = vi.fn();

    const value = await getWhoisData({
      domainName: 'example.com',
      apiKey: 'secret',
      cache: {
        async get() {
          return JSON.stringify({
            whois: { registrar: 'Cloudflare' },
            expiresAt: '2026-04-10T00:00:00.000Z',
          });
        },
        async put() {
          throw new Error('put should not be called');
        },
      },
      now: '2026-04-06T00:00:00.000Z',
      fetcher,
    });

    expect(value).toEqual({ registrar: 'Cloudflare' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('fetches and re-caches WHOIS data when cache is missing or expired', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      registrar: 'Updated Registrar',
      expiration_date: '2027-01-01',
    });
    const puts: Array<{ key: string; value: string; ttl: number }> = [];

    const value = await getWhoisData({
      domainName: 'example.com',
      apiKey: 'secret',
      cache: {
        async get() {
          return JSON.stringify({
            whois: { registrar: 'Old Registrar' },
            expiresAt: '2026-04-01T00:00:00.000Z',
          });
        },
        async put(key, value, ttl) {
          puts.push({ key, value, ttl });
        },
      },
      now: '2026-04-06T00:00:00.000Z',
      fetcher,
    });

    expect(value).toEqual({
      registrar: 'Updated Registrar',
      expiration_date: '2027-01-01',
    });
    expect(fetcher).toHaveBeenCalledWith('example.com', 'secret');
    expect(puts).toHaveLength(1);
    expect(puts[0]?.key).toBe('whois:example.com');
    expect(puts[0]?.ttl).toBe(60 * 60 * 24 * 7);
  });
});
