-- CreateTable
CREATE TABLE "policies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "permissions" JSONB,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(128),
    "username" VARCHAR(128) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(128),
    "phone" VARCHAR(24),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "role" VARCHAR(24) NOT NULL DEFAULT 'user',
    "thumbnail" VARCHAR(400),
    "policyId" UUID,
    "lastSeen" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" UUID NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "creatorId" UUID,
    "createAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMPTZ,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business" (
    "id" UUID NOT NULL,
    "name" VARCHAR(400) NOT NULL,
    "phone" VARCHAR(24),
    "email" VARCHAR(64),
    "website" VARCHAR(800),
    "scratchLink" VARCHAR(400),
    "state" VARCHAR(8),
    "zipCode" VARCHAR(16),
    "city" VARCHAR(128),
    "address" VARCHAR(128) NOT NULL,
    "status" VARCHAR(24)[],
    "categories" VARCHAR(128)[],
    "thumbnailUrl" VARCHAR(400),
    "cityId" UUID,
    "creatorId" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ,

    CONSTRAINT "business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job" (
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

    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city" (
    "id" UUID NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "state" VARCHAR(8) NOT NULL,
    "county" VARCHAR(128) NOT NULL,
    "zipCode" VARCHAR(16)[],

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_businesseToCategory" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "policies_name_key" ON "policies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE INDEX "business_categories_state_zipCode_cityId_idx" ON "business"("categories", "state", "zipCode", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "business_scratchLink_key" ON "business"("scratchLink");

-- CreateIndex
CREATE UNIQUE INDEX "business_address_zipCode_state_key" ON "business"("address", "zipCode", "state");

-- CreateIndex
CREATE INDEX "city_name_state_zipCode_idx" ON "city"("name", "state", "zipCode");

-- CreateIndex
CREATE UNIQUE INDEX "_businesseToCategory_AB_unique" ON "_businesseToCategory"("A", "B");

-- CreateIndex
CREATE INDEX "_businesseToCategory_B_index" ON "_businesseToCategory"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business" ADD CONSTRAINT "business_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business" ADD CONSTRAINT "business_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job" ADD CONSTRAINT "job_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job" ADD CONSTRAINT "job_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_businesseToCategory" ADD CONSTRAINT "_businesseToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_businesseToCategory" ADD CONSTRAINT "_businesseToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
