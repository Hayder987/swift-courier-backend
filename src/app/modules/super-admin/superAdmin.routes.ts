import { Router } from "express";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";
import { superAdminController } from "./superAdmin.controller";

const router = Router();

// get all audit logs
router.get("/logs", auth(UserRole.SUPER_ADMIN), superAdminController.getAllAuditLog);

// export routes
export const superAdminRoutes = router;
