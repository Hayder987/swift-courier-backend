import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/auth";
import { dashboardController } from "./dashboard.controller";

const router = Router();

router.get(
	"/stats",
	auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
	dashboardController.getDashboardStats,
);

export const dashboardRoutes = router;
