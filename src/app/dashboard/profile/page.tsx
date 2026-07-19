import React from 'react';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileForm from '@/components/profile/ProfileForm';

export const metadata = {
  title: 'Profil Saya | Dashboard Tara Alsyah',
  description: 'Kelola informasi profil pribadi dan detail kontak secara aman.',
};

export default async function ProfilePage() {
  // 1. Verifikasi session di server side
  const sessionUser = await requireAuth();

  // 2. Ambil data profil terbaru langsung dari database
  const userId = parseInt((sessionUser as any).id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      image: true,
      createdAt: true,
      lastLoginAt: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error('Data user tidak ditemukan di database.');
  }

  // 3. Konversi format data tanggal ke string agar aman dilempar ke client component
  const initialUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    image: user.image,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <ProfileHeader name={initialUser.name} />
      <ProfileForm initialUser={initialUser} />
    </div>
  );
}
