/*
  Warnings:

  - The values [SHIPMENT_ASSIGNED,SHIPMENT_ACCEPTED,SHIPMENT_REJECTED,SHIPMENT_PICKED_UP,SHIPMENT_IN_TRANSIT,SHIPMENT_OUT_FOR_DELIVERY,SHIPMENT_DELIVERED,SHIPMENT_CANCELLED,DELIVERY_FAILED,PAYMENT_PENDING,PAYMENT_SUCCESS,PAYMENT_FAILED,PAYMENT_REFUNDED,COURIER_ASSIGNED,COURIER_ARRIVED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('SHIPMENT', 'PAYMENT', 'GENERAL');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;
