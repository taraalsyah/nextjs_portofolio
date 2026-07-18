import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'tara@example.com';
  const name = 'Tara Alsyah';
  const passwordText = 'password123';
  
  const hashedPassword = await bcrypt.hash(passwordText, 10);
  
  // Upsert user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      role: 'admin',
    },
    create: {
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    },
  });
  
  console.log('Seeding completed successfully!');
  console.log('User created/updated:', user.email);
  console.log('Password (plain text):', passwordText);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
