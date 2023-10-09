/*
  Warnings:

  - You are about to drop the column `googleMapUrl` on the `business` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "business" DROP COLUMN "googleMapUrl",
ADD COLUMN     "googleMapId" VARCHAR(64);
