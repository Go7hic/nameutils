# NameUtils

Your Personal Domain Management Platform built with Next.js, Supabase, and TypeScript.

> DEMO: https://nameutils.com

## Features

- Domain search and availability checking
- Domain portfolio management
- User authentication
- Internationalization (English/Chinese)

## Tech Stack

- **Framework**: Next.js 16
- **Database**: Supabase
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Deployment**: Netlify

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/Go7hic/nameutils.git
cd nameutils
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
- `GOOGLE_CLIENT_ID`: Your google client id 
- `GOOGLE_AUTH_KEY`: Your google auth key

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

- `NEXT_PUBLIC_VERCEL_API_TOKEN`: Vercel API token for domain availability checks
- `NEXT_PUBLIC_VERCEL_TEAM_ID`: Vercel team ID

- `API_NINJAS_KEY`: API Ninjas API key for domain availability fallback
- `RAPIDAPI_KEY`: RapidAPI key for domain 
- `RAPIDAPI_HOST`:  RapidAPI host (default: `domains-api.p.rapidapi.com`)

4. Run the development server:
```bash
pnpm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Netlify (Or Vercel)

### Deploy Steps

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Configure the environment variables in Netlify dashboard
4. Deploy!

The build settings are already configured in `netlify.toml`.

## Database Setup

The project uses Supabase for data persistence. To set up the database:

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the SQL script

This will create all tables, indexes, constraints, and RLS policies needed for the application.

## License

This project is licensed for personal and non-commercial use only. You may not use this software for any commercial purposes without explicit written permission from the author.

Copyright (c) 2026 NameUtils. All rights reserved.
