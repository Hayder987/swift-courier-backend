-- CreateEnum
CREATE TYPE "LocationStatus" AS ENUM ('CREATED', 'ONGOING', 'EXPIRED');

-- AlterTable
ALTER TABLE "live_locations" ADD COLUMN     "status" "LocationStatus" NOT NULL DEFAULT 'CREATED';
