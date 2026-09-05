-- CreateEnum
CREATE TYPE "AuditType" AS ENUM ('CURRENT', 'OLD');

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "onboardingOldTime" TIMESTAMP(3),
ADD COLUMN     "type" "AuditType" NOT NULL DEFAULT 'CURRENT';
