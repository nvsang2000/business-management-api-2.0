/*
  Warnings:

  - A unique constraint covering the columns `[googleMapId]` on the table `business` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "business_googleMapId_key" ON "business"("googleMapId");
