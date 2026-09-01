import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { requestLogger } from "./app/middleware/requestLogger";
import config from "./app/config";
import httpStatus from "http-status";


const app:Application = express();

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


// Basic route
app.get("/", async (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to Swift Courier Services",
	});
});


export default app;