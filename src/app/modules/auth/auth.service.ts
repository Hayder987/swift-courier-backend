import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	IGoogleLoginPayload,
	ILoginUserPayload,
	IRegisterPayload,
	IVerifyEmailPayload,
} from "./auth.validation";
import { createOtp, passwordHash, setRedisOtp } from "../../utils/comon.utils";
import { redisClient } from "../../lib/redis";
import { sendTemplateEmail } from "../../services/sendTemplateEmail";
import { AuthMethod, UserRole, UserStatus } from "../../../generated/prisma/enums";
import type { IForgotPassword, IResendOtp, IResetPassword } from "./auth.interface";
import bcrypt from "bcryptjs";
import { authUtils } from "./auth.utils";
import type { TokenPayload } from "google-auth-library";
import { googleClient } from "../../lib/googleAuth";
import config from "../../config";
import { jwtUtils } from "../../utils/jwt";
import type { JwtPayload } from "jsonwebtoken";

// create user as customer
const registerCustomer = async (payload: IRegisterPayload) => {
	const { name, password, phone } = payload;
	const email = payload.email.trim().toLowerCase();

	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (isUserExist?.phone && isUserExist.phone === phone) {
		throw new AppError(httpStatus.CONFLICT, "This Phone Number Already Use");
	}

	if (isUserExist) {
		throw new AppError(httpStatus.CONFLICT, "User Already Exists Please Login!");
	}

	const hashPassword = await passwordHash(password);
	const otp = createOtp();

	const customerPayloadKey = `customer_registration_payload:${email}`;
	const emailverifyOtpKey = `email_verify_otp:${email}`;
	const expirationTime = 5 * 60;

	await redisClient.set(
		customerPayloadKey,
		JSON.stringify({
			name,
			email,
			password: hashPassword,
			phone,
		}),
		{
			expiration: {
				type: "EX",
				value: expirationTime,
			},
		},
	);

	await setRedisOtp(emailverifyOtpKey, otp);

	await sendTemplateEmail({
		to: email,
		subject: "Verify Your SwiftCourier Account",
		templateName: "otp-verification",
		data: {
			otp,
			expirationMinutes: 5,
		},
	});
};

// verify email
const verifyEmail = async (payload: IVerifyEmailPayload) => {
	const otp = payload?.otp;
	const email = payload.email.trim().toLowerCase();

	const emailverifyOtpKey = `email_verify_otp:${email}`;
	const redisOtp = await redisClient.get(emailverifyOtpKey);

	if (!redisOtp) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP or OTP has expired");
	}

	if (redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
	}

	await redisClient.del(emailverifyOtpKey);

	const customerPayloadKey = `customer_registration_payload:${email}`;
	const userRedisPayload = await redisClient.get(customerPayloadKey);

	if (!userRedisPayload) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Verification code expired or registration session not found",
		);
	}

	const registrationData = JSON.parse(userRedisPayload);

	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (isUserExist) {
		if (isUserExist.isEmailVerified) {
			throw new AppError(httpStatus.CONFLICT, "Email is already verified");
		}

		if (isUserExist.status === UserStatus.SUSPENDED) {
			throw new AppError(httpStatus.FORBIDDEN, "Your account is suspended Please Contact Us");
		}

		if (isUserExist.status === UserStatus.DELETED) {
			throw new AppError(httpStatus.FORBIDDEN, "Your account is deleted Please Contact Us");
		}

		if (!isUserExist.password) {
			throw new AppError(httpStatus.BAD_REQUEST, "User is authenticated with Google");
		}
	}

	const now = new Date();
	const deletionDeadline = new Date(now.getTime() + 360 * 60 * 60 * 1000); // 15 days

	const userData = await prisma.user.create({
		data: {
			name: registrationData.name,
			email: registrationData.email,
			password: registrationData.password,
			phone: registrationData.phone,
			role: UserRole.CUSTOMER,
			status: UserStatus.ACTIVE,
			isEmailVerified: true,
			authMethod: AuthMethod.CREDENTIALS,

			customer: {
				create: {
					deletionDeadline: deletionDeadline,
				},
			},
		},

		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			isEmailVerified: true,
			isEmployee: true,
			customer: {
				select: {
					deletionDeadline: true,
				},
			},
		},
	});

	const templateData = {
		name: userData?.name,
		email: userData?.email,
		role: userData?.role,
		status: userData?.status,
		deletionDeadline: userData?.customer?.deletionDeadline,
	};

	await sendTemplateEmail({
		to: userData?.email,
		subject: "Welcome to SwiftCourier Your — Registration Successful",
		templateName: "registration-success",
		data: templateData,
	});

	const { customer, ...user } = userData;

	const authSession = await authUtils.createAuthSession({ user });

	return authSession;
};

