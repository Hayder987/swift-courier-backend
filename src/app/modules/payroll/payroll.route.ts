import { Router } from "express";
import { payrollController } from "./payroll.controller";
import { payrollValidation } from "./payroll.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

router.post(
	"/generate",
	auth(UserRole.ADMIN),
	validateRequest(payrollValidation.generatePayrollZodSchema),
	payrollController.generatePayroll,
);

// My salary
router.get(
	"/my-salary",
	auth(UserRole.COURIER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
	payrollController.getMySalary,
);

// All paid salaries
router.get(
	"/paid",
	auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
	payrollController.getPaidSalary,
);

// Pay salary
router.patch(
	"/:id/pay",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
	validateRequest(payrollValidation.payPayrollZodSchema),
	payrollController.paySalary,
);

export const payrollRoutes = router;
