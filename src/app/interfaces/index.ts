import { UserRole } from "../../generated/prisma/enums";

export interface IReqUserPayload {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	isEmailVerified: boolean;
	isEmployee: boolean;
}
