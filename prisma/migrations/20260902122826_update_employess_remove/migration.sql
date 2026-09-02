/*
  Warnings:

  - You are about to drop the column `permanentAddress` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `permanentCity` on the `customers` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "customers_permanentCity_idx";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "permanentAddress",
DROP COLUMN "permanentCity";
