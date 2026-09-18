import { z } from "zod";

 const contactSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters long.")
    .max(100, "Title must not exceed 100 characters."),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),

  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters long.")
    .max(1000, "Description must not exceed 1000 characters."),
});

export type IContactPayload = z.infer<typeof contactSchema>;

export const serviceValidation = {
    contactSchema
}