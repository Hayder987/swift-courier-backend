import httpStatus from "http-status";
import { AuthMethod, UserRole } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";
import { passwordHash } from "./comon.utils";
import { generateEmployeeCode } from "./generateEmployeeCode";

export const seedSuperAdmin = async () => {
	try {
		const isSuperAdminexist = await prisma.user.findFirst({
			where: {
				role: UserRole.SUPER_ADMIN,
			},
		});

		if (isSuperAdminexist) {
			console.log("Super Admin Already Exist");
			return;
		}

		const name = config.super_admin_name;
		const email = config.super_admin_email;
		const password = config.super_admin_password;
		const phone = config.super_admin_phone;

		if (!name || !email || !password || !phone) {
			throw new AppError(
				httpStatus.INTERNAL_SERVER_ERROR,
				"Super Admin Name , Email, Password, Phone Missing In Env File!!!",
			);
		}

		const hashPassword = await passwordHash(password);
		const employeeCode = await generateEmployeeCode();

		const superAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashPassword,
				phone,
				isEmailVerified: true,
				role: UserRole.SUPER_ADMIN,
				authMethod: AuthMethod.CREDENTIALS,
				isEmployee: true,
				employee: {
					create: {
						employeeCode,
						joinAt: new Date(),
					},
				},
			},
		});

		console.log({
			success: true,
			message: "Super Admin Created",
			data: superAdmin,
		});
	} catch (error) {
		console.log("Error Seeding Super Admin : ", error);

		await prisma.user.delete({
			where: {
				email: config.super_admin_email,
			},
		});
	}
};
