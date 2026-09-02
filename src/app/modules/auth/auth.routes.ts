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

// Forgot Password
router.post(
	"/forgot-password",
	validateRequest(authValidation.forgotPasswordZodSchema),
	authController.forgotPassword,
);

// Reset Password
router.post(
	"/reset-password",
	validateRequest(authValidation.ResetPasswordZodSchema),
	authController.resetPassword,
);

// Resend Verification OTP
router.post(
	"/resend-otp",
	validateRequest(authValidation.resendOtpZodSchema),
	authController.resendOtp,
);

// Login
router.post(
	"/login",
	validateRequest(authValidation.loginUserAuthZodSchema),
	authController.loginUser,
);

export const authRoutes = router;
