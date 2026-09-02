import { UserRole } from "../../../generated/prisma/enums";

export interface IForgotPassword {
	email: string;
}

export interface IResetPassword {
	email: string;
	otp: string;
	newPassword: string;
}

export interface IResendOtp {
	email: string;
	emailVerifyOtp: boolean;
}

export interface ICreateAuthSessionParams {
  user: {
    id: string;
    name: string;
    email: string;
    phone : string,
    role: UserRole;
    isEmailVerified: boolean;
    isEmployee : boolean;
  };
}
