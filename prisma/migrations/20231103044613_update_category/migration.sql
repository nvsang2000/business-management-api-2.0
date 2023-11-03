/*
  Warnings:

  - You are about to drop the column `createAt` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `categories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "categories" DROP COLUMN "createAt",
DROP COLUMN "updateAt",
ADD COLUMN     "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ;
