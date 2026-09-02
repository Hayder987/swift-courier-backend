import httpStatus from "http-status";
import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authServices } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";

// register user as customer
const registerCustomer = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	await authServices.registerCustomer(payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `Verification OTP send to Email: ${payload.email}`,
		data: null,
	});
});

// verify email
const verifyEmail = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	await authServices.verifyEmail(payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `Verify Email SuccessFull! And Registration SuccessFully!`,
		data: null,
	});
});

// forgot password
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	await authServices.forgotPassword(payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `Verification OTP send to Email: ${payload.email}`,
		data: null,
	});
});

// reset password
const resetPassword = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	await authServices.resetPassword(payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Password Reset successfully!!",
		data: null,
	});
});

// resend otp email verify or forgot pass otp
const resendOtp = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	await authServices.resendOtp(payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `New Verification OTP Code send to Email: ${payload.email}`,
		data: null,
	});
});

// export auth controllerS
export const authController = {
	registerCustomer,
	verifyEmail,
	forgotPassword,
	resetPassword,
	resendOtp,
};
