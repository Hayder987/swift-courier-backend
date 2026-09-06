import z from "zod";

export const createCheckoutSessionValidationSchema = z
	.object({
		shipmentId: z.uuid(),
	})
	.strict();
