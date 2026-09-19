import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const testEmail = process.env.TEST_USER_EMAIL || 'testuser@tasktuntas.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'Password123!';
  const testName = 'Test User E2E';

  console.log(`Checking user: ${testEmail}...`);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: testEmail },
        { username: 'testuser_e2e' }
      ]
    }
  });

  const passwordHash = await bcrypt.hash(testPassword, 10);

  const adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });

  if (existingUser) {
    console.log(`Updating existing user ID ${existingUser.id} to ACTIVE with Admin role & test password...`);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        password: passwordHash,
        status: 'ACTIVE',
        role: 'Admin',
        roleId: adminRole ? adminRole.id : undefined,
        otpSoftBlockUntil: null,
        otpAttemptCount: 0,
      }
    });
    console.log('User updated successfully.');
  } else {
    console.log('Creating new active test user...');
    const newUser = await prisma.user.create({
      data: {
        name: testName,
        email: testEmail,
        username: 'testuser_e2e',
        password: passwordHash,
        status: 'ACTIVE',
        role: 'Admin',
      }
    });
    console.log(`Created test user ID ${newUser.id}.`);
  }
}

main()
  .catch((e) => {
    console.error('Error ensuring test user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
