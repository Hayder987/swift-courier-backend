import httpStatus from "http-status";
import { type UserRole, UserStatus } from "../../generated/prisma/enums";
import { catchAsync } from "../utils/catchAsync";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import type { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export const auth = (...requiredRole: UserRole[]) => {
	return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
		const token = req.headers.authorization?.startsWith("Bearer ")
			? req.headers.authorization?.split(" ")[1]
			: req.headers.authorization;

		if (!token) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				"You are not logged in. Please log in to access this resource.",
			);
		}

		const verifyAuthToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

		if (!verifyAuthToken.success) {
			throw new AppError(httpStatus.UNAUTHORIZED, verifyAuthToken.error);
		}

		const { id, name, role, email, isEmailVerified, isEmployee } =
			verifyAuthToken.data as JwtPayload;

		if (!id) {
			throw new AppError(httpStatus.NOT_FOUND, "Invalid access token. User ID is missing.");
		}

		if (!name) {
			throw new AppError(httpStatus.NOT_FOUND, "Invalid access token. Name is missing.");
		}

		if (!email) {
			throw new AppError(httpStatus.NOT_FOUND, "Invalid access token. Email is missing.");
		}

		if (!isEmailVerified) {
			throw new AppError(httpStatus.UNAUTHORIZED, "Invalid access token. Email Not Verified.");
		}

		if (!role) {
			throw new AppError(httpStatus.NOT_FOUND, "Invalid access token. User role is missing.");
		}

		if (requiredRole.length && !requiredRole.includes(role)) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Forbidden. You don't have permission to access this resource.",
			);
		}

		const user = await prisma.user.findUnique({
			where: {
				id,
				email,
				name,
				role,
				isEmailVerified,
				isEmployee,
			},
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				status: true,
				isEmailVerified: true,
				isEmployee: true,
				isDeleted: true,
			},
		});

		if (!user) {
			throw new AppError(httpStatus.NOT_FOUND, "User not found. Please log in again.");
		}

		if (user.status === UserStatus.SUSPENDED) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Your account has been suspended. Please contact support.",
			);
		}

		if (user.status === UserStatus.DELETED || user.isDeleted) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Your account has been deleted. Please contact support.",
			);
		}

		if (user.email !== email) {
			throw new AppError(httpStatus.UNAUTHORIZED, "Invalid access token. Please log in again.");
		}

		if (user.role !== role) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"No Permission! Or Your account permissions have changed. Please log in again.",
			);
		}

		req.user = {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			isEmailVerified: user.isEmailVerified,
			isEmployee: user.isEmployee,
		};

		next();
	});
};
