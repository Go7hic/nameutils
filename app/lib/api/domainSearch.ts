import type { DomainSearchResult } from '../../types/database';
import { requestJson } from './http';

// Use Next.js API routes instead of Edge Function
const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

/**
 * 检查域名可用性（统一入口，支持多提供者降级）
 * 
 * @param domain 要查询的域名
 * @param vercelToken Vercel API token（可选）
 * @param teamId Vercel team ID（可选）
 * @returns 域名查询结果
 */
export async function checkDomainAvailability(
  domain: string,
  _vercelToken?: string,
  _teamId?: string
): Promise<DomainSearchResult> {
  return requestJson<DomainSearchResult>(
    `${API_BASE_URL}/api/domain-search?domain=${encodeURIComponent(domain)}`,
  );
}

export async function bulkCheckDomainAvailability(
  baseName: string,
  extensions: string[],
  _vercelToken?: string,
  _teamId?: string
): Promise<DomainSearchResult[]> {
  const promises = extensions.map(ext => {
    const fullDomain = `${baseName}.${ext}`;
    return checkDomainAvailability(fullDomain);
  });

  return Promise.all(promises);
}

export function generateDomainSuggestions(baseName: string): string[] {
  const prefixes = ['get', 'try', 'my', 'use', 'go'];
  const suffixes = ['app', 'hq', 'io', 'hub', 'pro', 'online', 'site'];

  const suggestions: string[] = [];

  prefixes.forEach(prefix => {
    suggestions.push(`${prefix}${baseName}`);
  });

  suffixes.forEach(suffix => {
    suggestions.push(`${baseName}${suffix}`);
  });

  suggestions.push(`${baseName}s`);
  suggestions.push(`the${baseName}`);

  return suggestions;
}

export async function getSupportedTLDs(
  _vercelToken?: string,
  _teamId?: string
): Promise<string[]> {
  try {
    const data = await requestJson<string[]>(`${API_BASE_URL}/api/domain-search/tlds`);

    if (Array.isArray(data)) {
      return data.map((tld: string) => tld.replace(/^\./, ''));
    }

    return popularExtensions;
  } catch (error) {
    console.error('Error fetching supported TLDs:', error);
    return popularExtensions;
  }
}

export const popularExtensions = [
  'com', 'net', 'org', 'io', 'co', 'dev', 'app',
  'tech', 'online', 'site', 'store', 'blog', 'info'
];

// TLD 优先级，用于排序
const tldPriority: Record<string, number> = {
  'com': 1,
  'net': 2,
  'org': 3,
  'io': 4,
  'co': 5,
  'dev': 6,
  'app': 7,
};

/**
 * 解析域名输入，判断是否包含明确后缀
 */
export function parseDomainInput(input: string): { baseName: string; hasTLD: boolean; tld?: string; fullDomain?: string } {
  const trimmed = input.trim().toLowerCase();
  const parts = trimmed.split('.');
  
  // 检查是否包含明确后缀（至少两部分，且最后一部分长度 >= 2）
  if (parts.length >= 2 && parts[parts.length - 1].length >= 2) {
    const tld = parts[parts.length - 1];
    const baseName = parts.slice(0, -1).join('.');
    return { 
      baseName, 
      hasTLD: true, 
      tld,
      fullDomain: trimmed
    };
  }
  
  // 无后缀
  return { baseName: trimmed, hasTLD: false };
}

/**
 * 获取相关域名建议（当输入明确后缀时）
 */
export function getRelatedDomainSuggestions(baseName: string, excludeTLD?: string): string[] {
  const commonTLDs = ['com', 'net', 'org', 'io', 'co', 'dev', 'app', 'tech', 'online', 'site'];
  
  return commonTLDs
    .filter(tld => tld !== excludeTLD)
    .map(tld => `${baseName}.${tld}`);
}

/**
 * 从结果中筛选 Top Results（前 4 个最相关的结果）
 * 优先级：可用域名 > 不可用域名
 * 相同状态按 TLD 优先级排序
 */
export function getTopResults(results: DomainSearchResult[]): DomainSearchResult[] {
  // 按优先级排序
  const sorted = [...results].sort((a, b) => {
    // 优先显示可用域名
    if (a.available !== b.available) {
      return a.available ? -1 : 1;
    }
    
    // 相同状态，按 TLD 优先级排序
    const tldA = a.domain.split('.').pop() || '';
    const tldB = b.domain.split('.').pop() || '';
    const priorityA = tldPriority[tldA] || 999;
    const priorityB = tldPriority[tldB] || 999;
    
    return priorityA - priorityB;
  });
  
  // 返回前 4 个
  return sorted.slice(0, 4);
}
