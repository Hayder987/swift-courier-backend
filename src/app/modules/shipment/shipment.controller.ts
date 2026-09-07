import httpStatus from "http-status";
import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { shipmentServices } from "./shipment.service";
import { shipmentValidation } from "./shipment.validation";
import { AppError } from "../../utils/AppError";

// create shipment
const createShipment = catchAsync(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File;
  const userId = req.user?.id;

  const zodValidationResult =
    shipmentValidation.createShipmentZodSchema.safeParse(
      JSON.parse(req.body.data),
    );

  if (!zodValidationResult.success) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      zodValidationResult.error.issues[0].message,
    );
  }

  const payload = zodValidationResult.data;

  const result = await shipmentServices.createShipment(
    file?.buffer,
    payload,
    userId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Shipment created and waiting For Admin Payment Approved",
    data: result,
  });
});

// update status by admin
const updateShipmentStatus = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user!;
  const shipmentId = req.params.id;

  const result = await shipmentServices.updateShipmentByAdmin(
    payload,
    user,
    shipmentId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `This Shipment Update To ${payload.status} SuccessFully!`,
    data: result,
  });
});

// update status by courier
const updateShipmentStatusCourier = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user!;
    const shipmentId = req.params.id;

    const result = await shipmentServices.updateShipmentByCourier(
      payload,
      user,
      shipmentId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `This Shipment Update To ${payload.status} SuccessFully!`,
      data: result,
    });
  },
);

// update status by admin
const assignCourier = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const shipmentId = req.params.id;

  const result = await shipmentServices.assignCourierOnShipment(
    user,
    shipmentId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `SuccessFully Assign Courier On this Shipment!`,
    data: result,
  });
});

// get shipment by id
const getShipmentById = catchAsync(async (req: Request, res: Response) => {
  const { shipmentId } = req.params;

  const result = await shipmentServices.getShipmentById(shipmentId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shipment Retrieved Successfully!",
    data: result,
  });
});

// get all shipment
const getAllShipments = catchAsync(async (req: Request, res: Response) => {
  const result = await shipmentServices.getAllShipments(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shipments Retrieved Successfully!",
    data: result.data,
    meta: result.meta,
  });
});

// export shipment controller
export const shipmentController = {
  createShipment,
  updateShipmentStatus,
  updateShipmentStatusCourier,
  assignCourier,
  getShipmentById,
  getAllShipments,
};
