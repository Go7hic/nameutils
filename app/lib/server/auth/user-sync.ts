export interface AppUserRecord {
  id: string;
  email: string;
  googleSubject: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string;
}

export type PersistedAppUserInput = Omit<AppUserRecord, 'createdAt'> & {
  createdAt?: string;
};

export interface AppUserStore {
  findByEmail(email: string): Promise<AppUserRecord | null>;
  save(input: PersistedAppUserInput): Promise<AppUserRecord>;
}

interface UpsertGoogleProfileInput {
  email: string;
  googleSubject?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  now?: string;
  idGenerator?: () => string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function upsertAppUserFromGoogleProfile(
  store: AppUserStore,
  input: UpsertGoogleProfileInput,
): Promise<AppUserRecord> {
  const email = normalizeEmail(input.email);

  if (!email) {
    throw new Error('Google profile email is required');
  }

  const now = input.now ?? new Date().toISOString();
  const existing = await store.findByEmail(email);

  return store.save({
    id: existing?.id ?? (input.idGenerator?.() ?? crypto.randomUUID()),
    email,
    googleSubject: input.googleSubject ?? existing?.googleSubject ?? null,
    name: input.name ?? existing?.name ?? null,
    avatarUrl: input.avatarUrl ?? existing?.avatarUrl ?? null,
    createdAt: existing?.createdAt ?? now,
    lastLoginAt: now,
  });
}
