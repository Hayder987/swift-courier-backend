import z from "zod";

// change my password schema
const changePasswordZodSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required."),

		newPassword: z
			.string()
			.min(8, "Password Must Minimum 8 Characters Long.")
			.regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
			.regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")

			.regex(/[0-9]/, "Password must contain atleast 1 Number")
			.regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),

		reEnterNewPassword: z
			.string()
			.min(8, "Password Must Minimum 8 Characters Long.")
			.regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
			.regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")

			.regex(/[0-9]/, "Password must contain atleast 1 Number")
			.regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),
	})
	.refine((data) => data.newPassword === data.reEnterNewPassword, {
		message: "New password and re-entered password do not match.",
		path: ["reEnterNewPassword"],
	})
	.refine((data) => data.currentPassword !== data.newPassword, {
		message: "New password must be different from your current password.",
		path: ["newPassword"],
	});


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

export const userValidation = {
	changePasswordZodSchema,
	liveLocationZodSchema
};
