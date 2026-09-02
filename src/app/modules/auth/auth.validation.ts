import { z } from "zod";

const registerZodSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters long")
      .max(80, "Name must not exceed 80 characters")
      .regex(
        /^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/,
        "Name can only contain letters, spaces, dots, apostrophes, and hyphens",
      ),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address")
      .max(255, "Email must not exceed 255 characters"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(60, "Password must not exceed 60 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),

    phone: z
      .string()
      .trim()
      .regex(
        /^\+[1-9]\d{7,14}$/,
        "Phone number must be in valid international E.164 format, e.g. +8801771814597",
      ),
  })
  .strict();

export type IRegisterPayload = z.infer<typeof registerZodSchema>;

// verify EmailSchema
const verifyEmailZodSchema = z.object({
	email: z
		.string()
		.trim()
		.toLowerCase()
		.email("Please provide a valid email address"),

	otp: z
		.string()
		.trim()
		.length(6, "OTP must be exactly 6 digits")
		.regex(/^\d{6}$/, "OTP must contain only numbers"),
});

export type IVerifyEmailPayload = z.infer<typeof verifyEmailZodSchema>

export const authValidation = {
  registerZodSchema,
  verifyEmailZodSchema
};
