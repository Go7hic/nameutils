export interface Database {
  public: {
    Tables: {
      domains: {
        Row: Domain;
        Insert: DomainInsert;
        Update: DomainUpdate;
      };
      domain_tags: {
        Row: DomainTag;
        Insert: DomainTagInsert;
        Update: DomainTagUpdate;
      };
      whois_cache: {
        Row: WhoisCache;
        Insert: WhoisCacheInsert;
        Update: WhoisCacheUpdate;
      };
    };
  };
}

export interface Domain {
  id: string;
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
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DomainInsert {
  id?: string;
  domain_name: string;
  registrar?: string;
  registration_date?: string | null;
  expiration_date?: string | null;
  status?: string;
  notes?: string;
  is_favorite?: boolean;
  auto_renew?: boolean;
  price?: number | null;
  currency?: string | null;
}

export interface DomainUpdate {
  domain_name?: string;
  registrar?: string;
  registration_date?: string | null;
  expiration_date?: string | null;
  status?: string;
  notes?: string;
  is_favorite?: boolean;
  auto_renew?: boolean;
  price?: number | null;
  currency?: string | null;
}

export interface DomainTag {
  id: string;
  domain_id: string;
  tag_name: string;
  color: string;
  created_at: string;
}

export interface DomainTagInsert {
  id?: string;
  domain_id: string;
  tag_name: string;
  color?: string;
}

export interface DomainTagUpdate {
  tag_name?: string;
  color?: string;
}

export interface WhoisCache {
  id: string;
  domain_name: string;
  whois_data: WhoisData;
  user_id: string;
  cached_at: string;
  expires_at: string;
  created_at: string;
}

export interface WhoisCacheInsert {
  id?: string;
  domain_name: string;
  whois_data: WhoisData;
  user_id?: string;
  cached_at?: string;
  expires_at?: string;
}

export interface WhoisCacheUpdate {
  whois_data?: WhoisData;
  cached_at?: string;
  expires_at?: string;
}

export interface WhoisData {
  domain_name?: string;
  registrar?: string;
  creation_date?: string;
  expiration_date?: string;
  updated_date?: string;
  status?: string[];
  name_servers?: string[];
  dnssec?: string;
  registrant_name?: string;
  registrant_organization?: string;
  registrant_email?: string;
  admin_name?: string;
  admin_email?: string;
  tech_name?: string;
  tech_email?: string;
  raw_data?: string;
}

export interface DomainSearchResult {
  domain: string;
  available: boolean;
  price?: number;
  currency?: string;
}

export type DomainStatus = 'active' | 'expiring_soon' | 'expired' | 'pending';
