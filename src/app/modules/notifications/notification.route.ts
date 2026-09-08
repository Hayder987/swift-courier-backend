import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();


router.get(
  "/admin",
  auth(UserRole.ADMIN),
  NotificationController.getAdminNotifications,
);


router.get(
  "/me",
  auth(UserRole.COURIER, UserRole.CUSTOMER),
  NotificationController.getMyNotifications,
);


router.delete(
  "/admin/:id",
  auth(UserRole.ADMIN),
  NotificationController.deleteAdminNotification,
);


router.delete(
  "/me/:id",
  auth(UserRole.COURIER, UserRole.CUSTOMER),
  NotificationController.deleteMyNotification,
);


export const notificationRoutes = router;