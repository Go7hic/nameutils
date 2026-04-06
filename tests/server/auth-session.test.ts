import { describe, expect, it } from 'vitest';

import { getRequiredSessionUser } from '@/lib/server/auth/session';

describe('getRequiredSessionUser', () => {
  it('returns the signed-in app user from the session', () => {
    const user = getRequiredSessionUser({
      user: {
        id: 'user-1',
        email: 'hello@example.com',
        name: 'Hello World',
        image: 'https://example.com/avatar.png',
      },
      expires: '2026-04-07T00:00:00.000Z',
    });

    expect(user).toEqual({
      id: 'user-1',
      email: 'hello@example.com',
      name: 'Hello World',
      image: 'https://example.com/avatar.png',
    });
  });

  it('throws when the session does not contain an application user id', () => {
    expect(() =>
      getRequiredSessionUser({
        user: {
          email: 'hello@example.com',
        },
        expires: '2026-04-07T00:00:00.000Z',
      }),
    ).toThrow('Authentication required');
  });
});
