import { z } from "zod";

const dashboardQueryZodSchema = z.object({
	period: z.enum(["7d", "30d", "90d", "1y"]).optional().default("30d"),
});

export type IDashboardQuery = z.infer<typeof dashboardQueryZodSchema>;

export const dashboardValidation = {
	dashboardQueryZodSchema,
};
