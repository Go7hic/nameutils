/*
  # NameUtils - Complete Database Schema
  # Generated from all migrations in supabase/migrations/
  # Last updated: 2026-01-14
  
  This file contains the complete database schema for the NameUtils domain management platform.
  It consolidates all migrations into a single, production-ready schema.
*/

-- ============================================================================
-- TABLES
-- ============================================================================

-- Create domains table
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text NOT NULL,
  registrar text DEFAULT '',
  registration_date date,
  expiration_date date,
  status text DEFAULT 'active',
  notes text DEFAULT '',
  is_favorite boolean DEFAULT false,
  auto_renew boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  price numeric(10, 2),
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create domain_tags table
CREATE TABLE IF NOT EXISTS domain_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

-- Create whois_cache table
CREATE TABLE IF NOT EXISTS whois_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text UNIQUE NOT NULL,
  whois_data jsonb NOT NULL,
  cached_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Unique constraint: prevent same user from adding duplicate domain
-- Allows different users to have the same domain (e.g., expired and repurchased)
CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_user_domain_unique 
ON domains(user_id, domain_name);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Indexes for domains table
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_price ON domains(price);

-- Indexes for domain_tags table
-- Note: Foreign key constraint provides lookup capability for domain_id

-- Indexes for whois_cache table
CREATE INDEX IF NOT EXISTS idx_whois_cache_user_id ON whois_cache(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE whois_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for domains table
CREATE POLICY "Users can read own domains"
  ON domains FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own domains"
  ON domains FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own domains"
  ON domains FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own domains"
  ON domains FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- RLS Policies for domain_tags table
CREATE POLICY "Users can read own domain tags"
  ON domain_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM domains
      WHERE domains.id = domain_tags.domain_id
      AND domains.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own domain tags"
  ON domain_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM domains
      WHERE domains.id = domain_tags.domain_id
      AND domains.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own domain tags"
  ON domain_tags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM domains
      WHERE domains.id = domain_tags.domain_id
      AND domains.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM domains
      WHERE domains.id = domain_tags.domain_id
      AND domains.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own domain tags"
  ON domain_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM domains
      WHERE domains.id = domain_tags.domain_id
      AND domains.user_id = (select auth.uid())
    )
  );

-- RLS Policies for whois_cache table
CREATE POLICY "Users can read own whois cache"
  ON whois_cache FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own whois cache"
  ON whois_cache FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own whois cache"
  ON whois_cache FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own whois cache"
  ON whois_cache FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Trigger for domains table
DROP TRIGGER IF EXISTS update_domains_updated_at ON domains;
CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- NOTES
-- ============================================================================

/*
  Database Schema Summary:
  
  1. Tables:
     - domains: Main table storing domain information
     - domain_tags: Tags associated with domains
     - whois_cache: Cached WHOIS data for domains
  
  2. Security:
     - All tables have RLS enabled
     - Users can only access their own data
     - Policies use optimized (select auth.uid()) for better performance
  
  3. Constraints:
     - Unique constraint on (user_id, domain_name) prevents duplicate domains per user
     - Foreign keys ensure referential integrity
     - CASCADE deletes maintain data consistency
  
  4. Indexes:
     - Optimized indexes for user_id columns (critical for RLS performance)
     - Unique constraint indexes for domain lookups
  
  5. Features:
     - Automatic updated_at timestamp via trigger
     - Multi-currency support (price + currency fields)
     - User isolation via RLS policies
*/
