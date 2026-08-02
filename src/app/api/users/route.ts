import { NextResponse } from 'next/server';
import { userQuerySchema } from '@/validators/user';
import { getUsersList } from '@/services/user/user.service';
import { verifyApiTokenHeader } from '@/services/user/api-token.service';
import { verifyApiPermission } from '@/lib/apiHelper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  let currentUserRole = '';
  let isAuthenticated = false;

  // 1. Primary Authentication: Personal API Token via Authorization: Bearer <token>
  const tokenAuth = await verifyApiTokenHeader(request);
  if (tokenAuth.authenticated && tokenAuth.user) {
    isAuthenticated = true;
    currentUserRole = tokenAuth.user.role || '';
  } else {
    // Fallback Authentication: NextAuth Session (for Web Dashboard UI)
    const sessionAuth = await verifyApiPermission(request, 'User Management', 'View');
    if (sessionAuth.authorized && sessionAuth.userId) {
      isAuthenticated = true;
      // Get role from session check or default to Admin if authorized
      currentUserRole = 'Admin';
    }
  }

  if (!isAuthenticated) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. Authorization RBAC Check: Only 'Super Admin' or 'Admin' allowed
  const normalizedRole = currentUserRole.toLowerCase();
  const isAuthorizedRole =
    normalizedRole.includes('admin') ||
    normalizedRole.includes('super admin') ||
    normalizedRole.includes('superadmin');

  if (!isAuthorizedRole) {
    return NextResponse.json(
      { success: false, message: 'Forbidden' },
      { status: 403 }
    );
  }

  // 3. Zod Input Query Validation
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
      search: searchParams.get('search') || undefined,
      sort: searchParams.get('sort') || undefined,
      order: searchParams.get('order') || undefined,
    };

    const parseResult = userQuerySchema.safeParse(queryParams);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation Error',
          errors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 4. Delegate Business Logic to User Service
    const result = await getUsersList(parseResult.data);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
