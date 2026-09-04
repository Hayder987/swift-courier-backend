import type { UserRole } from "../../generated/prisma/enums";

export interface IReqUserPayload {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	isEmailVerified: boolean;
	isEmployee: boolean;
}

export interface IQuery {
	searchTerm?: string;
	page?: string;
	limit?: string;
	sortOrder?: string;
	sortBy?: string;

	[key: string]: any;
}
