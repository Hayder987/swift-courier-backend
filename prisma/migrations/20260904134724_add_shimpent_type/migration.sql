-- CreateEnum
CREATE TYPE "ShipmentType" AS ENUM ('NEW', 'OLD');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "notificationDeadline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "onboardingTime" TIMESTAMP(3),
ADD COLUMN     "type" "ShipmentType" NOT NULL DEFAULT 'NEW';
