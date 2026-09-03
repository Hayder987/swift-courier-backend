/*
  Warnings:

  - You are about to drop the column `realTimeAddress` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `realTimeLatitude` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `realTimeLongitude` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `realTimeUpdatedAt` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `realTimeAddress` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `realTimeLatitude` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `realTimeLongitude` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `realTimeUpdatedAt` on the `employees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "realTimeAddress",
DROP COLUMN "realTimeLatitude",
DROP COLUMN "realTimeLongitude",
DROP COLUMN "realTimeUpdatedAt";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "realTimeAddress",
DROP COLUMN "realTimeLatitude",
DROP COLUMN "realTimeLongitude",
DROP COLUMN "realTimeUpdatedAt";

-- CreateTable
CREATE TABLE "live_locations" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userRole" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "address" JSONB,
    "isSharing" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "live_locations_userId_key" ON "live_locations"("userId");

-- CreateIndex
CREATE INDEX "live_locations_userId_idx" ON "live_locations"("userId");

-- CreateIndex
CREATE INDEX "live_locations_isSharing_idx" ON "live_locations"("isSharing");

-- AddForeignKey
ALTER TABLE "live_locations" ADD CONSTRAINT "live_locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
