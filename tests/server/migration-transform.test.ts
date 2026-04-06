import { describe, expect, it } from 'vitest';

import { transformSupabaseExport } from '@/lib/server/migration/transform';

describe('transformSupabaseExport', () => {
  it('maps exported Supabase domains onto app users by email', () => {
    const result = transformSupabaseExport({
      userIdToEmail: {
        'supabase-user-1': 'hello@example.com',
      },
      users: [
        {
          id: 'app-user-1',
          email: 'hello@example.com',
          googleSubject: 'google-subject-1',
          name: 'Hello World',
          avatarUrl: null,
          createdAt: '2026-04-01T00:00:00.000Z',
          lastLoginAt: '2026-04-06T00:00:00.000Z',
        },
      ],
      domains: [
        {
          id: 'domain-1',
          user_id: 'supabase-user-1',
          domain_name: 'example.com',
          registrar: 'Dynadot',
          registration_date: null,
          expiration_date: null,
          status: 'active',
          notes: '',
          is_favorite: false,
          auto_renew: false,
          price: null,
          currency: 'USD',
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
        },
      ],
      domainTags: [
        {
          id: 'tag-1',
          domain_id: 'domain-1',
          tag_name: 'favorite',
          color: '#000000',
          created_at: '2026-04-01T00:00:00.000Z',
        },
      ],
    });

    expect(result.report).toMatchObject({
      importedDomains: 1,
      skippedDomains: 0,
      importedTags: 1,
      skippedTags: 0,
    });
    expect(result.domains[0]).toMatchObject({
      userId: 'app-user-1',
      domainName: 'example.com',
    });
    expect(result.domainTags[0]).toMatchObject({
      domainId: 'domain-1',
      tagName: 'favorite',
    });
  });

  it('reports rows that cannot be matched to an application user', () => {
    const result = transformSupabaseExport({
      userIdToEmail: {
        'supabase-user-1': 'missing@example.com',
      },
      users: [],
      domains: [
        {
          id: 'domain-1',
          user_id: 'supabase-user-1',
          domain_name: 'example.com',
          registrar: 'Dynadot',
          registration_date: null,
          expiration_date: null,
          status: 'active',
          notes: '',
          is_favorite: false,
          auto_renew: false,
          price: null,
          currency: 'USD',
          created_at: '2026-04-01T00:00:00.000Z',
          updated_at: '2026-04-01T00:00:00.000Z',
        },
      ],
      domainTags: [],
    });

    expect(result.report).toMatchObject({
      importedDomains: 0,
      skippedDomains: 1,
      importedTags: 0,
      skippedTags: 0,
    });
    expect(result.skippedDomains).toEqual([
      {
        domainId: 'domain-1',
        reason: 'No application user found for email missing@example.com',
      },
    ]);
  });
});
