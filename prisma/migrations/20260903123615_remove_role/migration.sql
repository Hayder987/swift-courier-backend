/*
  Warnings:

  - The values [OPERATION_MANAGER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'COURIER', 'CUSTOMER');
ALTER TABLE "public"."live_locations" ALTER COLUMN "userRole" DROP DEFAULT;
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "live_locations" ALTER COLUMN "userRole" TYPE "UserRole_new" USING ("userRole"::text::"UserRole_new");
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "live_locations" ALTER COLUMN "userRole" SET DEFAULT 'CUSTOMER';
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
COMMIT;
