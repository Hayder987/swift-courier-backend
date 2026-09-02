import express, { type Application, type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { requestLogger } from "./app/middleware/requestLogger";
import config from "./app/config";
import httpStatus from "http-status";
import { apiRateLimiter } from "./app/middleware/apiRateLimiter";
import router from "./app/routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";

const app: Application = express();

// using helmet middleware
app.use(
	helmet({
		crossOriginResourcePolicy: {
			policy: "cross-origin",
		},
	}),
);

app.use(requestLogger);

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

//ip address wise global api call rate limit
app.use("/api", apiRateLimiter);

// user module routes common
app.use("/api/v1", router);

// Basic route
app.get("/", async (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to Swift Courier Services",
	});
});

// using global Error
app.use(globalErrorHandler);

export default app;
