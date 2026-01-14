/**
 * 注册平台配置
 */
export interface RegistrationPlatform {
  name: string;
  url: (domain: string) => string;
  icon?: string;
}

/**
 * 生成各个注册平台的搜索/注册链接
 */
export const registrationPlatforms: RegistrationPlatform[] = [
  {
    name: 'Cloudflare',
    url: (domain: string) => `https://www.cloudflare.com/products/registrar/?domain=${encodeURIComponent(domain)}`,
  },
  {
    name: 'Spaceship',
    url: (domain: string) => `https://www.spaceship.com/domains/search?query=${encodeURIComponent(domain)}`,
  },
  {
    name: 'Porkbun',
    url: (domain: string) => `https://porkbun.com/checkout/search?q=${encodeURIComponent(domain)}`,
  },
  {
    name: 'Namecheap',
    url: (domain: string) => `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(domain)}`,
  },
  {
    name: 'Dynadot',
    url: (domain: string) => `https://www.dynadot.com/domain/search.html?domain=${encodeURIComponent(domain)}`,
  },
];

/**
 * 获取域名的注册平台链接
 */
export interface RegistrationLink {
  name: string;
  url: string;
}

export function getRegistrationLinks(domain: string): RegistrationLink[] {
  return registrationPlatforms.map(platform => ({
    name: platform.name,
    url: platform.url(domain),
  }));
}
