import { z } from "zod";

export const createShipmentZodSchema = z.object({
	parcelName: z
		.string()
		.trim()
		.min(2, "Parcel name must be at least 2 characters")
		.max(100, "Parcel name cannot exceed 100 characters"),

	description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional(),

	parcelWeightGM: z.coerce.number().positive("Parcel weight must be greater than 0"),

	pickupAddress: z.string().trim().min(5, "Pickup address is required"),

	pickupLat: z.coerce
		.number()
		.min(-90, "Invalid pickup latitude")
		.max(90, "Invalid pickup latitude"),

	pickupLng: z.coerce
		.number()
		.min(-180, "Invalid pickup longitude")
		.max(180, "Invalid pickup longitude"),

	deliveryAddress: z.string().trim().min(5, "Delivery address is required"),

	deliveryLat: z.coerce
		.number()
		.min(-90, "Invalid delivery latitude")
		.max(90, "Invalid delivery latitude")
		.optional(),

	deliveryLng: z.coerce
		.number()
		.min(-180, "Invalid delivery longitude")
		.max(180, "Invalid delivery longitude")
		.optional(),
});

export type ICreateShipmentPayload = z.infer<typeof createShipmentZodSchema>;

export const shipmentValidation = {
	createShipmentZodSchema,
};
