-- DropIndex
DROP INDEX "business_categories_state_zipCode_cityId_idx";

-- CreateIndex
CREATE INDEX "business_name_idx" ON "business"("name");

-- CreateIndex
CREATE INDEX "business_phone_idx" ON "business"("phone");

-- CreateIndex
CREATE INDEX "business_website_idx" ON "business"("website");

-- CreateIndex
CREATE INDEX "business_zipCode_idx" ON "business"("zipCode");

-- CreateIndex
CREATE INDEX "business_city_idx" ON "business"("city");

-- CreateIndex
CREATE INDEX "business_address_idx" ON "business"("address");
