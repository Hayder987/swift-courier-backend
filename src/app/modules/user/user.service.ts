import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import type { IChangePassword } from "./user.interface";
import { prisma } from "../../lib/prisma";
import { AuthMethod } from "../../../generated/prisma/enums";
import bcrypt from "bcryptjs";
import { passwordHash } from "../../utils/comon.utils";
import { sendTemplateEmail } from "../../services/sendTemplateEmail";

// change password own user
const changePassword = async (payload: IChangePassword, userId: string) => {
	if (!userId) {
		throw new AppError(httpStatus.FORBIDDEN, "Authentication required. Please log in again.");
	}

	const { currentPassword, newPassword, reEnterNewPassword } = payload;

	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},

		select: {
			id: true,
			name: true,
			email: true,
			password: true,
			authMethod: true,
			status: true,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found.");
	}

	if (user.status !== "ACTIVE") {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account is not active. You cannot change your password. plz contact us",
		);
	}

	if (user.authMethod === AuthMethod.GOOGLE || !user.password) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Password change is not available for Google-only accounts.",
		);
	}

	if (newPassword !== reEnterNewPassword) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"New Password and ReEnter New Password Will be Same!!!",
		);
	}

	const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

	if (!isCurrentPasswordValid) {
		throw new AppError(httpStatus.BAD_REQUEST, "Current password is incorrect.");
	}

	const isSamePassword = await bcrypt.compare(newPassword, user.password);

	if (isSamePassword) {
		throw new AppError(
			httpStatus.CONFLICT,
			"New password must be different from your current password.",
		);
	}

	const hashNewPassword = await passwordHash(newPassword);

	await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			password: hashNewPassword,
		},
	});

	await sendTemplateEmail({
		to: user.email,
		subject: "Password Changed Successfully!!!",
		templateName: "reset-password-success",
		data: {
			name: user.name,
			info: true,
		},
	});
};

export const userServices = {
	changePassword,
};
