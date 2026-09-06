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

// create user
const createEmployee = catchAsync(async (req: Request, res: Response) => {
	const result = await superAdminService.createEmployeeUser(req.body);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Employee created successfully and login credentials sent to email!",
		data: result,
	});
});

// delete admin by superAdmin
const deleteAdmin = catchAsync(async (req, res) => {
	const { userId } = req.params;

	const result = await superAdminService.deleteAdmin(userId as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Admin deleted successfully!",
		data: result,
	});
});

// export audit logs
export const superAdminController = {
	getAllAuditLog,
	createEmployee,
	deleteAdmin,
};
