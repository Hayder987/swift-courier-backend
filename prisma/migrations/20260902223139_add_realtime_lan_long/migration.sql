-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "realTimeLatitude" DECIMAL(10,7),
ADD COLUMN     "realTimeLongitude" DECIMAL(10,7),
ADD COLUMN     "realTimeUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "realTimeLatitude" DECIMAL(10,7),
ADD COLUMN     "realTimeLongitude" DECIMAL(10,7),
ADD COLUMN     "realTimeUpdatedAt" TIMESTAMP(3);
