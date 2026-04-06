'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import { useAuth } from './providers/AuthProvider';
import { SEO } from './SEO';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title={t('auth.login.title')}
        description="Sign in to manage your domain portfolio"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Globe className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('auth.login.title')}</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <p className="text-sm text-slate-600 mb-6">
              Continue with your Google account. If your email matches a migrated
              account, your existing domains will be available after sign-in.
            </p>

            <Button
              type="button"
              variant="primary"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                {t('auth.login.noAccount')}{' '}
                <button
                  onClick={() => router.push('/signup')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t('auth.login.signupLink')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
