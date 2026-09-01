import httpStatus from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authServices } from "./auth.service";

// register user as customer
const registerCustomer = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	 await authServices.registerCustomer(payload);

	res.status(httpStatus.CREATED).json({
		success: true,
		message: `Email Verification OTP send to Your ${payload?.email}`,
		data: {},
	});
});

// export auth controller
export const authController = {
	registerCustomer,
};
