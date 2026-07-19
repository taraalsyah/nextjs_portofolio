import React from 'react';
import { requirePermission } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileForm from '@/components/profile/ProfileForm';

export const metadata = {
  title: 'Profil Saya | Dashboard Tara Alsyah',
  description: 'Kelola informasi profil pribadi dan detail kontak secara aman.',
};

export default async function ProfilePage() {
  const sessionUser = await requirePermission('Profile', 'View');

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
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <ProfileHeader name={initialUser.name} />
      <ProfileForm initialUser={initialUser} />
    </div>
  );
}
