import { redirect } from 'next/navigation';

import { auth } from '../../auth';
import SignupPage from '../components/SignupPage';
import { getSessionRedirectPath } from '@/lib/server/auth/access';

export default async function Signup() {
  const session = await auth();
  const redirectPath = getSessionRedirectPath(session, 'guest');

  if (redirectPath) {
    redirect(redirectPath);
  }

  return <SignupPage />;
}
