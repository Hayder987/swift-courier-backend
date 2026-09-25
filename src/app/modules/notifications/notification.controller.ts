import type { Request, Response } from "express";
import httpStatus from "http-status";
import { NotificationService } from "./notification.service";
import { catchAsync } from "../../utils/catchAsync";
import type { UserRole } from "../../../generated/prisma/enums";
import { sendResponse } from "../../utils/sendResponse";

// GET ALL NOTIFICATIONS
const getNotifications = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.id;
	const userRole = req.user?.role;

	const result = await NotificationService.getNotifications(userId as string, userRole as UserRole);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "My notifications retrieved successfully!",
		data: result,
	});
});

// DELETE MY NOTIFICATION
const deleteNotification = catchAsync(async (req: Request, res: Response) => {
	const userId = req.user?.id;
	const userRole = req.user?.role;
	const { id } = req.params;

	const result = await NotificationService.deleteNotification(
		id as string,
		userId as string,
		userRole as UserRole,
	);

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
	getNotifications,
	deleteNotification,
};
