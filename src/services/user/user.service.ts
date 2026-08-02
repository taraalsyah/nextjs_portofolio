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
export async function getUsersList(query: UserQueryInput): Promise<UserListResponse> {
  const { page, pageSize, search, sort, order } = query;
  const skip = (page - 1) * pageSize;

  const whereClause: Record<string, unknown> = {};

  if (search && search.trim() !== '') {
    const searchFilter = search.trim();
    whereClause.OR = [
      { username: { contains: searchFilter } },
      { name: { contains: searchFilter } },
      { email: { contains: searchFilter } },
    ];
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
