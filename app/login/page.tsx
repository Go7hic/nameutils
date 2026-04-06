import { redirect } from 'next/navigation';

import { auth } from '../../auth';
import LoginPage from '../components/LoginPage';
import { getSessionRedirectPath } from '@/lib/server/auth/access';

export default async function Login() {
  const session = await auth();
  const redirectPath = getSessionRedirectPath(session, 'guest');

  if (redirectPath) {
    redirect(redirectPath);
  }

  return <LoginPage />;
}
