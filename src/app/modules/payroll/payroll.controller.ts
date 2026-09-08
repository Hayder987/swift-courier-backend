import type { Request, Response } from "express";
import httpStatus from "http-status";
import { payrollService } from "./payroll.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// generate payroll
const generatePayroll = catchAsync(async (req: Request, res: Response) => {
	const result = await payrollService.generatePayroll(req.body, req.user?.id as string);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Payroll generated successfully",
		data: result,
	});
});

// get my own salary
const getMySalary = catchAsync(async (req: Request, res: Response) => {
	const query = {
		month: req.query.month ? Number(req.query.month) : undefined,
		year: req.query.year ? Number(req.query.year) : undefined,
	};

	const result = await payrollService.getMySalary(req.user?.id as string, query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "My salary retrieved successfully",
		data: result,
	});
});

// get all paid salary
const getPaidSalary = catchAsync(async (req: Request, res: Response) => {
	const result = await payrollService.getPaidPayrolls(req.query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Paid salary retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

// pay salary
const paySalary = catchAsync(async (req: Request, res: Response) => {
	const result = await payrollService.paySalary(req.params.id as string, req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Salary paid successfully",
		data: result,
	});
});

export const payrollController = {
	generatePayroll,
	getMySalary,
	getPaidSalary,
	paySalary,
};
