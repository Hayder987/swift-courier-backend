/*
  Warnings:

  - You are about to drop the column `additionalFiles` on the `couriers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "couriers" DROP COLUMN "additionalFiles",
ADD COLUMN     "nationalidPic" JSONB,
ADD COLUMN     "vehicleDocuments" JSONB;
