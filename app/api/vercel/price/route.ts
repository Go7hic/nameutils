import { NextResponse } from 'next/server';

import { auth } from '../../../../auth';
import { getRequiredSessionUser } from '@/lib/server/auth/session';
import { getDomainAvailability } from '@/lib/server/domain-search/service';
import { createKvStringCache } from '@/lib/server/runtime/cache';
import { getAppRuntimeEnv } from '@/lib/server/runtime/env';

export async function GET(request: Request) {
  try {
    const [session, env] = await Promise.all([auth(), getAppRuntimeEnv()]);
    getRequiredSessionUser(session);

    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');
    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const result = await getDomainAvailability({
      domain,
      cache: createKvStringCache(env.CACHE),
      env,
      providers: ['vercel'],
    });

    return NextResponse.json({
      price: result.price ?? null,
      currency: result.currency ?? null,
      available: result.available,
    });
  } catch (error) {
    if (error instanceof Error) {
      const status = error.message === 'Authentication required' ? 401 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
