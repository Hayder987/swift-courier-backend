import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.get(
	"/all-notifications",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COURIER, UserRole.CUSTOMER),
	NotificationController.getNotifications,
);

router.delete(
	"/:id",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COURIER, UserRole.CUSTOMER),
	NotificationController.deleteNotification,
);

export const notificationRoutes = router;
