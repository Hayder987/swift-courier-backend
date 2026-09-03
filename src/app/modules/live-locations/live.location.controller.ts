import httpStatus from "http-status";
import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { locationServices } from "./live.location.service";
import { sendResponse } from "../../utils/sendResponse";

// live location
const liveLocation = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;
	const payload = req.body;

	const result = await locationServices.liveLocation(payload, user);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Live Location Generate SuccessFully!",
		data: result,
	});
});

// delete my location
const deleteMyLocation = catchAsync(async (req: Request, res: Response) => {
	await locationServices.deleteMyLocation(req.user?.id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Your Location Deleted SuccessFully!",
		data: null,
	});
});

// share my location
const updateLocationOngoing = catchAsync(async (req: Request, res: Response) => {
	const id = req.params.id;
	const result = await locationServices.updateLocationOngoing(id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Your Location Status Update To Ongoing SuccessFully!",
		data: result,
	});
});

// export controller
export const locationController = {
	liveLocation,
	deleteMyLocation,
	updateLocationOngoing,
};
