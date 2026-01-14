import { supabase } from '../supabase';
import type { WhoisData, WhoisCache, WhoisCacheInsert } from '../../types/database';

const WHOIS_API_URL = 'https://api.api-ninjas.com/v1/whois';
const CACHE_DURATION_DAYS = 7;

export async function getWhoisData(domainName: string, apiKey?: string): Promise<WhoisData> {
  const cachedData = await getCachedWhoisData(domainName);

  if (cachedData && !isCacheExpired(cachedData)) {
    return cachedData.whois_data;
  }

  if (!apiKey) {
    throw new Error('WHOIS API key is required for fresh lookups');
  }

  const whoisData = await fetchWhoisFromAPI(domainName, apiKey);

  await cacheWhoisData(domainName, whoisData);

  return whoisData;
}

async function fetchWhoisFromAPI(domainName: string, apiKey: string): Promise<WhoisData> {
  const response = await fetch(`${WHOIS_API_URL}?domain=${encodeURIComponent(domainName)}`, {
    headers: {
      'X-Api-Key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`WHOIS API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data as WhoisData;
}

async function getCachedWhoisData(domainName: string): Promise<WhoisCache | null> {
  const { data, error } = await supabase
    .from('whois_cache')
    .select('*')
    .eq('domain_name', domainName)
    .maybeSingle();

  if (error) {
    console.error('Error fetching cached WHOIS data:', error);
    return null;
  }

  return data;
}

async function cacheWhoisData(domainName: string, whoisData: WhoisData): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.warn('User not authenticated, skipping WHOIS cache');
    return;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CACHE_DURATION_DAYS);

  const cacheData: WhoisCacheInsert = {
    domain_name: domainName,
    whois_data: whoisData,
    user_id: user.id,
    cached_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  const { error } = await (supabase
    .from('whois_cache') as any)
    .upsert(cacheData, {
      onConflict: 'domain_name',
    });

  if (error) {
    console.error('Error caching WHOIS data:', error);
  }
}

function isCacheExpired(cache: WhoisCache): boolean {
  const expiresAt = new Date(cache.expires_at);
  const now = new Date();
  return now > expiresAt;
}

export async function clearExpiredCache(): Promise<void> {
  const { error } = await supabase
    .from('whois_cache')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Error clearing expired cache:', error);
  }
}
