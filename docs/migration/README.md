# Supabase to Cloudflare Migration Guide

This document records the one-time migration from Supabase to Cloudflare for NameUtils.

## Migration Summary

- Frontend stays on Next.js
- Authentication moved from Supabase Auth to Auth.js + Google
- Primary data moved from Supabase Postgres to Cloudflare D1
- Cache moved to Cloudflare KV
- Migration inputs, reports, and backups moved to Cloudflare R2

## Data Mapping

### Old platform

- Supabase Auth users
- `domains`
- `domain_tags`
- `whois_cache`

### New platform

- `users` in D1
- `domains` in D1
- `domain_tags` in D1
- WHOIS cache in KV

`whois_cache` is no longer treated as primary data and is not imported into D1.

## Required Cloudflare Resources

- 1 D1 database
- 1 KV namespace
- 1 R2 bucket
- 1 Worker deployment for the Next.js app

## Auth Changes

- Google OAuth callback:

```text
https://nameutils.com/api/auth/callback/google
```

- Optional additional callbacks:

```text
https://www.nameutils.com/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

## Migration Inputs

Depending on the export you have, use one of these two paths:

### Full Supabase export

Use:

- old user ID to email mapping
- `domains` export
- `domain_tags` export

Generate import artifacts:

```bash
node scripts/prepare-supabase-import.mjs \
  --user-map ./exports/user-id-map.json \
  --domains ./exports/domains.json \
  --domain-tags ./exports/domain-tags.json \
  --out-dir ./migration-artifacts
```

### App-level domain export

Use this when you only have exported domain lists from the old app.

Generate import artifacts:

```bash
node scripts/prepare-domain-export-import.mjs \
  --email you@example.com \
  --export ./domains_export.json \
  --export "./domains_export (1).json" \
  --export "./domains_export (2).json" \
  --export "./domains_export (3).json" \
  --out-dir ./migration-artifacts/domain-export-import
```

This flow merges duplicate rows, keeps the most complete record for each domain, and generates a D1-ready SQL import file.

## Generated Artifacts

The migration scripts produce:

- `users.json`
- `domains.json`
- `domain-tags.json`
- `migration-report.json`
- `d1-import.sql`

Some flows also produce:

- `merge-details.json`

## Import into D1

1. Apply the schema:

```bash
pnpm wrangler d1 migrations apply nameutils --remote
```

2. Import the generated SQL:

```bash
pnpm wrangler d1 execute nameutils --remote --file=./migration-artifacts/d1-import.sql
```

If you used the app-level export flow, replace the path with the generated directory you chose.

## Backup to R2

After review, you can upload the migration files to R2 for record keeping:

```bash
pnpm wrangler r2 object put nameutils-migration-assets/migration-report.json --remote --file=./migration-artifacts/migration-report.json
pnpm wrangler r2 object put nameutils-migration-assets/d1-import.sql --remote --file=./migration-artifacts/d1-import.sql
```

## Post-Migration Checks

- Google login succeeds
- Protected pages require login
- The expected domains appear under the correct account
- Create, edit, delete, favorite, and import all work
- Domain search works
- WHOIS lookup works
- Repeated search and WHOIS requests hit KV cache
- No Supabase URL or public Supabase key is exposed in the browser

## Rollout Order

1. Finish migration testing in preview or staging
2. Freeze writes on the old Supabase-backed app
3. Run the final export
4. Import the final dataset into D1
5. Update secrets and production deployment
6. Verify production behavior
7. Keep the old system read-only for a short fallback period
