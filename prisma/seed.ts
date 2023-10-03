/* eslint-disable prettier/prettier */
import { PrismaClient } from '@prisma/client';
import { ACTION, ROLE, TABLES } from '../src/constants';
import * as fs from 'fs-extra';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const basePolicies = [
  {
    id: 1,
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

async function createCity() {
  try {
    const readFile = fs.readFileSync(
      'assets/json/unique_zip_code.json',
      'utf-8',
    );
    const cityNameList = JSON.parse(readFile);
    const result = await prisma.city.createMany({
      data: cityNameList?.map((i) => ({
        cityName: i?.cityName,
        stateCode: i?.stateCode,
        stateName: i?.stateName,
        countyName: i?.countyName,
        zipCode: i?.zipCode,
      })),
    });
    return result;
  } catch (e) {
    console.log(e);
  }
}

async function main() {
  return Promise.all([seedUsers(), seedPermissions(), createCity()]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.log(e);
    await prisma.$disconnect();
    process.exit(1);
  });
