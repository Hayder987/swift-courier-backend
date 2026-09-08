import type { ErrorRequestHandler } from "express";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client";
import config from "../config";
import { AppError } from "../utils/AppError";
import logger from "../utils/logger";

type ErrorDetail = {
	field?: string;
	message: string;
};

const getZodErrors = (error: ZodError): ErrorDetail[] => {
	return error.issues.map((issue) => ({
		field: issue.path.length > 0 ? issue.path.join(".") : undefined,
		message: issue.message,
	}));
};

const getPrismaTarget = (error: Prisma.PrismaClientKnownRequestError): string | undefined => {
	if (Array.isArray(error.meta?.target)) {
		return error.meta.target.join(", ");
	}

	if (typeof error.meta?.target === "string") {
		return error.meta.target;
	}

	return undefined;
};

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
	let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
	let message = "Something went wrong";
	let errors: ErrorDetail[] = [];
	let errorName = "InternalServerError";

	// AppError ------------------------------------->
	if (err instanceof AppError) {
		statusCode = err.statusCode;
		message = err.message;
		errorName = err.name;

		errors = [
			{
				message: err.message,
			},
		];
	}

	// Zod Validation Error
	else if (err instanceof ZodError) {
		statusCode = httpStatus.BAD_REQUEST;
		message = "Validation failed";
		errorName = "ZodError";

		errors = getZodErrors(err);
	}

	// Prisma Validation Error
	else if (err instanceof Prisma.PrismaClientValidationError) {
		statusCode = httpStatus.BAD_REQUEST;
		message = "Invalid data provided";
		errorName = "PrismaClientValidationError";

		errors = [
			{
				message,
			},
		];
	}

	// Prisma Known Request Error -------------------------->
	else if (err instanceof Prisma.PrismaClientKnownRequestError) {
		errorName = "PrismaClientKnownRequestError";

		switch (err.code) {
			// Unique constraint violation
			case "P2002": {
				statusCode = httpStatus.CONFLICT;

				const target = getPrismaTarget(err);

				message = target
					? `A record with this ${target} already exists`
					: "A record with the provided value already exists.";

				errors = [
					{
						field: target,
						message,
					},
				];

				break;
			}

			// Foreign key constraint
			case "P2003":
				statusCode = httpStatus.BAD_REQUEST;
				message = "Related record does not exist.";

				errors = [
					{
						message,
					},
				];

				break;

			// Record not found
			case "P2025":
				statusCode = httpStatus.NOT_FOUND;
				message = "The requested record was not found.";

				errors = [
					{
						message,
					},
				];

				break;

			// Required relation violation
			case "P2014":
				statusCode = httpStatus.BAD_REQUEST;
				message = "The requested operation violates a required relation.";

				errors = [
					{
						message,
					},
				];

				break;

			// Invalid field value
			case "P2006":
				statusCode = httpStatus.BAD_REQUEST;
				message = "Invalid value provided for a database field.";

				errors = [
					{
						message,
					},
				];

				break;

			// Value too long
			case "P2000":
				statusCode = httpStatus.BAD_REQUEST;
				message = "The provided value is too long.";

				errors = [
					{
						message,
					},
				];

				break;

			// Required value missing
			case "P2011":
				statusCode = httpStatus.BAD_REQUEST;
				message = "A required database field is missing.";

				errors = [
					{
						message,
					},
				];

				break;

			default:
				statusCode = httpStatus.BAD_REQUEST;
				message = "Database request failed.";

				errors = [
					{
						message,
					},
				];

				break;
		}
	}

	// Prisma Initialization Error ---------------------------->
	else if (err instanceof Prisma.PrismaClientInitializationError) {
		statusCode = httpStatus.SERVICE_UNAVAILABLE;
		errorName = "PrismaClientInitializationError";

		switch (err.errorCode) {
			case "P1000":
				message = "Database authentication failed.";
				break;

			case "P1001":
				message = "Database server is currently unavailable.";
				break;

			case "P1002":
				message = "Database server connection timed out.";
				break;

			default:
				message = "Database service is currently unavailable.";
				break;
		}

		errors = [
			{
				message,
			},
		];
	}

	// Prisma Unknown Request Error ------------------------------->
	else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
		statusCode = httpStatus.INTERNAL_SERVER_ERROR;
		message = "An unexpected database error occurred.";
		errorName = "PrismaClientUnknownRequestError";

		errors = [
			{
				message,
			},
		];
	}

	// Prisma Rust Panic Error ----------------------------------->
	else if (err instanceof Prisma.PrismaClientRustPanicError) {
		statusCode = httpStatus.INTERNAL_SERVER_ERROR;
		message = "An unexpected database error occurred.";
		errorName = "PrismaClientRustPanicError";

		errors = [
			{
				message,
			},
		];
	}

	// JWT Errors ---------------------------------------->
	else if (err instanceof jwt.TokenExpiredError) {
		statusCode = httpStatus.UNAUTHORIZED;
		message = "Authentication token has expired.";
		errorName = "TokenExpiredError";

		errors = [
			{
				message,
			},
		];
	} else if (err instanceof jwt.JsonWebTokenError) {
		statusCode = httpStatus.UNAUTHORIZED;
		message = "Invalid authentication token.";
		errorName = "JsonWebTokenError";

		errors = [
			{
				message,
			},
		];
	}

	// JSON Body Parser Error ----------------------------->
	else if (err instanceof SyntaxError && "body" in err) {
		statusCode = httpStatus.BAD_REQUEST;
		message = "Invalid JSON payload.";
		errorName = "SyntaxError";

		errors = [
			{
				message,
			},
		];
	}

	// Normal JavaScript Error ------------------------------>
	else if (err instanceof Error) {
		statusCode = httpStatus.INTERNAL_SERVER_ERROR;
		message = err.message || "Something went wrong";
		errorName = err.name || "Error";

		errors = [
			{
				message,
			},
		];
	}

	// Unknown / Non-Error Throwable ------------------------>
	else {
		statusCode = httpStatus.INTERNAL_SERVER_ERROR;
		message = "Something went wrong";
		errorName = "UnknownError";

		errors = [
			{
				message,
			},
		];
	}

	// Production Safety -------------------------------->
	const isDevelopment = config.node_env === "development";

	/*
	 * Never expose internal database errors, stack traces,
	 * file paths, SQL queries, secrets, etc. in production.
	 *
	 * Detailed information is logged instead.
	 */

	if (statusCode >= httpStatus.INTERNAL_SERVER_ERROR && !isDevelopment) {
		message = "Something went wrong";

		errors = [
			{
				message,
			},
		];
	}

	// Logger ----------------------------------->
	logger.error({
		type: "GLOBAL_ERROR",
		name: errorName,
		message: err instanceof Error ? err.message : message,
		statusCode,
		request: {
			method: req.method,
			url: req.originalUrl,
			ip: req.ip,
			userAgent: req.get("user-agent"),
		},
		stack: err instanceof Error ? err.stack : undefined,
		...(isDevelopment && {
			error: err,
		}),
	});

	// Response ------------------------------>
	return res.status(statusCode).json({
		success: false,
		message,
		errors,
	});
};
