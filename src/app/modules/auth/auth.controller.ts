import httpStatus from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authServices } from "./auth.service";

// register user as customer
const registerCustomer = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;

	const result = await authServices.registerCustomer(payload);

	res.status(httpStatus.CREATED).json({
		success: true,
		message: "Operation successful",
		data: result,
	});
});

// export auth controller
export const authController = {
	registerCustomer,
};
