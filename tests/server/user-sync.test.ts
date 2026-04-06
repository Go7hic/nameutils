import { describe, expect, it } from 'vitest';

import {
  type AppUserRecord,
  type AppUserStore,
  upsertAppUserFromGoogleProfile,
} from '@/lib/server/auth/user-sync';

class InMemoryAppUserStore implements AppUserStore {
  constructor(private readonly users: AppUserRecord[] = []) {}

  async findByEmail(email: string) {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async save(input: Omit<AppUserRecord, 'createdAt'> & { createdAt?: string }) {
    const existingIndex = this.users.findIndex((user) => user.id === input.id);
    const record: AppUserRecord = {
      ...input,
      createdAt: input.createdAt ?? '2026-04-06T00:00:00.000Z',
    };

    if (existingIndex === -1) {
      this.users.push(record);
    } else {
      this.users[existingIndex] = record;
    }

    return record;
  }
}

describe('upsertAppUserFromGoogleProfile', () => {
  it('creates a new application user from a Google profile', async () => {
    const store = new InMemoryAppUserStore();

    const user = await upsertAppUserFromGoogleProfile(store, {
      email: 'hello@example.com',
      googleSubject: 'google-subject-1',
      name: 'Hello World',
      avatarUrl: 'https://example.com/avatar.png',
      now: '2026-04-06T10:00:00.000Z',
      idGenerator: () => 'user-1',
    });

    expect(user).toMatchObject({
      id: 'user-1',
      email: 'hello@example.com',
      googleSubject: 'google-subject-1',
      name: 'Hello World',
      avatarUrl: 'https://example.com/avatar.png',
      lastLoginAt: '2026-04-06T10:00:00.000Z',
    });
  });

  it('updates an existing user found by email instead of creating a duplicate', async () => {
    const store = new InMemoryAppUserStore([
      {
        id: 'existing-user',
        email: 'hello@example.com',
        googleSubject: null,
        name: 'Old Name',
        avatarUrl: null,
        createdAt: '2026-04-01T00:00:00.000Z',
        lastLoginAt: '2026-04-02T00:00:00.000Z',
      },
    ]);

    const user = await upsertAppUserFromGoogleProfile(store, {
      email: 'hello@example.com',
      googleSubject: 'google-subject-2',
      name: 'New Name',
      avatarUrl: 'https://example.com/new-avatar.png',
      now: '2026-04-06T10:00:00.000Z',
      idGenerator: () => 'new-user-id',
    });

    expect(user).toMatchObject({
      id: 'existing-user',
      email: 'hello@example.com',
      googleSubject: 'google-subject-2',
      name: 'New Name',
      avatarUrl: 'https://example.com/new-avatar.png',
      createdAt: '2026-04-01T00:00:00.000Z',
      lastLoginAt: '2026-04-06T10:00:00.000Z',
    });
  });
});
