import type { Request, Response } from "express";
import httpStatus from "http-status";
import logger from "../utils/logger";
import { format } from "date-fns";

export const notFound = (req: Request, res: Response) => {
  const statusCode = httpStatus.NOT_FOUND;

  logger.warn("Route not found", {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.status(statusCode).json({
    success: false,
    message: "The requested route was not found.",
    body: {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      timestamp: format(new Date(), "dd MMM yyyy, hh:mm:ss a"),
    },
  });
};
