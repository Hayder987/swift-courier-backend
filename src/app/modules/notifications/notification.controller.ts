import type { Request, Response } from "express";
import httpStatus from "http-status";
import { NotificationService } from "./notification.service";
import { catchAsync } from "../../utils/catchAsync";
import { NotificationType } from "../../../generated/prisma/enums";
import { sendResponse } from "../../utils/sendResponse";

// GET ADMIN NOTIFICATIONS
const getAdminNotifications = catchAsync(async (req: Request, res: Response) => {
	const result = await NotificationService.getAdminNotifications();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Admin notifications retrieved successfully!",
		data: result,
	});
});

// GET MY NOTIFICATIONS
const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.id;

	const result = await NotificationService.getMyNotifications(userId as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "My notifications retrieved successfully!",
		data: result,
	});
});

// DELETE MY NOTIFICATION
const deleteMyNotification = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.id;
	const { id } = req.params;

	const result = await NotificationService.deleteMyNotification(id as string, userId as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Notification deleted successfully!",
		data: {
			prevData: result,
		},
	});
});

// ADMIN DELETE NOTIFICATION
const deleteAdminNotification = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;

	const result = await NotificationService.deleteAdminNotification(id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Notification deleted successfully!",
		data: {
			prevData: result,
		},
	});
});

export const NotificationController = {
	getAdminNotifications,
	getMyNotifications,
	deleteMyNotification,
	deleteAdminNotification,
};
