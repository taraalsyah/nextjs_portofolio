const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- START DATABASE SEEDING ---');

  // 1. Seed Permissions
  const permissionsData = [
    { module: 'Dashboard', action: 'View', description: 'Melihat ringkasan dashboard' },
    { module: 'User Management', action: 'View', description: 'Melihat daftar pengguna' },
    { module: 'User Management', action: 'Create', description: 'Membuat pengguna baru' },
    { module: 'User Management', action: 'Update', description: 'Mengubah data pengguna' },
    { module: 'User Management', action: 'Delete', description: 'Menghapus pengguna' },
    { module: 'Role Management', action: 'View', description: 'Melihat manajemen hak akses' },
    { module: 'Role Management', action: 'Create', description: 'Membuat role baru' },
    { module: 'Role Management', action: 'Update', description: 'Mengubah role dan permission' },
    { module: 'Role Management', action: 'Delete', description: 'Menghapus role' },
    { module: 'Activity History', action: 'View', description: 'Melihat riwayat aktivitas' },
    { module: 'Profile', action: 'View', description: 'Melihat profil diri sendiri' },
    { module: 'Profile', action: 'Update', description: 'Mengubah profil diri sendiri' },
    { module: 'Settings', action: 'View', description: 'Melihat pengaturan' },
    { module: 'Settings', action: 'Update', description: 'Mengubah pengaturan' },
  ];

  console.log('Seeding permissions to database...');
  const permissions = [];
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { module_action: { module: p.module, action: p.action } },
      update: { description: p.description },
      create: p,
    });
    permissions.push(perm);
  }
  console.log(`Seeded ${permissions.length} permissions.`);

  // 2. Seed Roles
  const rolesData = [
    { name: 'Admin', description: 'Administrator dengan hak akses penuh' },
    { name: 'Manager', description: 'Manager operasional dasar tanpa akses hapus user dan role' },
    { name: 'Staff', description: 'Staff operasional harian' },
    { name: 'Guest', description: 'Pengunjung dengan akses terbatas' },
  ];

  console.log('Seeding roles to database...');
  const roles = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    roles[r.name] = role;
  }
  console.log(`Seeded ${Object.keys(roles).length} roles.`);

  // 3. Define Permissions Mappings
  // Admin: gets everything
  const adminPermissions = permissions;
  
  // Manager: gets all except deleting user, deleting role, and creating/updating/deleting role management
  const managerPermissions = permissions.filter((p) => {
    if (p.module === 'Role Management') return false;
    if (p.module === 'User Management' && p.action === 'Delete') return false;
    return true;
  });

  // Staff: gets Dashboard.View, UserManagement.View, ActivityHistory.View, Profile.View/Update, Settings.View/Update
  const staffPermissions = permissions.filter((p) => {
    if (p.module === 'Dashboard') return p.action === 'View';
    if (p.module === 'User Management') return p.action === 'View';
    if (p.module === 'Activity History') return p.action === 'View';
    if (p.module === 'Profile') return true;
    if (p.module === 'Settings') return true;
    return false;
  });

  // Guest: gets Dashboard.View, Profile.View
  const guestPermissions = permissions.filter((p) => {
    if (p.module === 'Dashboard') return p.action === 'View';
    if (p.module === 'Profile') return p.action === 'View';
    return false;
  });

  const mappings = [
    { roleId: roles['Admin'].id, perms: adminPermissions },
    { roleId: roles['Manager'].id, perms: managerPermissions },
    { roleId: roles['Staff'].id, perms: staffPermissions },
    { roleId: roles['Guest'].id, perms: guestPermissions },
  ];

  console.log('Creating role-permission relations...');
  for (const m of mappings) {
    // Clear existing pivot entries for this role to make seeding idempotent
    await prisma.rolePermission.deleteMany({
      where: { roleId: m.roleId }
    });

    // Bulk create relation entries
    await prisma.rolePermission.createMany({
      data: m.perms.map((p) => ({
        roleId: m.roleId,
        permissionId: p.id,
      })),
    });
  }
  console.log('Role permissions successfully mapped.');

  // 4. Migrate Existing Users
  console.log('Migrating existing users to reference Role relations...');
  const users = await prisma.user.findMany();
  for (const u of users) {
    let assignedRoleId = roles['Staff'].id; // default fallback
    const lowercaseRole = u.role.toLowerCase();

    if (lowercaseRole === 'admin') {
      assignedRoleId = roles['Admin'].id;
    } else if (lowercaseRole === 'manager') {
      assignedRoleId = roles['Manager'].id;
    } else if (lowercaseRole === 'guest') {
      assignedRoleId = roles['Guest'].id;
    }

    await prisma.user.update({
      where: { id: u.id },
      data: {
        roleId: assignedRoleId,
        // Make sure string role matches role name for compatibility
        role: lowercaseRole === 'admin' ? 'Admin' : (lowercaseRole === 'manager' ? 'Manager' : (lowercaseRole === 'guest' ? 'Guest' : 'Staff')),
      },
    });
  }
  console.log(`Updated ${users.length} users role relations.`);

  console.log('--- SEED COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
