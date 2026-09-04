import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { userValidation } from "./user.validation";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";
import { userController } from "./user.controller";
import { upload } from "../../lib/multer";

const router = Router();

// change password
router.patch(
	"/change-password",
	validateRequest(userValidation.changePasswordZodSchema),
	auth(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COURIER),
	userController.changePassword,
);

// update profile image
router.patch(
	"/profile-image",
	auth(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COURIER),
	upload.single("profileImage"),
	userController.updateProfileImage,
);

// get my profile
router.get(
	"/me",
	auth(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COURIER),
	userController.getMyProfile,
);

router.get("/all-user",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
	userController.getAllUsers
)

export const userRoutes = router;
