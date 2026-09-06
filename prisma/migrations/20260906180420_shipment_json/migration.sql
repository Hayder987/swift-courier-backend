/*
  Warnings:

  - You are about to drop the column `courierId` on the `shipments` table. All the data in the column will be lost.
  - Changed the type of `pickupAddress` on the `shipments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `deliveryAddress` on the `shipments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "shipments" DROP CONSTRAINT "shipments_courierId_fkey";

-- DropIndex
DROP INDEX "shipments_courierId_idx";

-- AlterTable
ALTER TABLE "shipments" DROP COLUMN "courierId",
ADD COLUMN     "deliveryCourierId" UUID,
ADD COLUMN     "pickupCourierId" UUID,
DROP COLUMN "pickupAddress",
ADD COLUMN     "pickupAddress" JSONB NOT NULL,
DROP COLUMN "deliveryAddress",
ADD COLUMN     "deliveryAddress" JSONB NOT NULL;

-- CreateIndex
CREATE INDEX "shipments_pickupCourierId_idx" ON "shipments"("pickupCourierId");

-- CreateIndex
CREATE INDEX "shipments_deliveryCourierId_idx" ON "shipments"("deliveryCourierId");

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_pickupCourierId_fkey" FOREIGN KEY ("pickupCourierId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_deliveryCourierId_fkey" FOREIGN KEY ("deliveryCourierId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
