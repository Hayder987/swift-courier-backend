import { z } from "zod";

const createZoneValidationSchema = z.object({
	name: z.string().trim().min(2, "Zone name must be at least 2 characters."),

	code: z
		.string()
		.trim()
		.min(2, "Zone code must be at least 2 characters.")
		.max(20, "Zone code cannot exceed 20 characters.")
		.regex(/^[A-Z0-9-]+$/, "Code must contain only uppercase letters, numbers and hyphen."),

	address: z.string().trim().min(3, "Address is required."),

	radiusKm: z
		.number()
		.int("Radius must be an integer.")
		.min(1, "Radius must be at least 1 KM.")
		.max(500, "Radius cannot exceed 500 KM."),

	isActive: z.boolean().optional(),
});

const updateZoneValidationSchema = z.object({
	name: z.string().trim().min(2, "Zone name must be at least 2 characters.").optional(),

	code: z
		.string()
		.trim()
		.min(2, "Zone code must be at least 2 characters.")
		.max(20, "Zone code cannot exceed 20 characters.")
		.regex(/^[A-Z0-9-]+$/, "Invalid zone code.")
		.optional(),

	address: z.string().trim().min(3, "Address must be at least 3 characters.").optional(),

	radiusKm: z
		.number()
		.int("Radius must be an integer.")
		.min(1, "Radius must be at least 1 KM.")
		.max(500, "Radius cannot exceed 500 KM.")
		.optional(),

	isActive: z.boolean().optional(),
});

export const zoneValidation = {
	createZoneValidationSchema,
	updateZoneValidationSchema,
};
