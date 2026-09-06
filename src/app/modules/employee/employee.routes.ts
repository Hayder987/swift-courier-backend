import { Router } from "express";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";
import { employeeController } from "./employee.controller";
import { upload } from "../../lib/multer";
import { validateRequest } from "../../middleware/validateRequest";
import { employeeValidation } from "./employee.validation";

const router = Router();

// get all applicant
router.get(
	"/jobs",
	auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
	employeeController.getAllEmployeeApplicant,
);

router.get(
	"/all-employee",
	auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
	employeeController.getAllEmployees,
);

// apply for courier
router.post(
	"/be-courier",
	auth(UserRole.CUSTOMER),
	upload.fields([
		{
			name: "resume",
			maxCount: 1,
		},

		{
			name: "vehicleDocuments",
			maxCount: 5,
		},
		{
			name: "nationalidPic",
			maxCount: 2,
		},
	]),
	employeeController.applyForCourier,
);

router.patch(
	"/jobs/:id",
	validateRequest(employeeValidation.approvedCourierZodSchema),
	auth(UserRole.ADMIN),
	employeeController.approvedCourier,
);

// getEmployee by id
router.get(
	"/emp/:id",
	auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
	employeeController.getEmployeeById,
);

// employee export routes
export const employeeRoutes = router;
