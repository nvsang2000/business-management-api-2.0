/*
  Warnings:

  - You are about to drop the `category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `city` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `job` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_businesseToCategory" DROP CONSTRAINT "_businesseToCategory_B_fkey";

-- DropForeignKey
ALTER TABLE "business" DROP CONSTRAINT "business_cityId_fkey";

-- DropForeignKey
ALTER TABLE "category" DROP CONSTRAINT "category_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "job" DROP CONSTRAINT "job_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "job" DROP CONSTRAINT "job_updatedById_fkey";

-- DropTable
DROP TABLE "category";

-- DropTable
DROP TABLE "city";

-- DropTable
DROP TABLE "job";

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "creatorId" UUID,
    "createAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMPTZ,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "keyword" VARCHAR(128),
    "state" VARCHAR(8),
    "county" VARCHAR(128)[],
    "zipCode" VARCHAR(16)[],
    "status" INTEGER NOT NULL DEFAULT 1,
    "statusData" JSONB,
    "creatorId" UUID,
    "updatedById" UUID,
    "duration" INTEGER,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" UUID NOT NULL,
    "cityName" VARCHAR(128) NOT NULL,
    "stateCode" VARCHAR(8) NOT NULL,
    "stateName" VARCHAR(128) NOT NULL,
    "countyName" VARCHAR(128) NOT NULL,
    "zipCode" VARCHAR(16) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cities_cityName_stateCode_zipCode_key" ON "cities"("cityName", "stateCode", "zipCode");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business" ADD CONSTRAINT "business_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_businesseToCategory" ADD CONSTRAINT "_businesseToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
