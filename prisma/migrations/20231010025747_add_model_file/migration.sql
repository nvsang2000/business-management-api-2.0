-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "url" VARCHAR(800) NOT NULL,
    "creatorId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
