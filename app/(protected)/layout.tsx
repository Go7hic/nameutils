import { redirect } from 'next/navigation';
import { auth } from '../../auth';
import { getSessionRedirectPath } from '@/lib/server/auth/access';
import Layout from '../components/Layout';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const redirectPath = getSessionRedirectPath(session, 'protected');

  if (redirectPath) {
    redirect(redirectPath);
  }

  return <Layout>{children}</Layout>;
}
