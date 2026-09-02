/*
  Warnings:

  - You are about to drop the column `bio` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `employees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "bio",
ADD COLUMN     "realTimeAddress" JSONB;

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "bio",
ADD COLUMN     "realTimeAddress" JSONB;
