import 'server-only';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { loginSchema } from '@/lib/validation';
import { hitRateLimit } from '@/lib/rate-limit';

type DbUser = {
  id: string;
  name: string;
  password_hash: string;
  roles: string[];
  blocked: boolean;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  // Адрес сайта берётся из заголовка Host: без этого `next start` вне Vercel
  // (npm run start:local, свой сервер) отвечает UntrustedHost и вход не работает
  trustHost: true,
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { phone, password } = parsed.data;

        // Защита от прямых запросов к /api/auth (форма считает свой лимит отдельно)
        if (!(await hitRateLimit('login_api', phone))) return null;

        const [u] = await db()<DbUser[]>`
          SELECT id::text AS id, name, password_hash, roles, blocked
          FROM users WHERE phone = ${phone}
        `;
        if (!u || u.blocked) return null;
        if (!(await verifyPassword(password, u.password_hash))) return null;

        return { id: u.id, name: u.name, roles: u.roles };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles ?? [];
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = typeof token.id === 'string' ? token.id : '';
      session.user.roles = Array.isArray(token.roles) ? token.roles : [];
      return session;
    },
  },
});
