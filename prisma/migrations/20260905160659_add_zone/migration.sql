-- AlterTable
ALTER TABLE "couriers" ADD COLUMN     "zoneId" UUID;

-- AlterTable
ALTER TABLE "shipments" ADD COLUMN     "deliveryZoneId" UUID,
ADD COLUMN     "pickupZoneId" UUID;

-- CreateTable
CREATE TABLE "zones" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "radiusKm" INTEGER NOT NULL,
    "boundary" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zones_code_key" ON "zones"("code");

-- CreateIndex
CREATE INDEX "zones_isActive_idx" ON "zones"("isActive");

-- CreateIndex
CREATE INDEX "zones_latitude_longitude_idx" ON "zones"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "couriers_zoneId_idx" ON "couriers"("zoneId");

-- CreateIndex
CREATE INDEX "shipments_pickupZoneId_idx" ON "shipments"("pickupZoneId");

-- CreateIndex
CREATE INDEX "shipments_deliveryZoneId_idx" ON "shipments"("deliveryZoneId");

-- AddForeignKey
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_pickupZoneId_fkey" FOREIGN KEY ("pickupZoneId") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_deliveryZoneId_fkey" FOREIGN KEY ("deliveryZoneId") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
