import { NotificationType } from "../../../generated/prisma/enums";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

// get ADMIN notifications
const getAdminNotifications = async () => {
  const notifications = await prisma.notification.findMany({
    where : {
        type : NotificationType.GENERAL
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      shipment: {
        select: {
          id: true,
          trackingId: true,
          status: true,
        },
      },
    },
  });

  return notifications;
};

// Get logged-in user's notifications
const getMyNotifications = async (userId: string) => {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      shipment: {
        select: {
          id: true,
          trackingId: true,
          status: true,
        },
      },
    },
  });

  return notifications;
};

// Delete own notification
const deleteMyNotification = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, "Notification not found!");
  }

  const result = await prisma.notification.delete({
    where: {
      id: notificationId,
    },
  });

  return result;
};

// Admin can delete any notification by ID.
const deleteAdminNotification = async (notificationId: string) => {
  const notification = await prisma.notification.findUnique({
    where: {
      id: notificationId,
    },
  });

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, "Notification not found!");
  }

  const result = await prisma.notification.delete({
    where: {
      id: notificationId,
    },
  });

  return result;
};

export const NotificationService = {
  getAdminNotifications,
  getMyNotifications,
  deleteMyNotification,
  deleteAdminNotification,
};
