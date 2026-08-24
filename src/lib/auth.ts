import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { createActivityLog } from './activity';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        preAuthToken: { label: 'PreAuthToken', type: 'text' },
        is2FAVerified: { label: 'Is2FAVerified', type: 'text' },
      },
      async authorize(credentials, req) {
        const creds = credentials as Record<string, string> | undefined;

        // Mode 1: Login via verified 2FA token
        if (creds?.preAuthToken && creds?.is2FAVerified === 'true') {
          const tokenRecord = await prisma.twoFactorToken.findUnique({
            where: { preAuthToken: creds.preAuthToken },
            include: { user: true },
          });

          if (!tokenRecord || !tokenRecord.usedAt || !tokenRecord.user) {
            throw new Error('Verifikasi 2FA belum selesai atau token tidak valid');
          }

          // Pastikan token baru saja diverifikasi (dalam 5 menit terakhir)
          const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
          if (tokenRecord.usedAt < fiveMinsAgo) {
            throw new Error('Sesi verifikasi 2FA telah kadaluarsa');
          }

          const user = tokenRecord.user;

          if (user.status !== 'ACTIVE') {
            throw new Error('PENDING_VERIFICATION');
          }

          // Update lastLoginAt
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          // Log activity
          try {
            const userAgent = req?.headers?.['user-agent'] || 'Unknown';
            const ipAddress = req?.headers?.['x-forwarded-for']?.split(',')[0].trim() || req?.headers?.['x-real-ip'] || '127.0.0.1';
            await createActivityLog({
              userId: user.id,
              action: 'LOGIN',
              description: 'Login (Two-Step Verification Success)',
              ipAddress,
              userAgent,
            });
          } catch (logError) {
            console.warn('Gagal mencatat log aktivitas login:', logError);
          }

          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            password: user.password,
            username: user.username || undefined,
            image: user.image || undefined,
          };
        }

        // Mode 2: Legacy / Direct Credential Login -> Trigger 2FA Step 1
        if (!creds?.email || !creds?.password) {
          throw new Error('Email dan password wajib diisi');
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: creds.email },
              { username: creds.email },
            ],
          },
        });

        if (!user) {
          throw new Error('Email/Username atau password salah');
        }

        const isPasswordValid = await bcrypt.compare(
          creds.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Email/Username atau password salah');
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('PENDING_VERIFICATION');
        }

        // Must complete 2FA OTP verification first
        throw new Error('TWO_FACTOR_REQUIRED');
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.passwordHash = (user as any).password;
        token.name = user.name;
        token.image = (user as any).image;
        token.username = (user as any).username;
      }

      // Handle pembaruan session secara realtime dari client side menggunakan update()
      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name;
        if (session.image !== undefined) token.image = session.image;
        if (session.username) token.username = session.username;
      }

      // Validasi & cache role/permissions dari token (menghindari 4x query DB pada setiap request)
      if (token?.id) {
        if (!token.permissions || (token.permissions as any[]).length === 0) {
          const dbUser = await prisma.user.findUnique({
            where: { id: parseInt(token.id as string) },
            select: {
              password: true,
              roleRel: {
                select: {
                  name: true,
                  rolePermissions: {
                    select: {
                      permission: {
                        select: {
                          module: true,
                          action: true
                        }
                      }
                    }
                  }
                }
              }
            },
          });

          if (!dbUser || dbUser.password !== token.passwordHash) {
            console.log('JWT CALLBACK - Session invalidated (password mismatch or user not found)');
            token.id = '';
            return token;
          }

          // Cache role and permissions in the JWT token
          const permissions = dbUser.roleRel?.rolePermissions.map(
            (rp) => `${rp.permission.module}.${rp.permission.action}`
          ) || [];

          token.role = dbUser.roleRel?.name || 'Staff';
          token.permissions = permissions;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions || [];
        (session.user as any).username = token.username;
        (session.user as any).image = token.image;
        session.user.name = token.name;
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
