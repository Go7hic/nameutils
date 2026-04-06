import { describe, expect, it } from 'vitest';

import { createKvStringCache } from '@/lib/server/runtime/cache';

describe('createKvStringCache', () => {
  it('returns null and ignores writes when the KV binding is unavailable', async () => {
    const cache = createKvStringCache(undefined);

    await expect(cache.get('domain:example.com')).resolves.toBeNull();
    await expect(
      cache.put('domain:example.com', '{"available":true}', 300),
    ).resolves.toBeUndefined();
  });
});
