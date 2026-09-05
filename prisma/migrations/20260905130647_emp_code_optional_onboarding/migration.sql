/*
  Warnings:

  - The values [PENDING] on the enum `ApplicationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `employeeCode` on the `couriers` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApplicationStatus_new" AS ENUM ('APPLIED', 'APPROVED', 'REJECTED');
ALTER TABLE "public"."couriers" ALTER COLUMN "applicationStatus" DROP DEFAULT;
ALTER TABLE "couriers" ALTER COLUMN "applicationStatus" TYPE "ApplicationStatus_new" USING ("applicationStatus"::text::"ApplicationStatus_new");
ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";
DROP TYPE "public"."ApplicationStatus_old";
ALTER TABLE "couriers" ALTER COLUMN "applicationStatus" SET DEFAULT 'APPLIED';
COMMIT;

-- DropIndex
DROP INDEX "couriers_employeeCode_key";

-- AlterTable
ALTER TABLE "couriers" DROP COLUMN "employeeCode";

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "onboardingTime" TIMESTAMP(3);
