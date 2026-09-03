import httpStatus from "http-status";
import { Request, Response } from "express";
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

// export controller
export const locationController = {
	liveLocation,
};
