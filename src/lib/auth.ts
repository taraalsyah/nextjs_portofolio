import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email dan password wajib diisi');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          throw new Error('Email atau password salah');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Email atau password salah');
        }

        // Cek status verifikasi email user
        if (user.status !== 'ACTIVE') {
          throw new Error('PENDING_VERIFICATION');
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          password: user.password,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.passwordHash = (user as any).password;
      }

      // Validasi apakah password di database masih sama (invalidation check pada semua device)
      if (token?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: parseInt(token.id as string) },
          select: { password: true },
        });

        if (!dbUser || dbUser.password !== token.passwordHash) {
          return {}; // Session ter-invalidate
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 jam
    updateAge: 5 * 60, // Perbarui token setiap 5 menit saat user aktif
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "N4UGN96dFGoDYMCJ-secret-key-tara-alsyah-portofolio",
};
export default authOptions;
