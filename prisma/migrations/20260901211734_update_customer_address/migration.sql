/*
  Warnings:

  - You are about to drop the column `currentAddress` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `currentCity` on the `customers` table. All the data in the column will be lost.
  - Added the required column `permanentAddress` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `permanentCity` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Made the column `country` on table `customers` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "customers_currentCity_idx";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "currentAddress",
DROP COLUMN "currentCity",
ADD COLUMN     "permanentAddress" TEXT NOT NULL,
ADD COLUMN     "permanentCity" TEXT NOT NULL,
ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "country" SET DEFAULT 'Bangladesh';

-- CreateIndex
CREATE INDEX "customers_permanentCity_idx" ON "customers"("permanentCity");
