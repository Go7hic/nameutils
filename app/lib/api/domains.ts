import { supabase } from '../supabase';
import type { Domain, DomainInsert, DomainUpdate } from '../../types/database';

export async function getAllDomains(): Promise<Domain[]> {
  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getDomainById(id: string): Promise<Domain | null> {
  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getDomainByName(domainName: string): Promise<Domain | null> {
  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .eq('domain_name', domainName)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getUserDomainByName(domainName: string): Promise<Domain | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .eq('domain_name', domainName)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createDomain(domain: DomainInsert): Promise<Domain> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // 检查当前用户是否已经添加过这个域名
  const existingDomain = await getUserDomainByName(domain.domain_name);
  if (existingDomain) {
    throw new Error(`域名 ${domain.domain_name} 你已经添加过了`);
  }

  const { data, error } = await supabase
    .from('domains')
    .insert({ ...domain, user_id: user.id } as any)
    .select()
    .single();

  if (error) {
    // 如果是唯一约束错误，说明当前用户已经添加过这个域名
    if (error.code === '23505') {
      throw new Error(`域名 ${domain.domain_name} 你已经添加过了`);
    }
    throw error;
  }
  return data;
}

export async function updateDomain(id: string, updates: DomainUpdate): Promise<Domain> {
  const { data, error } = await supabase
    .from('domains')
    // @ts-ignore - Supabase type inference issue with Database types
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDomain(id: string): Promise<void> {
  const { error } = await supabase
    .from('domains')
    .delete()
    .eq('id', id);

  if (error) throw error;
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // 获取当前用户已经添加过的域名
  const { data: existingDomains, error: fetchError } = await supabase
    .from('domains')
    .select('domain_name')
    .eq('user_id', user.id);

  if (fetchError) throw fetchError;

  const existingDomainNames = new Set(
    (existingDomains || []).map((d: { domain_name: string }) => d.domain_name.toLowerCase())
  );

  // 过滤掉当前用户已经添加过的域名
  const newDomains = domains.filter(domain => {
    const domainName = domain.domain_name.toLowerCase();
    return !existingDomainNames.has(domainName);
  });

  if (newDomains.length === 0) {
    throw new Error('所有域名你都已经添加过了');
  }

  const domainsWithUserId = newDomains.map(domain => ({
    ...domain,
    user_id: user.id,
  }));

  const { data, error } = await supabase
    .from('domains')
    .insert(domainsWithUserId as any)
    .select();

  if (error) throw error;
  
  return data || [];
}