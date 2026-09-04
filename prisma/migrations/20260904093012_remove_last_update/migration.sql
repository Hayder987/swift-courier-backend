/*
  Warnings:

  - You are about to drop the column `lastUpdateAt` on the `shipment_trackings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "shipment_trackings" DROP COLUMN "lastUpdateAt";
