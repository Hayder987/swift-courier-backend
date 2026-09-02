import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { authValidation } from "./auth.validation";

const router = Router();

// register customer public
router.post(
  "/sign-up",
  validateRequest(authValidation.registerZodSchema),
  authController.registerCustomer,
);

// Verify Email
router.post(
	"/verify-email",
	validateRequest(authValidation.verifyEmailZodSchema),
	authController.verifyEmail,
);

export const authRoutes = router;
