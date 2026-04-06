import { NextResponse } from 'next/server';

import { auth } from '../../../../auth';
import { getRequiredSessionUser } from '@/lib/server/auth/session';
import { createD1DomainStore } from '@/lib/server/d1/stores';
import {
  deleteDomainForUser,
  getDomainForUser,
  toggleFavoriteForUser,
  updateDomainForUser,
  type DomainRecord,
} from '@/lib/server/domains/service';
import { getAppRuntimeEnv } from '@/lib/server/runtime/env';
import type { Domain, DomainUpdate } from '@/types/database';

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
    const status =
      error.message === 'Domain not found'
        ? 404
        : error.message.includes('已经添加过了') || error.message.includes('required')
          ? 400
          : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const [{ id }, session, env] = await Promise.all([
      context.params,
      auth(),
      getAppRuntimeEnv(),
    ]);
    const user = getRequiredSessionUser(session);
    const domain = await getDomainForUser(createD1DomainStore(env.DB), user.id, id);

    return NextResponse.json(toDomainResponse(domain));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const [{ id }, session, env, payload] = await Promise.all([
      context.params,
      auth(),
      getAppRuntimeEnv(),
      request.json() as Promise<DomainUpdate>,
    ]);
    const user = getRequiredSessionUser(session);
    const store = createD1DomainStore(env.DB);
    const updates =
      payload.is_favorite !== undefined && Object.keys(payload).length === 1
        ? await toggleFavoriteForUser(store, user.id, id, payload.is_favorite)
        : await updateDomainForUser(store, user.id, id, payload);

    return NextResponse.json(toDomainResponse(updates));
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const [{ id }, session, env] = await Promise.all([
      context.params,
      auth(),
      getAppRuntimeEnv(),
    ]);
    const user = getRequiredSessionUser(session);

    await deleteDomainForUser(createD1DomainStore(env.DB), user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
