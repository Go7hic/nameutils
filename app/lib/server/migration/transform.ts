import type { AppUserRecord } from '@/lib/server/auth/user-sync';

export interface SupabaseDomainRow {
  id: string;
  user_id: string | null;
  domain_name: string;
  registrar: string;
  registration_date: string | null;
  expiration_date: string | null;
  status: string;
  notes: string;
  is_favorite: boolean;
  auto_renew: boolean;
  price: number | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseDomainTagRow {
  id: string;
  domain_id: string;
  tag_name: string;
  color: string;
  created_at: string;
}

export interface MigratedDomainRecord {
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

export interface MigratedDomainTagRecord {
  id: string;
  domainId: string;
  tagName: string;
  color: string;
  createdAt: string;
}

export interface MigrationTransformInput {
  userIdToEmail: Record<string, string>;
  users: AppUserRecord[];
  domains: SupabaseDomainRow[];
  domainTags: SupabaseDomainTagRow[];
}

export interface MigrationTransformResult {
  domains: MigratedDomainRecord[];
  domainTags: MigratedDomainTagRecord[];
  skippedDomains: Array<{ domainId: string; reason: string }>;
  report: {
    importedDomains: number;
    skippedDomains: number;
    importedTags: number;
    skippedTags: number;
  };
}

export function transformSupabaseExport(
  input: MigrationTransformInput,
): MigrationTransformResult {
  const usersByEmail = new Map(
    input.users.map((user) => [user.email.trim().toLowerCase(), user] as const),
  );
  const importedDomains: MigratedDomainRecord[] = [];
  const skippedDomains: Array<{ domainId: string; reason: string }> = [];
  const importedDomainIds = new Set<string>();

  for (const domain of input.domains) {
    const email = domain.user_id ? input.userIdToEmail[domain.user_id] : undefined;

    if (!email) {
      skippedDomains.push({
        domainId: domain.id,
        reason: `No email mapping found for Supabase user ${domain.user_id ?? 'null'}`,
      });
      continue;
    }

    const user = usersByEmail.get(email.trim().toLowerCase());
    if (!user) {
      skippedDomains.push({
        domainId: domain.id,
        reason: `No application user found for email ${email}`,
      });
      continue;
    }

    importedDomains.push({
      id: domain.id,
      userId: user.id,
      domainName: domain.domain_name.trim().toLowerCase(),
      registrar: domain.registrar,
      registrationDate: domain.registration_date,
      expirationDate: domain.expiration_date,
      status: domain.status,
      notes: domain.notes,
      isFavorite: domain.is_favorite,
      autoRenew: domain.auto_renew,
      price: domain.price,
      currency: domain.currency,
      createdAt: domain.created_at,
      updatedAt: domain.updated_at,
    });
    importedDomainIds.add(domain.id);
  }

  const importedTags = input.domainTags
    .filter((tag) => importedDomainIds.has(tag.domain_id))
    .map(
      (tag): MigratedDomainTagRecord => ({
        id: tag.id,
        domainId: tag.domain_id,
        tagName: tag.tag_name,
        color: tag.color,
        createdAt: tag.created_at,
      }),
    );

  return {
    domains: importedDomains,
    domainTags: importedTags,
    skippedDomains,
    report: {
      importedDomains: importedDomains.length,
      skippedDomains: skippedDomains.length,
      importedTags: importedTags.length,
      skippedTags: input.domainTags.length - importedTags.length,
    },
  };
}