// forgot password
const forgotPassword = async (payload: IForgotPassword) => {
	const { email } = payload;

	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!isUserExist) {
		throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
	}

	if (isUserExist.status !== UserStatus.ACTIVE) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account is suspended or blocked. Please contact support",
		);
	}

	if (!isUserExist.isEmailVerified) {
		throw new AppError(httpStatus.FORBIDDEN, "User email is not verified");
	}

	const otp = createOtp();

	const key = `forgot-password-otp:${isUserExist.email}`;

	await setRedisOtp(key, otp);

	await sendTemplateEmail({
		to: isUserExist.email,
		subject: "Forgot Password OTP",
		templateName: "otp-verification",
		data: {
			otp,
			expirationMinutes: 5,
		},
	});
};

// reset password
const resetPassword = async (payload: IResetPassword) => {
	const { email, otp, newPassword } = payload;

	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!isUserExist) {
		throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
	}

	if (isUserExist.status !== UserStatus.ACTIVE) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account is suspended or blocked. Please contact support",
		);
	}

	if (!isUserExist.isEmailVerified) {
		throw new AppError(httpStatus.FORBIDDEN, "User email is not verified");
	}

	const key = `forgot-password-otp:${isUserExist.email}`;

	const redisOtp = await redisClient.get(key);

	if (!redisOtp) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP or OTP has expired");
	}

	if (redisOtp !== otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
	}

	const hashedNewPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

	await prisma.user.update({
		where: {
			email: isUserExist.email,
		},

		data: {
			password: hashedNewPassword,
		},
	});

	await redisClient.del([key]);

	await sendTemplateEmail({
		to: isUserExist.email,
		subject: "Password Reset Successfully!!!",
		templateName: "reset-password-success",
		data: {
			name: isUserExist.name,
			info: false,
		},
	});
};

// resend otp email verify and forgot password
const resendOtp = async (payload: IResendOtp) => {
	const { email, emailVerifyOtp } = payload;

	const isUserExist = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!isUserExist) {
		throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
	}

	if (isUserExist.status !== UserStatus.ACTIVE) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account is suspended or blocked please contact us",
		);
	}

	if (emailVerifyOtp && isUserExist.isEmailVerified) {
		throw new AppError(httpStatus.CONFLICT, "Email is already verified");
	}

	if (!isUserExist.isEmailVerified) {
		throw new AppError(httpStatus.BAD_REQUEST, "Email is not verified");
	}

	const otp = createOtp();

	const emailverifyOtpKey = `email_verify_otp:${isUserExist.email}`;
	const forgotKey = `forgot-password-otp:${isUserExist.email}`;

	const expirationSeconds = 5 * 60;

	const key = emailVerifyOtp ? emailverifyOtpKey : forgotKey;

	await redisClient.set(key, otp, {
		expiration: {
			type: "EX",
			value: expirationSeconds,
		},
	});

	await sendTemplateEmail({
		to: isUserExist.email,
		subject: `New Verification OTP For ${emailVerifyOtp ? "Email Verify" : "Forgot Password"}`,
		templateName: "otp-verification",
		data: {
			otp,
			expirationMinutes: 5,
		},
	});
};

// login platformUser superAdmin by credential
const loginUser = async (payload: ILoginUserPayload) => {
	const { password } = payload;
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User Not Found ! Please Register");
	}

	if (user.status === UserStatus.SUSPENDED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is suspended plz contact us");
	}

	if (user.status === UserStatus.DELETED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is deleted plz contact us");
	}

	if (!user.isEmailVerified) {
		throw new AppError(httpStatus.FORBIDDEN, "Email not verified. Please verify your email");
	}

	if (user.authMethod !== AuthMethod.CREDENTIALS) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Password login is not available for this account. Please use Google login",
		);
	}

	if (!user.password) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Credential login is not available for this Google account",
		);
	}

	const isPasswordMatched = await bcrypt.compare(password, user.password);

	if (!isPasswordMatched) {
		throw new AppError(httpStatus.FORBIDDEN, "Invalid email or password");
	}

	const lastLoginAt = new Date();

	await prisma.user.update({
		where: {
			id: user.id,
		},
		data: {
			lastLoginAt,
		},
	});

	const authSession = await authUtils.createAuthSession({ user });
	return authSession;
};

