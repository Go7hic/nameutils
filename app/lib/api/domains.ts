import { requestJson } from './http';
import type { Domain, DomainInsert, DomainUpdate } from '../../types/database';

export async function getAllDomains(): Promise<Domain[]> {
  return requestJson<Domain[]>('/api/domains');
}

export async function getDomainById(id: string): Promise<Domain | null> {
  return requestJson<Domain>(`/api/domains/${id}`);
}

export async function getUserDomainByName(domainName: string): Promise<Domain | null> {
  const domains = await getAllDomains();
  return domains.find((domain) => domain.domain_name === domainName) ?? null;
}

export async function createDomain(domain: DomainInsert): Promise<Domain> {
  return requestJson<Domain>('/api/domains', {
    method: 'POST',
    body: JSON.stringify(domain),
  });
}

export async function updateDomain(id: string, updates: DomainUpdate): Promise<Domain> {
  return requestJson<Domain>(`/api/domains/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteDomain(id: string): Promise<void> {
  await requestJson<{ success: true }>(`/api/domains/${id}`, {
    method: 'DELETE',
  });
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<Domain> {
  return updateDomain(id, { is_favorite: isFavorite });
}

export async function updateDomainStatus(id: string, status: string): Promise<Domain> {
  return updateDomain(id, { status });
}

export function calculateDaysUntilExpiration(expirationDate: string | null): number | null {
  if (!expirationDate) return null;

  const expDate = new Date(expirationDate);
  const today = new Date();
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

export function getStatusFromExpirationDate(expirationDate: string | null): string {
  if (!expirationDate) return 'active';

  const daysUntilExpiration = calculateDaysUntilExpiration(expirationDate);
  if (daysUntilExpiration === null) return 'active';

  if (daysUntilExpiration < 0) return 'expired';
  if (daysUntilExpiration <= 30) return 'expiring_soon';
  return 'active';
}

export async function createDomainsBatch(domains: DomainInsert[]): Promise<Domain[]> {
  return requestJson<Domain[]>('/api/domains/import', {
    method: 'POST',
    body: JSON.stringify({ domains }),
  });
}
