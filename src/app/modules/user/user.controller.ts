import httpStatus from "http-status";
import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { userServices } from "./user.service";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";

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

// get my user profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.id;

	const { user, profile } = await userServices.getMyProfile(userId as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `Your Profile Retrieve Successfully`,
		data: { user, profile },
	});
});

// update profile image
const updateProfileImage = catchAsync(async (req: Request, res: Response) => {
	if (!req.file) {
		throw new AppError(httpStatus.NOT_FOUND, "No File Provided.");
	}
	const user = req.user;

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User Not Found! Please Re-login");
	}

	const result = await userServices.updateProfileImage(req.file?.buffer, user);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Profile Image Upload && New tokens generated successfully",
		data: result,
	});
});

// get my user profile
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;

	const result = await userServices.getAllUsers(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `All Users Retrieve Successfully`,
		data: result,
	});
});

// get user profile by id
const getUserById = catchAsync(async (req: Request, res: Response) => {
	const userId = req.params.id;
	const userRole = req.user?.role;

	const { user, profile } = await userServices.getUserById(userId as string, userRole as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `User Profile Retrieve Successfully`,
		data: { user, profile },
	});
});

// export user controller
export const userController = {
	changePassword,
	getMyProfile,
	updateProfileImage,
	getAllUsers,
	getUserById
};
