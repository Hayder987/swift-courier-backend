import { NotificationType, type UserRole } from "../../../generated/prisma/enums";

import httpStatus from "http-status";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

const getNotifications = async (userId: string, userRole: UserRole) => {
	const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

	return prisma.notification.findMany({
		where: isAdmin
			? {
					type: NotificationType.GENERAL,
				}
			: {
					userId,
					NOT: {
						type: NotificationType.GENERAL,
					},
				},
		orderBy: {
			createdAt: "desc",
		},
	});
};

// get notificationby

const deleteNotification = async (notificationId: string, userId: string, userRole: UserRole) => {
	const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

	const notification = await prisma.notification.findFirst({
		where: {
			id: notificationId,
			...(isAdmin ? {} : { userId }),
		},
	});

	if (!notification) {
		throw new AppError(httpStatus.NOT_FOUND, "Notification not found!");
	}

	return prisma.notification.delete({
		where: {
			id: notificationId,
		},
	});
};

export const NotificationService = {
	getNotifications,
	deleteNotification,
};
