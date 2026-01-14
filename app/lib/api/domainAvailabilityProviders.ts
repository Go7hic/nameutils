import type { DomainSearchResult } from '../../types/database';

const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

/**
 * 域名可用性查询提供者类型
 */
export type AvailabilityProvider = 'vercel' | 'apininjas' | 'rapidapi';

/**
 * 提供者配置
 */
interface ProviderConfig {
  name: AvailabilityProvider;
  check: (domain: string, options?: any) => Promise<DomainSearchResult>;
  enabled: boolean;
}

/**
 * Vercel API 提供者
 */
async function checkVercel(
  domain: string,
  options?: { token?: string; teamId?: string }
): Promise<DomainSearchResult> {
  const { token, teamId } = options || {};
  
  if (!token) {
    throw new Error('Vercel token is required');
  }

  const params = new URLSearchParams({
    domain: domain,
    token: token,
  });
  if (teamId) {
    params.append('teamId', teamId);
  }

  const availabilityUrl = `${API_BASE_URL}/api/vercel/availability?${params.toString()}`;
  const availabilityResponse = await fetch(availabilityUrl, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!availabilityResponse.ok) {
    const errorData = await availabilityResponse.json().catch(() => ({}));
    throw new Error(`Vercel API error: ${availabilityResponse.statusText}`);
  }

  const availabilityData = await availabilityResponse.json();
  const isAvailable = availabilityData.available === true;

  const result: DomainSearchResult = {
    domain,
    available: isAvailable,
  };

  // If domain is available, fetch price information
  if (isAvailable) {
    try {
      const priceParams = new URLSearchParams({
        domain: domain,
        token: token,
      });
      if (teamId) {
        priceParams.append('teamId', teamId);
      }
      const priceUrl = `${API_BASE_URL}/api/vercel/price?${priceParams.toString()}`;

      const priceResponse = await fetch(priceUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        result.price = priceData.price;
        result.currency = priceData.currency;
      }
    } catch (priceError) {
      console.error('Error fetching domain price:', priceError);
    }
  }

  return result;
}

/**
 * API Ninjas 提供者
 */
async function checkApiNinjas(domain: string): Promise<DomainSearchResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/apininjas/availability?domain=${encodeURIComponent(domain)}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API Ninjas error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    domain,
    available: data.available === true,
  };
}

/**
 * RapidAPI 提供者
 */
async function checkRapidAPI(domain: string): Promise<DomainSearchResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/rapidapi/availability?domain=${encodeURIComponent(domain)}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`RapidAPI error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    domain,
    available: data.available === true,
  };
}

/**
 * 统一的域名可用性查询函数
 * 按顺序尝试多个提供者，如果第一个失败则自动切换到下一个
 * 
 * @param domain 要查询的域名
 * @param options 配置选项
 * @returns 域名查询结果
 */
export async function checkDomainAvailabilityWithFallback(
  domain: string,
  options?: {
    vercelToken?: string;
    vercelTeamId?: string;
    providers?: AvailabilityProvider[];
  }
): Promise<DomainSearchResult> {
  const { vercelToken, vercelTeamId, providers = ['vercel', 'apininjas', 'rapidapi'] } = options || {};

  // 定义提供者列表
  const providerConfigs: ProviderConfig[] = [];

  if (providers.includes('vercel') && vercelToken) {
    providerConfigs.push({
      name: 'vercel',
      check: (domain) => checkVercel(domain, { token: vercelToken, teamId: vercelTeamId }),
      enabled: true,
    });
  }

  if (providers.includes('apininjas')) {
    providerConfigs.push({
      name: 'apininjas',
      check: checkApiNinjas,
      enabled: true,
    });
  }

  if (providers.includes('rapidapi')) {
    providerConfigs.push({
      name: 'rapidapi',
      check: checkRapidAPI,
      enabled: true,
    });
  }

  if (providerConfigs.length === 0) {
    console.warn('No available providers, returning unavailable');
    return {
      domain,
      available: false,
    };
  }

  // 按顺序尝试每个提供者
  let lastError: Error | null = null;

  for (const provider of providerConfigs) {
    if (!provider.enabled) {
      continue;
    }

    try {
      console.log(`Trying ${provider.name} for domain: ${domain}`);
      const result = await provider.check(domain);
      console.log(`✓ ${provider.name} succeeded for domain: ${domain}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`✗ ${provider.name} failed for domain ${domain}:`, errorMessage);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 继续尝试下一个提供者
      continue;
    }
  }

  // 所有提供者都失败了
  console.error('All providers failed for domain:', domain, lastError);
  return {
    domain,
    available: false,
  };
}
