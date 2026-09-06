import httpStatus from "http-status";
import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { paymentService } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
	const customerId = req.user?.id;

	const result = await paymentService.createCheckoutSessionIntoDB(customerId as string, req.body);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Checkout session created successfully.",
		data: result,
	});
});

// handle webhooke
const handleWebhook = catchAsync(async (req: Request, res: Response) => {
	const event = req.body as Buffer;
	const signature = req.headers["stripe-signature"]!;

	if (!signature) {
		throw new AppError(httpStatus.BAD_REQUEST, "Stripe signature missing.");
	}

	await paymentService.handleWebhook(event, signature as string);

	sendResponse(res, {
		success: true,
		statusCode: 200,
		message: "Webhook triggered successfully",
		data: null,
	});
});

const getAllPayment = catchAsync(async (req: Request, res: Response) => {

	const result = await paymentService.getAllPayment(req.query);

	sendResponse(res, {
		success: true,
		statusCode: 200,
		message: "All Payment Retrieve SuccessFully!",
		data: result,
	});
});

// export controller
export const paymentController = {
	createCheckoutSession,
	handleWebhook,
    getAllPayment
};
