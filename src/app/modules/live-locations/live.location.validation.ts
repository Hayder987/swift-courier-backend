import z from "zod";

// live location zod schema
const liveLocationZodSchema = z.object({
	latitude: z
		.string()
		.trim()
		.min(1, "Latitude is required")
		.refine((value) => {
			const lat = Number(value);
			return Number.isFinite(lat) && lat >= -90 && lat <= 90;
		}, "Latitude must be between -90 and 90"),

	longitude: z
		.string()
		.trim()
		.min(1, "Longitude is required")
		.refine((value) => {
			const lng = Number(value);
			return Number.isFinite(lng) && lng >= -180 && lng <= 180;
		}, "Longitude must be between -180 and 180"),
});

// export zod schema
export const locationValidation = {
	liveLocationZodSchema,
};
