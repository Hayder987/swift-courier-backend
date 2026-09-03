import type { SignOptions } from "jsonwebtoken";
import config from "../../config";
import { jwtUtils } from "../../utils/jwt";
import type { ICreateAuthSessionParams } from "./auth.interface";
import type { Response } from "express";

interface ITokenPayload {
	refreshToken: string;
}

const createAuthSession = async ({ user }: ICreateAuthSessionParams) => {
	// JWT Payload
	const jwtPayload = {
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
		isEmailVerified: user.isEmailVerified,
		isEmployee: user.isEmployee,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);

	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return {
		accessToken,
		refreshToken,
	};
};

const setCookieResponse = async (res: Response, tokenPayload: ITokenPayload) => {
	const { refreshToken } = tokenPayload;

	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});
};

export const authUtils = {
	createAuthSession,
	setCookieResponse,
};
