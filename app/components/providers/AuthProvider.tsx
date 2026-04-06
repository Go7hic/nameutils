'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SessionProvider, signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<AuthUser | null>(null);
  useEffect(() => {
    if (!session?.user?.id) {
      setUser(null);
      return;
    }

    setUser({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    });
  }, [session]);

  const signInWithGoogle = async () => {
    await nextAuthSignIn('google', {
      redirectTo: '/dashboard',
    });
  };

  const signOut = async () => {
    await nextAuthSignOut({
      redirectTo: '/',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: session ?? null,
        loading: status === 'loading',
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
