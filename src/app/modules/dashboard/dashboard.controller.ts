import httpStatus from "http-status";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import { dashboardService } from "./dashboard.service";
import { dashboardValidation } from "./dashboard.validation";

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
	const parsedQuery = dashboardValidation.dashboardQueryZodSchema.safeParse(req.query);

	if (!parsedQuery.success) {
		sendResponse(res, {
			statusCode: httpStatus.BAD_REQUEST,
			success: false,
			message: "Invalid dashboard query!",
			data: parsedQuery.error.issues,
		});

		return;
	}

	const result = await dashboardService.getDashboardStats(parsedQuery.data);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Dashboard statistics retrieved successfully!",
		data: result,
	});
});

export const dashboardController = {
	getDashboardStats,
};
