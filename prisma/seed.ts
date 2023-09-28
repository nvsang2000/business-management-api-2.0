/* eslint-disable prettier/prettier */
import { PrismaClient } from '@prisma/client';
import { ACTION, ROLE, TABLES } from '../src/constants';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const basePolicies = [
  {
    isActive: true,
    name: 'Sale',
    permissions: [
      { action: ACTION.Create, subject: TABLES.Business, fields: undefined },
      { action: ACTION.Read, subject: TABLES.Business, fields: undefined },
      { action: ACTION.Update, subject: TABLES.Business, fields: undefined },
      { action: ACTION.Delete, subject: TABLES.Business, fields: undefined },
      { action: ACTION.Create, subject: TABLES.Category, fields: undefined },
      { action: ACTION.Read, subject: TABLES.Category, fields: undefined },
      { action: ACTION.Update, subject: TABLES.Category, fields: undefined },
      { action: ACTION.Delete, subject: TABLES.Category, fields: undefined },
    ],
  },
];

async function seedUsers() {
  const hash = bcrypt.hashSync('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@azcpos.com',
      displayName: 'Admin azcpos',
      phone: '0333027681',
      username: 'admin123',
      password: hash,
      role: ROLE.admin,
    },
  });

  await prisma.user.create({
    data: {
      email: 'nvsang2670@gmail.com',
      displayName: 'Nguyen Van Sang',
      phone: '0386237067',
      username: 'nvsang2670',
      password: hash,
      role: ROLE.admin,
    },
  });
}
async function seedPermissions() {
  try {
    await prisma.$transaction(
      basePolicies.map((policy) =>
        prisma.policy.create({
          data: {
            ...policy,
            permissions: policy.permissions as any,
          },
        }),
      ),
    );
  } catch (e) {
    console.log(e.message);
  }
}

async function main() {
  return Promise.all([seedUsers(), seedPermissions()]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.log(e)
    await prisma.$disconnect();
    process.exit(1);
  });
