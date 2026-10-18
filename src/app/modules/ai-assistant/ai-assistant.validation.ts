import { z } from "zod";

export const aiChatValidationSchema = z.object({
	message: z.string().trim().min(1, "Message is required").max(1000, "Message is too long"),
	history: z
		.array(
			z.object({
				role: z.enum(["user", "assistant"]),
				content: z.string().max(2000, "Message content is too long"),
			}),
		)
		.max(10, "History is too long")
		.optional(),
});

export type IAIChatValidation = z.infer<typeof aiChatValidationSchema>;
