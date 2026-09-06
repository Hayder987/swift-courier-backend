import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { requestLogger } from "./app/middleware/requestLogger";
import config from "./app/config";
import httpStatus from "http-status";
import { apiRateLimiter } from "./app/middleware/apiRateLimiter";
import router from "./app/routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { findZoneFromCoordinates } from "./app/utils/zone-utils/findZoneByCoordinates";
import { prisma } from "./app/lib/prisma";

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

app.use("/api/v1/payments/webhook", express.raw({ type: 'application/json' }))

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

//ip address wise global api call rate limit
app.use("/api", apiRateLimiter);

// user module routes common
app.use("/api/v1", router);

app.get("/api/v1/test", async (req: Request, res: Response) => {
  // const zones = await prisma.employee.findMany({
  // 	where: {
  // 		employmentStatus : "ACTIVE",
  // 		courier :{
  // 			zoneId : "02cea330-6873-4384-b49e-d8a816d8110e"
  // 		},
  // 	},
  // });

  const zoneId = "02cea330-6873-4384-b49e-d8a816d8110e"

   const [randomCourier] = await prisma.$queryRaw<
    {
      userId: string;
      employeeId: string;
      courierId: string;
      name: string;
      email: string;
    }[]
  >`
    SELECT
      u.id AS "userId",
      e.id AS "employeeId",
      c.id AS "courierId",
      u.name,
      u.email
    FROM "employees" e
    INNER JOIN "couriers" c
      ON c."employeeId" = e.id
    INNER JOIN "users" u
      ON u.id = e."userId"
    WHERE e."employmentStatus" = 'ACTIVE'
      AND c."zoneId" = ${zoneId}
      AND c."courierAvailability" = 'AVAILABLE'
    ORDER BY RANDOM()
    LIMIT 1;
  `;

  res.status(httpStatus.OK).json({
    success: true,
    message: "Test Result",
    data: randomCourier,
  });
});

// Basic route
app.get("/", async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Welcome to Swift Courier Services",
  });
});

// using global Error
app.use(globalErrorHandler);
app.use(notFound);

export default app;
