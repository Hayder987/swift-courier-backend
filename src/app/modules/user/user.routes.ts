import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { userValidation } from "./user.validation";
import { auth } from "../../middleware/auth";
import { UserRole } from "../../../generated/prisma/enums";
import { userController } from "./user.controller";
import { upload } from "../../lib/multer";

const router = Router();

// Change password
router.patch(
	"/change-password",
	validateRequest(userValidation.changePasswordZodSchema),
	auth(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COURIER),
	userController.changePassword,
);

// Update profile image
router.patch(
	"/profile-image",
	auth(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COURIER),
	upload.single("profileImage"),
	userController.updateProfileImage,
);

// Get my profile
router.get(
	"/me",
	auth(UserRole.CUSTOMER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COURIER),
	userController.getMyProfile,
);

// Get all users
router.get("/all-user", auth(UserRole.SUPER_ADMIN, UserRole.ADMIN), userController.getAllUsers);

// Get user by ID
router.get(
	"/user/:id",
	auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COURIER),
	userController.getUserById,
);

// Change user status
router.patch(
	"/user/:userId/status",
	auth(UserRole.ADMIN),
	validateRequest(userValidation.changeUserStatusSchema),
	userController.changeUserStatus,
);

// Delete user
router.patch("/user/:id", auth(UserRole.ADMIN), userController.deleteUserById);

export const userRoutes = router;
