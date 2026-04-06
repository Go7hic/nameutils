import type { DomainInsert, DomainUpdate } from '@/types/database';

export interface DomainRecord {
  id: string;
  userId: string;
  domainName: string;
  registrar: string;
  registrationDate: string | null;
  expirationDate: string | null;
  status: string;
  notes: string;
  isFavorite: boolean;
  autoRenew: boolean;
  price: number | null;
  currency: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DomainStore {
  listByUserId(userId: string): Promise<DomainRecord[]>;
  findById(id: string): Promise<DomainRecord | null>;
  findByNameForUser(userId: string, domainName: string): Promise<DomainRecord | null>;
  create(input: Omit<DomainRecord, 'createdAt' | 'updatedAt'>): Promise<DomainRecord>;
  update(id: string, updates: Partial<DomainRecord>): Promise<DomainRecord>;
  delete(id: string): Promise<void>;
}

function normalizeDomainName(domainName: string) {
  return domainName.trim().toLowerCase();
}

function buildDomainRecord(
  userId: string,
  domain: DomainInsert,
  idGenerator?: () => string,
): Omit<DomainRecord, 'createdAt' | 'updatedAt'> {
  const domainName = normalizeDomainName(domain.domain_name);

  if (!domainName) {
    throw new Error('Domain name is required');
  }

  return {
    id: domain.id ?? (idGenerator?.() ?? crypto.randomUUID()),
    userId,
    domainName,
    registrar: domain.registrar?.trim() ?? '',
    registrationDate: domain.registration_date ?? null,
    expirationDate: domain.expiration_date ?? null,
    status: domain.status ?? 'active',
    notes: domain.notes?.trim() ?? '',
    isFavorite: domain.is_favorite ?? false,
    autoRenew: domain.auto_renew ?? false,
    price: domain.price ?? null,
    currency: domain.currency ?? 'USD',
  };
}

async function assertDomainDoesNotExistForUser(
  store: DomainStore,
  userId: string,
  domainName: string,
) {
  const existing = await store.findByNameForUser(userId, domainName);
  if (existing) {
    throw new Error(`域名 ${domainName} 你已经添加过了`);
  }
}

async function getOwnedDomainOrThrow(store: DomainStore, userId: string, id: string) {
  const domain = await store.findById(id);

  if (!domain || domain.userId !== userId) {
    throw new Error('Domain not found');
  }

  return domain;
}

export async function listDomainsForUser(store: DomainStore, userId: string) {
  return store.listByUserId(userId);
}

export async function getDomainForUser(store: DomainStore, userId: string, id: string) {
  return getOwnedDomainOrThrow(store, userId, id);
}

export async function createDomainForUser(
  store: DomainStore,
  userId: string,
  domain: DomainInsert,
  options?: { idGenerator?: () => string },
) {
  const record = buildDomainRecord(userId, domain, options?.idGenerator);
  await assertDomainDoesNotExistForUser(store, userId, record.domainName);
  return store.create(record);
}

export async function updateDomainForUser(
  store: DomainStore,
  userId: string,
  id: string,
  updates: DomainUpdate,
) {
  const existing = await getOwnedDomainOrThrow(store, userId, id);
  const nextDomainName = updates.domain_name
    ? normalizeDomainName(updates.domain_name)
    : existing.domainName;

  if (nextDomainName !== existing.domainName) {
    await assertDomainDoesNotExistForUser(store, userId, nextDomainName);
  }

  return store.update(id, {
    domainName: nextDomainName,
    registrar: updates.registrar?.trim(),
    registrationDate: updates.registration_date,
    expirationDate: updates.expiration_date,
    status: updates.status,
    notes: updates.notes?.trim(),
    isFavorite: updates.is_favorite,
    autoRenew: updates.auto_renew,
    price: updates.price,
    currency: updates.currency,
  });
}

export async function deleteDomainForUser(store: DomainStore, userId: string, id: string) {
  await getOwnedDomainOrThrow(store, userId, id);
  await store.delete(id);
}

export async function toggleFavoriteForUser(
  store: DomainStore,
  userId: string,
  id: string,
  isFavorite: boolean,
) {
  await getOwnedDomainOrThrow(store, userId, id);
  return store.update(id, { isFavorite });
}

export async function importDomainsForUser(
  store: DomainStore,
  userId: string,
  domains: DomainInsert[],
  options?: { idGenerator?: () => string },
) {
  const existing = await store.listByUserId(userId);
  const existingNames = new Set(existing.map((domain) => domain.domainName));
  const seenInBatch = new Set<string>();
  const created: DomainRecord[] = [];

  for (const input of domains) {
    const normalizedDomainName = normalizeDomainName(input.domain_name ?? '');
    if (!normalizedDomainName) {
      continue;
    }

    if (existingNames.has(normalizedDomainName) || seenInBatch.has(normalizedDomainName)) {
      continue;
    }

    const record = buildDomainRecord(
      userId,
      { ...input, domain_name: normalizedDomainName },
      options?.idGenerator,
    );
    created.push(await store.create(record));
    seenInBatch.add(normalizedDomainName);
  }

  if (created.length === 0) {
    throw new Error('所有域名你都已经添加过了');
  }

  return created;
}