// google login
const googleLogin = async (payload: IGoogleLoginPayload) => {
	let googleIdTokenPayload: TokenPayload | null | undefined = null;

	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.idToken,
			audience: config.google_client_id,
		});

		googleIdTokenPayload = ticket.getPayload();
	} catch (error) {
		console.error("Google ID Token Verification Failed:", error);

		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid Or Expired Google ID Token");
	}

	if (!googleIdTokenPayload) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid Or Expired Google ID Token");
	}

	if (!googleIdTokenPayload.sub) {
		throw new AppError(httpStatus.BAD_REQUEST, "Google User ID Not Found");
	}

	if (!googleIdTokenPayload.email) {
		throw new AppError(httpStatus.BAD_REQUEST, "Google Email Not Found");
	}

	if (!googleIdTokenPayload.name) {
		throw new AppError(httpStatus.BAD_REQUEST, "Google User Name Not Found");
	}

	if (!googleIdTokenPayload.email_verified) {
		throw new AppError(httpStatus.FORBIDDEN, "Google Email Is Not Verified");
	}

	const googleId = googleIdTokenPayload.sub;
	const email = googleIdTokenPayload.email;
	const name = googleIdTokenPayload.name;

	// 3. Find Existing Google User
	const existingGoogleUser = await prisma.user.findFirst({
		where: {
			email,
			role: UserRole.CUSTOMER,
			googleId,
		},
	});

	let user = existingGoogleUser;

	if (!existingGoogleUser) {
		const existingCredentialsUser = await prisma.user.findFirst({
			where: {
				email,
				role: UserRole.CUSTOMER,
				authMethod: AuthMethod.CREDENTIALS,
			},
		});

		if (existingCredentialsUser) {
			if (!existingCredentialsUser.isEmailVerified) {
				throw new AppError(httpStatus.FORBIDDEN, "Email Not Verified");
			}

			if (existingCredentialsUser.status !== UserStatus.ACTIVE) {
				throw new AppError(httpStatus.FORBIDDEN, "User Suspended Or Deleted. Please Contact Us");
			}

			user = await prisma.user.update({
				where: {
					id: existingCredentialsUser.id,
				},
				data: {
					googleId,
				},
			});
		} else {
			const deletionDeadline = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
			user = await prisma.user.create({
				data: {
					name,
					email,
					googleId,
					role: UserRole.CUSTOMER,
					status: UserStatus.ACTIVE,
					isEmailVerified: true,
					authMethod: AuthMethod.GOOGLE,
					customer: { create: { deletionDeadline } },
				},
			});
			// --------------------------------------------------------
			// Registration Success Email
			// --------------------------------------------------------

			const templateData = {
				name: user.name,
				email: user.email,
				role: user.role,
				status: user.status,
				deletionDeadline,
			};

			await sendTemplateEmail({
				to: user.email,
				subject: "Welcome to SwiftCourier — Registration Successful",
				templateName: "registration-success",
				data: templateData,
			});
		}
	}

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
	}

	if (user.status !== UserStatus.ACTIVE) {
		throw new AppError(httpStatus.FORBIDDEN, "User Suspended Or Deleted. Please Contact Us");
	}

	user = await prisma.user.update({
		where: {
			id: user.id,
		},
		data: {
			lastLoginAt: new Date(),
		},
	});

	const authSession = await authUtils.createAuthSession({
		user,
	});

	return authSession;
};

// refresh token to accessToken
const refreshTokenToAccess = async (refreshToken: string) => {
	if (!refreshToken) {
		throw new AppError(httpStatus.NOT_FOUND, "refreshToken Not Found");
	}

	const decodedRefreshToken = jwtUtils.verifyToken(refreshToken, config.jwt_refresh_secret);

	if (!decodedRefreshToken.success || !decodedRefreshToken.data) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			config.node_env === "development" ? decodedRefreshToken.error : "Invalid refresh token",
		);
	}

	const { id } = decodedRefreshToken.data as JwtPayload;

	const user = await prisma.user.findUniqueOrThrow({
		where: {
			id,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
	}

	if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
		throw new AppError(httpStatus.UNAUTHORIZED, "User is Suspend Or Deleted");
	}

	const authSession = await authUtils.createAuthSession({ user });
	return authSession;
};

// export auth services
export const authServices = {
	registerCustomer,
	verifyEmail,
	forgotPassword,
	resetPassword,
	resendOtp,
	loginUser,
	googleLogin,
	refreshTokenToAccess,
};
