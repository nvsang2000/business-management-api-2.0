-- AlterTable
ALTER TABLE "business" ADD COLUMN     "statusMarketing" VARCHAR(24) DEFAULT 'NOT_ACCEPT',
ADD COLUMN     "userMarketingId" UUID;

-- AddForeignKey
ALTER TABLE "business" ADD CONSTRAINT "business_userMarketingId_fkey" FOREIGN KEY ("userMarketingId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
