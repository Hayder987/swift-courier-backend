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
  auth(
    UserRole.CUSTOMER,
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATION_MANAGER,
    UserRole.COURIER,
  ),
  userController.changePassword,
);

// update profile image
router.patch(
  "/profile-image",
  auth(
    UserRole.CUSTOMER,
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATION_MANAGER,
    UserRole.COURIER,
  ),
  upload.single("profileImage"),
  userController.updateProfileImage,
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

// real time address update
router.patch(
  "/my-live-location",
  validateRequest(userValidation.liveLocationZodSchema),
  auth(UserRole.CUSTOMER, UserRole.COURIER, UserRole.SUPER_ADMIN),
  userController.updateLiveAddress,
);

export const userRoutes = router;
