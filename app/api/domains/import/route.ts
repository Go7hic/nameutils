import { NextResponse } from 'next/server';

import { auth } from '../../../../auth';
import { getRequiredSessionUser } from '@/lib/server/auth/session';
import { createD1DomainStore } from '@/lib/server/d1/stores';
import { importDomainsForUser, type DomainRecord } from '@/lib/server/domains/service';
import { getAppRuntimeEnv } from '@/lib/server/runtime/env';
import type { Domain, DomainInsert } from '@/types/database';

function toDomainResponse(domain: DomainRecord): Domain {
  return {
    id: domain.id,
    user_id: domain.userId,
    domain_name: domain.domainName,
    registrar: domain.registrar,
    registration_date: domain.registrationDate,
    expiration_date: domain.expirationDate,
    status: domain.status,
    notes: domain.notes,
    is_favorite: domain.isFavorite,
    auto_renew: domain.autoRenew,
    price: domain.price,
    currency: domain.currency,
    created_at: domain.createdAt,
    updated_at: domain.updatedAt,
  };
}

function toErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === 'Authentication required') {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof Error) {
    const status = error.message.includes('已经添加过了') ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const [session, env, payload] = await Promise.all([
      auth(),
      getAppRuntimeEnv(),
      request.json() as Promise<{ domains?: DomainInsert[] }>,
    ]);
    const user = getRequiredSessionUser(session);
    const domains = await importDomainsForUser(
      createD1DomainStore(env.DB),
      user.id,
      payload.domains ?? [],
    );

    return NextResponse.json(domains.map(toDomainResponse), { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
