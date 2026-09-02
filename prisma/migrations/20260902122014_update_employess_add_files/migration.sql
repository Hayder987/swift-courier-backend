-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "additionalFiles" JSONB,
ADD COLUMN     "permanentAddress" TEXT,
ADD COLUMN     "permanentCity" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
