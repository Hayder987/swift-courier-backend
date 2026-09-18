import httpStatus from "http-status";
import type { Request, Response } from "express";
import { ContactService } from "./contact.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const createContact = catchAsync(async (req: Request, res: Response) => {
	const result = await ContactService.createContact(req.body);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Contact message submitted successfully.",
		data: result,
	});
});

const getAllContacts = catchAsync(async (req: Request, res: Response) => {
	const query = req.query;
	const result = await ContactService.getAllContacts(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "All Contacts retrieved successfully.",
		data: result,
	});
});

const getContactById = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;

	const result = await ContactService.getContactById(id as string);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Contact retrieved successfully.",
		data: result,
	});
});

const deleteContact = catchAsync(async (req: Request, res: Response) => {
	const { id } = req.params;

	await ContactService.deleteContact(id as string);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Contact deleted successfully.",
		data: null,
	});
});

export const ContactController = {
	createContact,
	getAllContacts,
	getContactById,
	deleteContact,
};
