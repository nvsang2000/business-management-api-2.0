/*
  Warnings:

  - You are about to drop the column `county` on the `city` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `city` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `city` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cityName,stateCode,zipCode]` on the table `city` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cityName` to the `city` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countyName` to the `city` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stateCode` to the `city` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stateName` to the `city` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "city_name_state_zipCode_key";

-- AlterTable
ALTER TABLE "city" DROP COLUMN "county",
DROP COLUMN "name",
DROP COLUMN "state",
ADD COLUMN     "cityName" VARCHAR(128) NOT NULL,
ADD COLUMN     "countyName" VARCHAR(128) NOT NULL,
ADD COLUMN     "stateCode" VARCHAR(8) NOT NULL,
ADD COLUMN     "stateName" VARCHAR(128) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "city_cityName_stateCode_zipCode_key" ON "city"("cityName", "stateCode", "zipCode");
