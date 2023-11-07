-- AlterTable
ALTER TABLE "business" ALTER COLUMN "status" SET DEFAULT ARRAY['NEW']::VARCHAR(24)[];

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "properties" VARCHAR(128)[];
