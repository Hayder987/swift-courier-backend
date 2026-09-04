-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "CourierAvailability" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "couriers" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "vehicleLicenseNumber" TEXT NOT NULL,
    "qualifications" TEXT NOT NULL,
    "resume" TEXT,
    "resumePublicId" TEXT,
    "applicationStatus" "ApplicationStatus" DEFAULT 'APPLIED',
    "additionalFiles" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "couriers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "couriers_employeeId_key" ON "couriers"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_employeeCode_key" ON "couriers"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_email_key" ON "couriers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_vehicleLicenseNumber_key" ON "couriers"("vehicleLicenseNumber");

-- AddForeignKey
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
