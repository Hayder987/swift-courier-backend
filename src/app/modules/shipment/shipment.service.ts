import { IReqUserPayload } from "./../../interfaces/index";
import httpStatus from "http-status";
import sharp from "sharp";
import { generateTrackingNumber } from "../../utils/generateTrackingNumber";
import type { ICreateShipmentPayload } from "./shipment.validation";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  NotificationType,
  ShipmentStatus,
  ShipmentType,
  UserRole,
} from "../../../generated/prisma/enums";
import { IShipmentStatusAdmin } from "./shipment.interface";
import { generateDeliveryFee } from "../../utils/generateDeliveryFee";
import { notificationDeadline } from "../../utils/comon.utils";
import { sendTemplateEmail } from "../../services/sendTemplateEmail";

const createShipment = async (
  buffer: Buffer,
  payload: ICreateShipmentPayload,
  userId: string,
) => {
  if (!payload) {
    throw new AppError(httpStatus.NOT_FOUND, "Payload Data Missing!");
  }

  let cloudinaryResult: UploadApiResponse | undefined;

  try {
    // Compress + resize image
    const compressedBuffer = await sharp(buffer)
      .rotate()
      .resize({
        width: 1200,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 80,
      })
      .toBuffer();

    // cloudinary upload
    cloudinaryResult = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "auto",
            },
            async (error, result) => {
              if (error) {
                return reject(error);
              }

              if (!result) {
                return reject(new Error("No result returned from Cloudinary"));
              }

              resolve(result);
            },
          )
          .end(compressedBuffer);
      },
    );

    const trackNumber: string = await generateTrackingNumber();

    const {
      parcelName,
      description,
      parcelWeightGM,
      pickupAddress,
      pickupLat,
      pickupLng,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
    } = payload;

    const result = await prisma.shipment.create({
      data: {
        parcelName,
        description: description || "",
        parcelWeightGM,
        pickupAddress,
        pickupLat,
        pickupLng,
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        trackingNumber: trackNumber,
        imageUrl: cloudinaryResult?.secure_url,
        imagePublicId: cloudinaryResult.public_id,
        customerId: userId,
        notification: {
          create: {
            title: "New Shipment Requested",
            message:
              "New Shipment Requested For Payment",
            type: NotificationType.GENERAL,
            userId: userId,
            notificationDeadline: notificationDeadline,
          },
        },
        tracking: {
          create: {
            updatedById: userId,
            status: ShipmentStatus.CREATED,
            note: "Shipment created",
            lat: pickupLat,
            lng: pickupLng,
          },
        },
      },
      omit: {
        imagePublicId: true,
      },
    });

    return result;
  } catch (error) {
    // If Cloudinary upload was successful,
    // but any later operation failed,
    // delete the uploaded image.
    if (cloudinaryResult?.public_id) {
      try {
        await cloudinary.uploader.destroy(cloudinaryResult.public_id);
      } catch (deleteError) {
        console.error("Failed to delete Cloudinary image:", deleteError);
      }
    }

    throw error;
  }
};

const updateShipmentByAdmin = async (
  payload: IShipmentStatusAdmin,
  user: IReqUserPayload,
  shipmentId: string,
) => {
  const transactionResult = await prisma.$transaction(
    async (tx) => {
      const isExists = await tx.shipment.findFirst({
        where: {
          id: shipmentId,
          type: ShipmentType.NEW,
        },
      });

      if (!isExists) {
        throw new AppError(httpStatus.NOT_FOUND, "Shipment Not Found");
      }

      if (isExists.status === ShipmentStatus.CANCELLED) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Shipment Already Cancelled!",
        );
      }

      if (user.role === UserRole.CUSTOMER) {
        throw new AppError(httpStatus.FORBIDDEN, "You Have No Permission!");
      }

      const deleveryInfoPayload = {
        pickupLat: Number(isExists.pickupLat),
        pickupLng: Number(isExists.pickupLng),
        deliveryLat: Number(isExists.deliveryLat),
        deliveryLng: Number(isExists.deliveryLng),
        parcelWeightGM: Number(isExists.parcelWeightGM),
      };

      const deleveryInfo = await generateDeliveryFee(deleveryInfoPayload);

      if (isExists.status === ShipmentStatus.CREATED) {
        const result = await tx.shipment.update({
          where: {
            id: isExists.id,
          },
          data: {
            status: ShipmentStatus.READY_FOR_PAYMENT,
            deliveryFee: deleveryInfo.amount,
            deliveryDistance: deleveryInfo.distance,
            notification: {
              create: {
                title: "Shipment Approved By Admin",
                message:
                  "Your Shipment Approved By Swift Courier Service! Payment Info Send To Your Email Make Payment Please!",
                type: NotificationType.SHIPMENT,
                userId: user.id,
                notificationDeadline: notificationDeadline,
              },
            },
            tracking: {
              create: {
                updatedById: user.id,
                status: ShipmentStatus.READY_FOR_PAYMENT,
                note: payload.note,
              },
            },
          },
        });

        const userData = await tx.user.findUniqueOrThrow({
          where: {
            id: result.customerId,
          },
        });

        const templateData = {
          name: userData?.name,
          parcelName: result.parcelName,
          status: ShipmentStatus.READY_FOR_PAYMENT,
          serviceCharge: deleveryInfo.serviceCharge,
          deliveryFee: deleveryInfo.amount,
          distance: deleveryInfo.distance,
        };

        await sendTemplateEmail({
          to: userData?.email,
          subject: "Your Shipment is Approved",
          templateName: "shipment-status-approved",
          data: templateData,
        });

        return result;
      }

      const result = await tx.shipment.update({
        where: {
          id: isExists.id,
        },
        data: {
          status: payload.status,
          notification: {
            create: {
              title: "Shipment Status Updated",
              message: `Your Shipment Processing To ${payload.status}`,
              type: NotificationType.SHIPMENT,
              userId: user.id,
              notificationDeadline: notificationDeadline,
            },
          },
          tracking: {
            create: {
              updatedById: user.id,
              status: payload.status,
              note: payload.note,
            },
          },
        },
      });

      return result;
    },
    {
      maxWait: 15000,
      timeout: 20000,
    },
  );
  return transactionResult;
};

// export shipment services
export const shipmentServices = {
  createShipment,
  updateShipmentByAdmin,
};
