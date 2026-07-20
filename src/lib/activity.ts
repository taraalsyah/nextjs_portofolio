import { prisma } from '@/lib/prisma';

export type ActivityAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT'
  | 'VERIFY_OTP'
  | 'RESEND_OTP'
  | 'SOFT_BLOCK'
  | 'PERMANENT_BLOCK'
  | 'UNBLOCK';

/**
 * Reusable core helper to log activities to the database.
 * Can be called by any module in the future.
 */
export async function createActivityLog({
  userId,
  action,
  description,
  ipAddress,
  userAgent,
}: {
  userId: number;
  action: ActivityAction;
  description: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  return await prisma.activityLog.create({
    data: {
      userId,
      action,
      description,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Specific utility helper to compare old and new profile states
 * and log changes accordingly. Only records actual modifications.
 */
export async function logProfileChange(
  userId: number,
  oldUser: { name: string; username: string | null; phone: string | null; image: string | null },
  newUser: { name: string; username: string | null; phone: string | null; image: string | null },
  ipAddress?: string | null,
  userAgent?: string | null
) {
  const changes: string[] = [];
  let onlyPhotoDeleted = false;

  if (oldUser.name !== newUser.name) {
    changes.push(`Nama lengkap: ${newUser.name}`);
  }
  if (oldUser.username !== newUser.username) {
    changes.push(`Username: ${newUser.username || '-'}`);
  }
  if (oldUser.phone !== newUser.phone) {
    changes.push(`Nomor telepon: ${newUser.phone || '-'}`);
  }
  if (oldUser.image !== newUser.image) {
    changes.push('Foto profil');
    if (oldUser.image && !newUser.image) {
      onlyPhotoDeleted = true;
    }
  }

  if (changes.length === 0) return null;

  // Determine standard action context: DELETE if the only change is photo removal, otherwise UPDATE.
  const action: ActivityAction = (onlyPhotoDeleted && changes.length === 1) ? 'DELETE' : 'UPDATE';

  return await createActivityLog({
    userId,
    action,
    description: changes.join('\n'),
    ipAddress,
    userAgent,
  });
}

/**
 * Formats a Date object to the standard application timezone string:
 * e.g., "19 Jul 2026 18:45"
 */
export function formatActivityDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}
