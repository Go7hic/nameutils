import { NextResponse } from 'next/server';

import { auth } from '../../../../auth';
import { getRequiredSessionUser } from '@/lib/server/auth/session';
import { getAppRuntimeEnv, getRequiredEnvString } from '@/lib/server/runtime/env';
import { createKvStringCache } from '@/lib/server/runtime/cache';
import { getWhoisData } from '@/lib/server/whois/service';

export async function GET(
  _request: Request,
  context: { params: Promise<{ domain: string }> },
) {
  try {
    const [{ domain }, session, env] = await Promise.all([
      context.params,
      auth(),
      getAppRuntimeEnv(),
    ]);
    getRequiredSessionUser(session);

    const whois = await getWhoisData({
      domainName: decodeURIComponent(domain),
      apiKey: getRequiredEnvString(env, 'API_NINJAS_KEY'),
      cache: createKvStringCache(env.CACHE),
    });

    return NextResponse.json(whois);
  } catch (error) {
    if (error instanceof Error) {
      const status = error.message === 'Authentication required' ? 401 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
