import httpStatus from "http-status";
import { ApplicationStatus, AuthMethod, SalaryType, UserRole } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";
import { passwordHash } from "./comon.utils";
import { generateEmployeeCode } from "./generateEmployeeCode";

// seed super admin
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

						salaryStructure: {
							create: {
								salaryType: SalaryType.FIXED,
								basicSalary: 50000,
								houseAllowance: 15000,
								medicalAllowance: 5000,
								transportAllowance: 6000,
								perDeliveryAmount: 0,
							},
						},
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

// seed test admin
export const seedTestAdmin = async () => {
	try {
		const isTestAdminExist = await prisma.user.findFirst({
			where: {
				role: UserRole.ADMIN,
			},
		});

		if (isTestAdminExist) {
			console.log("Admin Already Exist");
			return;
		}

		const name = config.test_admin_name;
		const email = config.test_admin_email;
		const password = config.test_admin_password;
		const phone = config.test_admin_phone;

		if (!name || !email || !password || !phone) {
			throw new AppError(
				httpStatus.INTERNAL_SERVER_ERROR,
				"Test Admin Name , Email, Password, Phone Missing In Env File!!!",
			);
		}

		const hashPassword = await passwordHash(password);
		const employeeCode = await generateEmployeeCode();

		const testAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashPassword,
				phone,
				isEmailVerified: true,
				role: UserRole.ADMIN,
				authMethod: AuthMethod.CREDENTIALS,
				isEmployee: true,

				employee: {
					create: {
						employeeCode,
						joinAt: new Date(),

						salaryStructure: {
							create: {
								salaryType: SalaryType.FIXED,
								basicSalary: 30000,
								houseAllowance: 8000,
								medicalAllowance: 4000,
								transportAllowance: 5000,
								perDeliveryAmount: 0,
							},
						},
					},
				},
			},
		});

		console.log({
			success: true,
			message: "Test Admin Created",
			data: testAdmin,
		});
	} catch (error) {
		console.log("Error Seeding Test Admin : ", error);

		await prisma.user.delete({
			where: {
				email: config.test_admin_email,
			},
		});
	}
};

// seed TestCourier
export const seedTestCourier = async () => {
	try {
		const isTestCourierExist = await prisma.user.findFirst({
			where: {
				role: UserRole.COURIER,
			},
		});

		if (isTestCourierExist) {
			console.log("Courier Already Exist");
			return;
		}

		const name = config.test_courier_dha_zone_name;
		const email = config.test_courier_dha_zone_email;
		const password = config.test_courier_dha_zone_password;
		const phone = config.test_courier_dha_zone_phone;

		if (!name || !email || !password || !phone) {
			throw new AppError(
				httpStatus.INTERNAL_SERVER_ERROR,
				"Test Courier Name , Email, Password, Phone Missing In Env File!!!",
			);
		}

		const hashPassword = await passwordHash(password);
		const employeeCode = await generateEmployeeCode();

		const testCourier = await prisma.user.create({
			data: {
				name,
				email,
				password: hashPassword,
				phone,
				isEmailVerified: true,
				role: UserRole.COURIER,
				authMethod: AuthMethod.CREDENTIALS,
				isEmployee: true,

				employee: {
					create: {
						employeeCode,
						joinAt: new Date(),

						salaryStructure: {
							create: {
								salaryType: SalaryType.BASE_PLUS_DELIVERY,
								basicSalary: 12000,
								houseAllowance: 4000,
								medicalAllowance: 1500,
								transportAllowance: 4000,
								perDeliveryAmount: 0,
							},
						},
						courier: {
							create: {
								name,
								email,
								vehicleLicenseNumber: "Trx-1125252",
								qualifications: "Msc",
								zoneId: "02cea330-6873-4384-b49e-d8a816d8110e",
								applicationStatus: ApplicationStatus.APPROVED,
							},
						},
					},
				},
			},
		});

		console.log({
			success: true,
			message: "Test Courier Created",
			data: testCourier,
		});
	} catch (error) {
		console.log("Error Seeding Courier : ", error);

		await prisma.user.delete({
			where: {
				email: config.test_courier_dha_zone_email,
			},
		});
	}
};
