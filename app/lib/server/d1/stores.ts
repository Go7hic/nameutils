import type {
  AppUserRecord,
  AppUserStore,
  PersistedAppUserInput,
} from '@/lib/server/auth/user-sync';
import type { DomainStore, DomainRecord } from '@/lib/server/domains/service';

interface UserRow {
  id: string;
  email: string;
  google_subject: string | null;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string;
}

interface DomainRow {
  id: string;
  user_id: string;
  domain_name: string;
  registrar: string;
  registration_date: string | null;
  expiration_date: string | null;
  status: string;
  notes: string;
  is_favorite: number;
  auto_renew: number;
  price: number | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
}

function mapUserRow(row: UserRow): AppUserRecord {
  return {
    id: row.id,
    email: row.email,
    googleSubject: row.google_subject,
    name: row.name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

function mapDomainRow(row: DomainRow): DomainRecord {
  return {
    id: row.id,
    userId: row.user_id,
    domainName: row.domain_name,
    registrar: row.registrar,
    registrationDate: row.registration_date,
    expirationDate: row.expiration_date,
    status: row.status,
    notes: row.notes,
    isFavorite: Boolean(row.is_favorite),
    autoRenew: Boolean(row.auto_renew),
    price: row.price,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchUserById(db: D1Database, id: string) {
  return db
    .prepare(
      `SELECT id, email, google_subject, name, avatar_url, created_at, last_login_at
       FROM users
       WHERE id = ?`,
    )
    .bind(id)
    .first<UserRow>();
}

async function fetchDomainById(db: D1Database, id: string) {
  return db
    .prepare(
      `SELECT id, user_id, domain_name, registrar, registration_date, expiration_date,
              status, notes, is_favorite, auto_renew, price, currency, created_at, updated_at
       FROM domains
       WHERE id = ?`,
    )
    .bind(id)
    .first<DomainRow>();
}

export function createD1AppUserStore(db: D1Database): AppUserStore {
  return {
    async findByEmail(email) {
      const row = await db
        .prepare(
          `SELECT id, email, google_subject, name, avatar_url, created_at, last_login_at
           FROM users
           WHERE email = ?`,
        )
        .bind(email)
        .first<UserRow>();

      return row ? mapUserRow(row) : null;
    },

    async save(input: PersistedAppUserInput) {
      const createdAt = input.createdAt ?? new Date().toISOString();

      await db
        .prepare(
          `INSERT INTO users (
             id, email, google_subject, name, avatar_url, created_at, last_login_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             email = excluded.email,
             google_subject = excluded.google_subject,
             name = excluded.name,
             avatar_url = excluded.avatar_url,
             last_login_at = excluded.last_login_at`,
        )
        .bind(
          input.id,
          input.email,
          input.googleSubject,
          input.name,
          input.avatarUrl,
          createdAt,
          input.lastLoginAt,
        )
        .run();

      const row = await fetchUserById(db, input.id);
      if (!row) {
        throw new Error('Failed to persist application user');
      }

      return mapUserRow(row);
    },
  };
}

export function createD1DomainStore(db: D1Database): DomainStore {
  return {
    async listByUserId(userId) {
      const result = await db
        .prepare(
          `SELECT id, user_id, domain_name, registrar, registration_date, expiration_date,
                  status, notes, is_favorite, auto_renew, price, currency, created_at, updated_at
           FROM domains
           WHERE user_id = ?
           ORDER BY created_at DESC`,
        )
        .bind(userId)
        .all<DomainRow>();

      return (result.results ?? []).map(mapDomainRow);
    },

    async findById(id) {
      const row = await fetchDomainById(db, id);
      return row ? mapDomainRow(row) : null;
    },

    async findByNameForUser(userId, domainName) {
      const row = await db
        .prepare(
          `SELECT id, user_id, domain_name, registrar, registration_date, expiration_date,
                  status, notes, is_favorite, auto_renew, price, currency, created_at, updated_at
           FROM domains
           WHERE user_id = ? AND domain_name = ?`,
        )
        .bind(userId, domainName)
        .first<DomainRow>();

      return row ? mapDomainRow(row) : null;
    },

    async create(input) {
      const now = new Date().toISOString();

      await db
        .prepare(
          `INSERT INTO domains (
             id, user_id, domain_name, registrar, registration_date, expiration_date,
             status, notes, is_favorite, auto_renew, price, currency, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          input.id,
          input.userId,
          input.domainName,
          input.registrar,
          input.registrationDate,
          input.expirationDate,
          input.status,
          input.notes,
          input.isFavorite ? 1 : 0,
          input.autoRenew ? 1 : 0,
          input.price,
          input.currency,
          now,
          now,
        )
        .run();

      const row = await fetchDomainById(db, input.id);
      if (!row) {
        throw new Error('Failed to persist domain');
      }

      return mapDomainRow(row);
    },

    async update(id, updates) {
      const existing = await fetchDomainById(db, id);
      if (!existing) {
        throw new Error('Domain not found');
      }

      const merged = mapDomainRow(existing);
      const next: DomainRecord = {
        ...merged,
        ...Object.fromEntries(
          Object.entries(updates).filter(([, value]) => value !== undefined),
        ),
        updatedAt: new Date().toISOString(),
      };

      await db
        .prepare(
          `UPDATE domains
           SET domain_name = ?, registrar = ?, registration_date = ?, expiration_date = ?,
               status = ?, notes = ?, is_favorite = ?, auto_renew = ?, price = ?, currency = ?,
               updated_at = ?
           WHERE id = ?`,
        )
        .bind(
          next.domainName,
          next.registrar,
          next.registrationDate,
          next.expirationDate,
          next.status,
          next.notes,
          next.isFavorite ? 1 : 0,
          next.autoRenew ? 1 : 0,
          next.price,
          next.currency,
          next.updatedAt,
          id,
        )
        .run();

      const row = await fetchDomainById(db, id);
      if (!row) {
        throw new Error('Failed to update domain');
      }

      return mapDomainRow(row);
    },

    async delete(id) {
      await db.prepare('DELETE FROM domains WHERE id = ?').bind(id).run();
    },
  };
}
