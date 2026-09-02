import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { userValidation } from "./user.validation";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";
import { userController } from "./user.controller";

const router = Router();

// change password
router.patch(
	"/change-password",
	validateRequest(userValidation.changePasswordZodSchema),
	auth(
		UserRole.CUSTOMER,
		UserRole.SUPER_ADMIN,
		UserRole.ADMIN,
		UserRole.OPERATION_MANAGER,
		UserRole.COURIER,
	),
	userController.changePassword,
);

// get my profile
router.get(
	"/me",
	auth(
		UserRole.CUSTOMER,
		UserRole.SUPER_ADMIN,
		UserRole.ADMIN,
		UserRole.OPERATION_MANAGER,
		UserRole.COURIER,
	),
	userController.getMyProfile,
);

export const userRoutes = router;
