/*
  Warnings:

  - A unique constraint covering the columns `[employeeCode]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employeeCode` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "employeeCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeCode_key" ON "employees"("employeeCode");

-- CreateIndex
CREATE INDEX "employees_employeeCode_idx" ON "employees"("employeeCode");
