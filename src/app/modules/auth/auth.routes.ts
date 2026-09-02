import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { authController } from "./auth.controller";
import { authValidation } from "./auth.validation";

const router = Router();

// Register Customer - Public
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

// Google Login
router.post("/google", authController.googleLogin);

// Refresh Token
router.post("/refresh-token", authController.refreshToken);

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

// Logout
router.post("/logout", authController.logout);

export const authRoutes = router;
