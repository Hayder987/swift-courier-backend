import httpStatus from "http-status";
import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { aiAssistantService } from "./ai-assistant.service";
import type { IAIChatRequest } from "./ai-assistant.interface";

const chat = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IAIChatRequest;

	const result = await aiAssistantService.chat(payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "AI assistant replied successfully",
		data: result,
	});
});

export const aiAssistantControllers = { chat };
