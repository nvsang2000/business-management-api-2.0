/*
  Warnings:

  - You are about to drop the column `isWebsite` on the `business` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "business" DROP COLUMN "isWebsite",
ADD COLUMN     "statusWebsite" INTEGER DEFAULT 1;
