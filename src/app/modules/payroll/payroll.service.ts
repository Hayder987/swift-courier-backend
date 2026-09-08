import httpStatus from "http-status";
import type {
	IGeneratePayrollPayload,
	IPayPayrollPayload,
	IMySalaryQuery,
	IPaidSalaryQuery,
} from "./payroll.interface";
import { addSalaryEmailToQueue } from "../../utils/email/email.queue";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";
import {
	AuditAction,
	NotificationType,
	PayrollStatus,
	Prisma,
} from "../../../generated/prisma/client";
import type { PayrollWhereInput } from "../../../generated/prisma/models";

// generate payroll
const generatePayroll = async (payload: IGeneratePayrollPayload, adminUserId: string) => {
	const { month, year, bonus = 0, totalDeduction = 0 } = payload;

	const now = new Date();

	if (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1)) {
		throw new AppError(httpStatus.BAD_REQUEST, "Cannot generate payroll for a future month");
	}

	const employees = await prisma.employee.findMany({
		where: {
			employmentStatus: "ACTIVE",

			user: {
				isDeleted: false,
				status: "ACTIVE",
			},
		},

		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},

			salaryStructure: true,

			courier: true,
		},
	});

	if (!employees.length) {
		throw new AppError(httpStatus.NOT_FOUND, "No active employees found");
	}

	const startDate = new Date(year, month - 1, 1);
	const endDate = new Date(year, month, 1);
	const payrolls = [];
	const emailJobs = [];

	for (const employee of employees) {
		if (!employee.salaryStructure) {
			continue;
		}

		const salary = employee.salaryStructure;

		const existingPayroll = await prisma.payroll.findUnique({
			where: {
				employeeId_month_year: {
					employeeId: employee.id,
					month,
					year,
				},
			},
		});

		if (existingPayroll) {
			payrolls.push(existingPayroll);

			continue;
		}

		let totalDeliveries = 0;
		let successfulDeliveries = 0;
		let deliveryEarning = new Prisma.Decimal(0);

		/**
		 * Courier delivery earning
		 */

		if (employee.courier) {
			const deliveries = await prisma.shipment.findMany({
				where: {
					deliveryCourierId: employee.courier.id,

					updatedAt: {
						gte: startDate,
						lt: endDate,
					},

					status: {
						in: ["DELIVERED", "DELIVERY_FAILED"],
					},
				},

				select: {
					status: true,
				},
			});

			totalDeliveries = deliveries.length;

			successfulDeliveries = deliveries.filter((item) => item.status === "DELIVERED").length;

			deliveryEarning = salary.perDeliveryAmount.mul(successfulDeliveries);
			totalDeliveries = deliveries.length;
			successfulDeliveries = deliveries.length;
			deliveryEarning = salary.perDeliveryAmount.mul(successfulDeliveries);
		}

		const basicSalary = salary.basicSalary;
		const totalAllowance = salary.houseAllowance
			.add(salary.medicalAllowance)
			.add(salary.transportAllowance);
		const bonusDecimal = new Prisma.Decimal(bonus);
		const deductionDecimal = new Prisma.Decimal(totalDeduction);

		const grossSalary = basicSalary.add(totalAllowance).add(deliveryEarning).add(bonusDecimal);

		const netSalary = grossSalary.sub(deductionDecimal);

		const payroll = await prisma.payroll.create({
			data: {
				employeeId: employee.id,
				month,
				year,
				basicSalary,
				totalAllowance,
				deliveryEarning,
				bonus: bonusDecimal,
				grossSalary,
				totalDeduction: deductionDecimal,
				netSalary,
				totalDeliveries,
				successfulDeliveries,
				status: "PENDING",
			},
		});

		payrolls.push(payroll);

		//   Employee notification

		await prisma.notification.create({
			data: {
				userId: employee.user.id,
				title: "Salary Generated",
				message: `Your salary for ${month}/${year} has been generated. Net salary: ৳${netSalary.toFixed(2)}`,
				type: NotificationType.PAYMENT,

				notificationDeadline: new Date(year, month, 5),
			},
		});

		// Employee email data
		emailJobs.push({
			name: employee.user.name,
			email: employee.user.email,
			employeeCode: employee.employeeCode,
			month,
			year,
			basicSalary: basicSalary.toFixed(2),
			totalAllowance: totalAllowance.toFixed(2),
			deliveryEarning: deliveryEarning.toFixed(2),
			bonus: bonusDecimal.toFixed(2),
			grossSalary: grossSalary.toFixed(2),
			totalDeduction: deductionDecimal.toFixed(2),
			netSalary: netSalary.toFixed(2),
			totalDeliveries,
			successfulDeliveries,
		});
	}

	if (!payrolls.length) {
		throw new AppError(httpStatus.BAD_REQUEST, "No payroll generated");
	}

	await prisma.auditLog.create({
		data: {
			userId: adminUserId,
			action: AuditAction.PAYMENT,
			type: "CURRENT",
			resource: "PAYROLL",
			description: `Payroll generated for ${month}/${year} for ${payrolls.length} employees.`,
			metadata: {
				month,
				year,
				employeeCount: payrolls.length,
				totalEmails: emailJobs.length,
			},
		},
	});

	for (const emailData of emailJobs) {
		await addSalaryEmailToQueue(emailData);
	}

	return {
		month,
		year,
		generated: payrolls.length,
		emailsQueued: emailJobs.length,
		payrolls,
	};
};

