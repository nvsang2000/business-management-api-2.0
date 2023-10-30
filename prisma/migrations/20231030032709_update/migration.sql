/*
  Warnings:

  - You are about to drop the column `googleMapId` on the `business` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "business_googleMapId_key";

-- AlterTable
ALTER TABLE "business" DROP COLUMN "googleMapId";
