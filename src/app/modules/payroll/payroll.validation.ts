import { z } from "zod";

const currentYear = new Date().getFullYear();

const generatePayrollZodSchema = z.object({
	month: z.number().int().min(1).max(12),

	year: z
		.number()
		.int()
		.min(2020)
		.max(currentYear + 1),

	bonus: z.number().nonnegative().optional().default(0),

	totalDeduction: z.number().nonnegative().optional().default(0),
});

const payPayrollZodSchema = z.object({
	paymentReference: z.string().trim().optional(),
});

const mySalaryZodSchema = z.object({
	month: z.coerce.number().int().min(1).max(12).optional(),

	year: z.coerce
		.number()
		.int()
		.min(2020)
		.max(currentYear + 1)
		.optional(),
});

const paidSalaryZodSchema = z.object({
	month: z.coerce.number().int().min(1).max(12).optional(),

	year: z.coerce
		.number()
		.int()
		.min(2020)
		.max(currentYear + 1)
		.optional(),

	page: z.coerce.number().int().positive().optional().default(1),

	limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const payrollValidation = {
	generatePayrollZodSchema,
	payPayrollZodSchema,
	mySalaryZodSchema,
	paidSalaryZodSchema,
};
