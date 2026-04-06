import NextAuth, { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

import { createD1AppUserStore } from './app/lib/server/d1/stores';
import { upsertAppUserFromGoogleProfile } from './app/lib/server/auth/user-sync';
import { getAppRuntimeEnv, getRequiredEnvString } from './app/lib/server/runtime/env';

const authConfig = async (): Promise<NextAuthConfig> => {
  const env = await getAppRuntimeEnv();

  return {
    secret: getRequiredEnvString(env, 'AUTH_SECRET'),
    trustHost: true,
    pages: {
      signIn: '/login',
    },
    session: {
      strategy: 'jwt',
    },
    providers: [
      Google({
        clientId: getRequiredEnvString(env, 'AUTH_GOOGLE_ID'),
        clientSecret: getRequiredEnvString(env, 'AUTH_GOOGLE_SECRET'),
      }),
    ],
    callbacks: {
      async signIn({ profile }) {
        if (!profile?.email) {
          return false;
        }

        if ('email_verified' in profile && profile.email_verified === false) {
          return false;
        }

        return true;
      },

      async jwt({ token, account }) {
        if (!token.email) {
          return token;
        }

        if (!token.appUserId || account?.provider === 'google') {
          const googleSubject =
            account?.provider === 'google'
              ? account.providerAccountId
              : typeof token.googleSubject === 'string'
                ? token.googleSubject
                : null;
          const user = await upsertAppUserFromGoogleProfile(
            createD1AppUserStore(env.DB),
            {
              email: token.email,
              googleSubject,
              name: typeof token.name === 'string' ? token.name : null,
              avatarUrl: typeof token.picture === 'string' ? token.picture : null,
            },
          );

          token.appUserId = user.id;
          token.googleSubject = user.googleSubject;
          token.email = user.email;
          token.name = user.name ?? token.name;
          token.picture = user.avatarUrl ?? token.picture;
        }

        return token;
      },

      async session({ session, token }) {
        if (session.user) {
          session.user.id =
            typeof token.appUserId === 'string' ? token.appUserId : '';
          session.user.email =
            typeof token.email === 'string' ? token.email : session.user.email;
          session.user.name =
            typeof token.name === 'string' ? token.name : session.user.name;
          session.user.image =
            typeof token.picture === 'string'
              ? token.picture
              : session.user.image;
        }

        return session;
      },
    },
  };
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
export const { GET, POST } = handlers;
