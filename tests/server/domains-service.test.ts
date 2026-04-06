import { describe, expect, it } from 'vitest';

import {
  createDomainForUser,
  importDomainsForUser,
  type DomainRecord,
  type DomainStore,
} from '@/lib/server/domains/service';

class InMemoryDomainStore implements DomainStore {
  constructor(private readonly domains: DomainRecord[] = []) {}

  async listByUserId(userId: string) {
    return this.domains.filter((domain) => domain.userId === userId);
  }

  async findById(id: string) {
    return this.domains.find((domain) => domain.id === id) ?? null;
  }

  async findByNameForUser(userId: string, domainName: string) {
    return (
      this.domains.find(
        (domain) => domain.userId === userId && domain.domainName === domainName,
      ) ?? null
    );
  }

  async create(input: Omit<DomainRecord, 'createdAt' | 'updatedAt'>) {
    const record: DomainRecord = {
      ...input,
      createdAt: '2026-04-06T10:00:00.000Z',
      updatedAt: '2026-04-06T10:00:00.000Z',
    };
    this.domains.push(record);
    return record;
  }

  async update(id: string, updates: Partial<DomainRecord>) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('not found');
    }

    const next = {
      ...existing,
      ...updates,
      updatedAt: '2026-04-06T11:00:00.000Z',
    };
    const index = this.domains.findIndex((domain) => domain.id === id);
    this.domains[index] = next;
    return next;
  }

  async delete(id: string) {
    const index = this.domains.findIndex((domain) => domain.id === id);
    if (index !== -1) {
      this.domains.splice(index, 1);
    }
  }
}

describe('domains service', () => {
  it('rejects duplicate domains for the same user', async () => {
    const store = new InMemoryDomainStore([
      {
        id: 'domain-1',
        userId: 'user-1',
        domainName: 'example.com',
        registrar: '',
        registrationDate: null,
        expirationDate: null,
        status: 'active',
        notes: '',
        isFavorite: false,
        autoRenew: false,
        price: null,
        currency: 'USD',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
    ]);

    await expect(
      createDomainForUser(store, 'user-1', {
        domain_name: 'Example.com',
      }),
    ).rejects.toThrow('域名 example.com 你已经添加过了');
  });

  it('allows the same domain for different users and stamps the owning user', async () => {
    const store = new InMemoryDomainStore();

    const domain = await createDomainForUser(store, 'user-2', {
      domain_name: 'Example.com',
      registrar: 'Cloudflare Registrar',
    });

    expect(domain).toMatchObject({
      userId: 'user-2',
      domainName: 'example.com',
      registrar: 'Cloudflare Registrar',
    });
  });

  it('imports only domains that are new for the current user', async () => {
    const store = new InMemoryDomainStore([
      {
        id: 'domain-1',
        userId: 'user-1',
        domainName: 'existing.com',
        registrar: '',
        registrationDate: null,
        expirationDate: null,
        status: 'active',
        notes: '',
        isFavorite: false,
        autoRenew: false,
        price: null,
        currency: 'USD',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
    ]);

    const imported = await importDomainsForUser(store, 'user-1', [
      { domain_name: 'existing.com' },
      { domain_name: 'new.com', registrar: 'Cloudflare Registrar' },
      { domain_name: 'NEW.com', registrar: 'Cloudflare Registrar' },
    ]);

    expect(imported).toHaveLength(1);
    expect(imported[0]).toMatchObject({
      userId: 'user-1',
      domainName: 'new.com',
    });
  });
});
