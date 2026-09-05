import httpStatus from "http-status";
import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { superAdminService } from "./superAdmin.service";

// get all audit logs
const getAllAuditLog = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;

	const result = await superAdminService.getAuditLogs(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `All Logs Retrieve Successfully`,
		data: result,
	});
});

// export audit logs
export const superAdminController = {
	getAllAuditLog,
};
