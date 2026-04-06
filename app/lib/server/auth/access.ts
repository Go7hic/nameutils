import type { Session } from 'next-auth';

export type SessionAccessMode = 'protected' | 'guest';

export function getSessionRedirectPath(
  session: Session | null | undefined,
  mode: SessionAccessMode,
): string | null {
  const isAuthenticated = Boolean(session?.user?.id);

  if (mode === 'protected') {
    return isAuthenticated ? null : '/login';
  }

  return isAuthenticated ? '/dashboard' : null;
}
