# NameUtils

NameUtils is a personal domain portfolio manager built with Next.js 16 and deployed on Cloudflare.

> Demo: https://nameutils.com

## Features

- Google sign-in
- Domain portfolio management
- Domain availability lookup
- JSON, CSV, and image-based import
- English and Chinese interface

## Tech Stack

- Framework: Next.js 16
- Auth: Auth.js / NextAuth + Google
- Database: Cloudflare D1
- Cache: Cloudflare KV
- Object storage: Cloudflare R2
- Deployment: OpenNext on Cloudflare Workers
- Styling: Tailwind CSS

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Create local env files:

```bash
cp .dev.vars.example .dev.vars
```

3. Fill in the required values:

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `VERCEL_API_TOKEN`
- `VERCEL_TEAM_ID`
- `API_NINJAS_KEY`
- `RAPIDAPI_KEY`
- `RAPIDAPI_HOST`

4. Start the app:

```bash
pnpm dev
```

5. Regenerate types after changing routes or Cloudflare bindings:

```bash
pnpm exec next typegen
pnpm cf:typegen
```

## Cloudflare Setup

1. Create the required resources:

```bash
pnpm wrangler d1 create nameutils
pnpm wrangler kv namespace create nameutils
pnpm wrangler r2 bucket create nameutils-migration-assets
```

2. Update `wrangler.jsonc` with the generated D1 and KV IDs.

3. Apply the database schema:

```bash
pnpm wrangler d1 migrations apply nameutils --remote
```

4. Add the required Cloudflare secrets:

```bash
pnpm wrangler secret put AUTH_SECRET
pnpm wrangler secret put AUTH_GOOGLE_ID
pnpm wrangler secret put AUTH_GOOGLE_SECRET
pnpm wrangler secret put VERCEL_API_TOKEN
pnpm wrangler secret put VERCEL_TEAM_ID
pnpm wrangler secret put API_NINJAS_KEY
pnpm wrangler secret put RAPIDAPI_KEY
pnpm wrangler secret put RAPIDAPI_HOST
```

5. Build and preview:

```bash
pnpm build:cloudflare
pnpm preview:cloudflare
```

6. Deploy:

```bash
pnpm deploy:cloudflare
```

## Verification

- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `pnpm build:cloudflare`

## Migration Guide

This project was migrated from Supabase to Cloudflare. The migration notes, data import flow, and cutover checklist live here:

- [Supabase to Cloudflare Migration Guide](./docs/migration/README.md)

## License

This project is licensed for personal and non-commercial use only. You may not use this software for any commercial purposes without explicit written permission from the author.

Copyright (c) 2026 NameUtils. All rights reserved.
