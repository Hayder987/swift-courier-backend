import httpStatus from "http-status";
import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { userServices } from "./user.service";
import { sendResponse } from "../../utils/sendResponse";

// user change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.id;
	const payload = req.body;

	await userServices.changePassword(payload, userId as string);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Password Changed successfully",
		data: null,
	});
});

// export user controller
export const userController = {
	changePassword,
};
