import { z } from "zod";

export const courierProfileZodSchema = z.object({
	permanentAddress: z
		.string()
		.trim()
		.min(5, "Permanent address must be at least 5 characters")
		.max(255, "Permanent address cannot exceed 255 characters"),

	permanentCity: z
		.string()
		.trim()
		.min(2, "Permanent city must be at least 2 characters")
		.max(100, "Permanent city cannot exceed 100 characters"),

	vehicleLicenseNumber: z
		.string()
		.trim()
		.min(5, "Vehicle license number must be at least 5 characters")
		.max(50, "Vehicle license number cannot exceed 50 characters"),

	qualifications: z
		.string()
		.trim()
		.min(2, "Qualifications must be at least 2 characters")
		.max(255, "Qualifications cannot exceed 255 characters"),
});

export type ICourierProfilePayload = z.infer<typeof courierProfileZodSchema>;

const approvedCourierZodSchema = z.object({
	status: z.enum(["APPROVED", "REJECTED"]),
});

export const employeeValidation = {
	courierProfileZodSchema,
	approvedCourierZodSchema,
};
