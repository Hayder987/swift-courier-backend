import { Router } from "express";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";
import { superAdminController } from "./superAdmin.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { superAdminValidation } from "./superAdmin.validation";

const router = Router();

// get all audit logs
router.get("/logs", auth(UserRole.SUPER_ADMIN), superAdminController.getAllAuditLog);

router.post(
  "/create-employee",
  auth(UserRole.SUPER_ADMIN),
  validateRequest(
    superAdminValidation.createEmployeeZodSchema,
  ),
  superAdminController.createEmployee
);

// export routes
export const superAdminRoutes = router;
