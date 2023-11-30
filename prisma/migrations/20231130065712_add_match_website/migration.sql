-- AlterTable
ALTER TABLE "business" ADD COLUMN     "matchAddress" INTEGER DEFAULT 1,
ADD COLUMN     "matchPhone" INTEGER DEFAULT 1;

-- CreateIndex
CREATE INDEX "business_matchPhone_idx" ON "business"("matchPhone");

-- CreateIndex
CREATE INDEX "business_matchAddress_idx" ON "business"("matchAddress");
