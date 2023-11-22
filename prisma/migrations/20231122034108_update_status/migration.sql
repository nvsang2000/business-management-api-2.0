/*
  Warnings:

  - The `statusMarketing` column on the `business` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "business" DROP COLUMN "statusMarketing",
ADD COLUMN     "statusMarketing" INTEGER DEFAULT 1;

-- CreateIndex
CREATE INDEX "business_statusMarketing_idx" ON "business"("statusMarketing");
