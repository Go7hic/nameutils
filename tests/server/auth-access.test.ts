import { describe, expect, it } from 'vitest';

import { getSessionRedirectPath } from '@/lib/server/auth/access';

describe('getSessionRedirectPath', () => {
  it('redirects unauthenticated users away from protected pages', () => {
    expect(getSessionRedirectPath(null, 'protected')).toBe('/login');
  });

  it('allows authenticated users to stay on protected pages', () => {
    expect(
      getSessionRedirectPath(
        {
          user: {
            id: 'user-1',
            email: 'hello@example.com',
          },
          expires: '2026-04-07T00:00:00.000Z',
        },
        'protected',
      ),
    ).toBeNull();
  });

  it('redirects authenticated users away from guest-only pages', () => {
    expect(
      getSessionRedirectPath(
        {
          user: {
            id: 'user-1',
            email: 'hello@example.com',
          },
          expires: '2026-04-07T00:00:00.000Z',
        },
        'guest',
      ),
    ).toBe('/dashboard');
  });

  it('allows signed-out users to stay on guest-only pages', () => {
    expect(getSessionRedirectPath(null, 'guest')).toBeNull();
  });
});