// My Salary
const getMySalary = async (userId: string, query: IMySalaryQuery) => {
	const employee = await prisma.employee.findUnique({
		where: {
			userId,
		},
	});

	if (!employee) {
		throw new AppError(httpStatus.NOT_FOUND, "Employee profile not found");
	}

	const andConditions: Prisma.PayrollWhereInput[] = [
		{
			employeeId: employee.id,
		},
	];

	if (query.month) {
		andConditions.push({
			month: query.month,
		});
	}

	if (query.year) {
		andConditions.push({
			year: query.year,
		});
	}

	return prisma.payroll.findMany({
		where: {
			AND: andConditions,
		},

		orderBy: [
			{
				year: "desc",
			},

			{
				month: "desc",
			},
		],
	});
};

// Get paid salary
const getPaidPayrolls = async (query: IPaidSalaryQuery) => {
	const month = query.month ? Number(query.month) : undefined;
	const year = query.year ? Number(query.year) : undefined;
	const page = query.page ? Number(query.page) : 1;
	const limit = query.limit ? Number(query.limit) : 20;
	const skip = (page - 1) * limit;

	const andConditions: PayrollWhereInput[] = [
		{
			status: PayrollStatus.PAID,
		},
	];

	if (month) {
		andConditions.push({
			month,
		});
	}

	if (year) {
		andConditions.push({
			year,
		});
	}

	const whereConditions: Prisma.PayrollWhereInput = {
		AND: andConditions,
	};

	const [payrolls, total] = await prisma.$transaction([
		prisma.payroll.findMany({
			where: whereConditions,

			include: {
				employee: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								phone: true,
							},
						},
					},
				},
			},

			orderBy: [
				{
					year: "desc",
				},
				{
					month: "desc",
				},
				{
					paidAt: "desc",
				},
			],

			skip,

			take: limit,
		}),

		prisma.payroll.count({
			where: whereConditions,
		}),
	]);

	return {
		data: payrolls,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

// Pay Salary
const paySalary = async (payrollId: string, payload: IPayPayrollPayload) => {
	const payroll = await prisma.payroll.findUnique({
		where: {
			id: payrollId,
		},
	});

	if (!payroll) {
		throw new AppError(httpStatus.NOT_FOUND, "Payroll not found");
	}

	if (payroll.status === "PAID") {
		throw new AppError(httpStatus.BAD_REQUEST, "This salary is already paid");
	}

	return prisma.payroll.update({
		where: {
			id: payrollId,
		},

		data: {
			status: PayrollStatus.PAID,
			paidAt: new Date(),
			paymentReference: payload.paymentReference ?? null,
		},
	});
};

export const payrollService = {
	generatePayroll,
	getMySalary,
	getPaidPayrolls,
	paySalary,
};
