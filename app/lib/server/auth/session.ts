import type { Session } from 'next-auth';

export interface AuthenticatedSessionUser {
  id: string;
  email: string | null | undefined;
  name: string | null | undefined;
  image: string | null | undefined;
}

export function getRequiredSessionUser(
  session: Session | null | undefined,
): AuthenticatedSessionUser {
  const user = session?.user;

  if (!user?.id) {
    throw new Error('Authentication required');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  };
}
