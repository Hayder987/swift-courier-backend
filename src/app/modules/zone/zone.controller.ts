import httpStatus from "http-status";
import type { Request, Response } from "express";
import { zoneServices } from "./zone.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const createZone = catchAsync(async (req: Request, res: Response) => {
	const result = await zoneServices.createZone(req.body);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Zone created successfully",
		data: result,
	});
});

const getAllZones = catchAsync(async (req: Request, res: Response) => {
	const result = await zoneServices.getAllZones();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Zones retrieved successfully",
		data: result,
	});
});

const getZoneById = catchAsync(async (req: Request, res: Response) => {
	const result = await zoneServices.getZoneById(req.params.zoneId as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Zone retrieved successfully",
		data: result,
	});
});

const updateZone = catchAsync(async (req: Request, res: Response) => {
	const result = await zoneServices.updateZone(req.params.zoneId as string, req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Zone updated successfully",
		data: result,
	});
});

const deleteZone = catchAsync(async (req: Request, res: Response) => {
	await zoneServices.deleteZone(req.params.zoneId as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Zone deleted successfully",
		data: null,
	});
});

export const zoneController = {
	createZone,
	getAllZones,
	getZoneById,
	updateZone,
	deleteZone,
};
