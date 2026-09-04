import { prisma } from '@/lib/prisma';
import { UserQueryInput } from '@/validators/user';

export interface UserResponseItem {
  id: number;
  username: string | null;
  fullName: string;
  email: string;
  avatar: string | null;
  role: string;
  status: string;
}

export interface UserListResponse {
  success: boolean;
  data: UserResponseItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalData: number;
    totalPages: number;
  };
}

/**
 * Clean Service to fetch sanitized user list matching PRD requirements.
 * Filters sensitive attributes (password, apiToken, etc.) and formats response.
 */
export async function getUsersList(
  query: UserQueryInput,
  currentUserId?: number,
  projectId?: number
): Promise<UserListResponse> {
  const { page, pageSize, search, sort, order } = query;
  const skip = (page - 1) * pageSize;

  const whereClause: any = {};

  // Project Member Isolation Filter
  if (projectId) {
    whereClause.projectMemberships = {
      some: { projectId },
    };
  } else if (currentUserId) {
    whereClause.projectMemberships = {
      some: {
        project: {
          members: {
            some: { userId: currentUserId },
          },
        },
      },
    };
  }

  if (search && search.trim() !== '') {
    const searchFilter = search.trim();
    const searchConditions = [
      { username: { contains: searchFilter } },
      { name: { contains: searchFilter } },
      { email: { contains: searchFilter } },
    ];

    if (whereClause.projectMemberships) {
      whereClause.AND = [{ OR: searchConditions }];
    } else {
      whereClause.OR = searchConditions;
    }
  }

  // Map sort field 'fullName' to DB field 'name'
  let sortField = sort as string;
  if (sortField === 'fullName') {
    sortField = 'name';
  }

  const [users, totalData] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        [sortField]: order,
      },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where: whereClause }),
  ]);

  const formattedUsers: UserResponseItem[] = users.map((u) => ({
    id: u.id,
    username: u.username,
    fullName: u.name,
    email: u.email,
    avatar: u.image,
    role: u.role,
    status: u.status,
  }));

  return {
    success: true,
    data: formattedUsers,
    pagination: {
      page,
      pageSize,
      totalData,
      totalPages: Math.ceil(totalData / pageSize),
    },
  };
}

export interface UpdatePasswordInput {
  oldPassword?: string;
  old_password?: string;
  newPassword?: string;
  new_password?: string;
  confirmPassword?: string;
  confirm_password?: string;
}

export interface UpdatePasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Updates a user's password following security requirements:
 * 1. Validates presence of old_password, new_password, and confirm_password.
 * 2. Ensures new_password is at least 8 characters.
 * 3. Ensures new_password matches confirm_password.
 * 4. Compares old_password against stored hash in database using bcrypt.
 * 5. Hashes new_password using bcrypt before saving via Prisma ORM.
 */
export async function updatePassword(
  userId: number,
  input: UpdatePasswordInput
): Promise<UpdatePasswordResponse> {
  const oldPassword = (input.old_password ?? input.oldPassword ?? '').trim();
  const newPassword = (input.new_password ?? input.newPassword ?? '').trim();
  const confirmPassword = (input.confirm_password ?? input.confirmPassword ?? '').trim();

  // 1. Check mandatory fields
  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new Error('Password lama, password baru, dan konfirmasi password wajib diisi.');
  }

  // 2. Validate new_password min length (8 characters)
  if (newPassword.length < 8) {
    throw new Error('Password baru minimal terdiri dari 8 karakter.');
  }

  // 3. Ensure new_password matches confirm_password
  if (newPassword !== confirmPassword) {
    throw new Error('Konfirmasi password tidak cocok dengan password baru.');
  }

  // 4. Fetch user from database using Prisma ORM
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user) {
    throw new Error('User tidak ditemukan.');
  }

  // 5. Compare old_password against database bcrypt hash
  const { comparePassword, hashPassword } = await import('@/utils/password');
  const isOldPasswordValid = await comparePassword(oldPassword, user.password);
  if (!isOldPasswordValid) {
    throw new Error('Password lama tidak sesuai.');
  }

  // 6. Hash new_password using bcrypt
  const newPasswordHash = await hashPassword(newPassword);

  // 7. Update user record in database using Prisma
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: newPasswordHash,
      updatedAt: new Date(),
    },
  });

  return {
    success: true,
    message: 'Password berhasil diperbarui.',
  };
}
