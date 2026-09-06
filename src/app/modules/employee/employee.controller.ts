import httpStatus from "http-status";
import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { employeeService } from "./employee.service";
import { sendResponse } from "../../utils/sendResponse";
import { employeeValidation } from "./employee.validation";
import { AppError } from "../../utils/AppError";

// apply for courier
const applyForCourier = catchAsync(async (req: Request, res: Response) => {
	const files = req.files as { [fieldname: string]: Express.Multer.File[] };
	console.log({ files });
	const resume = files?.["resume"] ? files["resume"][0] : null;
	const vehicleDocuments = files?.["vehicleDocuments"] || [];
	const nationalidPic = files?.["nationalidPic"] || [];
	const user = req.user!;

	const zodValidationResult = employeeValidation.courierProfileZodSchema.safeParse(
		JSON.parse(req.body.data),
	);

	if (!zodValidationResult.success) {
		throw new AppError(httpStatus.BAD_REQUEST, zodValidationResult.error.issues[0].message);
	}

	const payload = zodValidationResult.data;

	const result = await employeeService.applyForCourier(
		payload,
		resume,
		vehicleDocuments,
		nationalidPic,
		user,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `Your Application Submit SuccessFully For COURIER Role`,
		data: result,
	});
});

// apply for courier
const approvedCourier = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;
	const payload = req.body;
	const empId = req.params.id;

	const result = await employeeService.approvedCourier(payload, user, empId as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `Courier Application Operation SuccessFully To ${payload.status}`,
		data: result,
	});
});

// get all applicant
const getAllEmployeeApplicant = catchAsync(async (req: Request, res: Response) => {
	const query = req.query!;

	const result = await employeeService.getAllEmployeeApplicant(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `All Applicant Retrieve SuccessFully`,
		data: result.data,
		meta: result.meta,
	});
});

// get all applicant
const getAllEmployees = catchAsync(async (req: Request, res: Response) => {
	const query = req.query!;

	const result = await employeeService.getAllEmployees(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `All Employee Retrieve SuccessFully`,
		data: result.data,
		meta: result.meta,
	});
});

// get all applicant
const getEmployeeById = catchAsync(async (req: Request, res: Response) => {
	const empId = req.params.id!;

	const result = await employeeService.getEmployeeById(empId as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `Applicant Retrieve SuccessFully`,
		data: result,
	});
});

// export courier controller
export const employeeController = {
	applyForCourier,
	approvedCourier,
	getAllEmployeeApplicant,
	getAllEmployees,
	getEmployeeById,
};
