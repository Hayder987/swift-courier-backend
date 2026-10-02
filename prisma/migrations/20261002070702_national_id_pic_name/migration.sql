/*
  Warnings:

  - You are about to drop the column `nationalidPic` on the `couriers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "couriers" DROP COLUMN "nationalidPic",
ADD COLUMN     "nationalIdPic" JSONB;
