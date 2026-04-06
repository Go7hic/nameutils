import { NextResponse } from 'next/server';

import { auth } from '../../../../auth';
import { getRequiredSessionUser } from '@/lib/server/auth/session';
import { getSupportedTlds } from '@/lib/server/domain-search/service';
import { getAppRuntimeEnv } from '@/lib/server/runtime/env';
import { createKvStringCache } from '@/lib/server/runtime/cache';

export async function GET() {
  try {
    const [session, env] = await Promise.all([auth(), getAppRuntimeEnv()]);
    getRequiredSessionUser(session);

    const tlds = await getSupportedTlds({
      cache: createKvStringCache(env.CACHE),
      env,
    });

    return NextResponse.json(tlds);
  } catch (error) {
    if (error instanceof Error) {
      const status = error.message === 'Authentication required' ? 401 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
