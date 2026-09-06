import type { IReqUserPayload } from "./../../interfaces/index";
import httpStatus from "http-status";
import sharp from "sharp";
import { generateTrackingNumber } from "../../utils/generateTrackingNumber";
import type { ICreateShipmentPayload } from "./shipment.validation";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	AuditAction,
	AuditResource,
	NotificationType,
	ShipmentStatus,
	ShipmentType,
	UserRole,
} from "../../../generated/prisma/enums";
import type { IShipmentStatusAdmin, IShipmentStatusCourier } from "./shipment.interface";
import { generateDeliveryFee } from "../../utils/generateDeliveryFee";
import { notificationDeadline, onboardingAuditOldDeadline } from "../../utils/comon.utils";
import { sendTemplateEmail } from "../../services/sendTemplateEmail";
import { geocodeAddress } from "../../utils/zone-utils/geoapify";
import { getZoneInfo } from "../../utils/zone-utils/getZoneInfo";
import { reverseGeocode } from "../../utils/reverseGeocoding";

// create shipment by customer
const createShipment = async (buffer: Buffer, payload: ICreateShipmentPayload, userId: string) => {
	if (!payload) {
		throw new AppError(httpStatus.NOT_FOUND, "Payload Data Missing!");
	}

	const { parcelName, description, parcelWeightGM, pickupLat, pickupLng, deliveryAddress } =
		payload;

	const pickupLocation = await reverseGeocode(Number(pickupLat), Number(pickupLng));

	if (!pickupLocation) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Pickup Location Address Not Found! Share Valid Pickup Location!",
		);
	}

	const deliveryLocation = await geocodeAddress(deliveryAddress);

	if (!deliveryLocation) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Delivery Location Not Found! Enter Valid Delivery Address!",
		);
	}

	const pickUpZoneInfo = await getZoneInfo(Number(pickupLat), Number(pickupLng));

	if (!pickUpZoneInfo) {
		throw new AppError(httpStatus.NOT_FOUND, "There is no Pickup Zone found for this location!");
	}

	const deliveryZoneInfo = await getZoneInfo(
		Number(deliveryLocation.latitude),
		Number(deliveryLocation.longitude),
	);

	if (!deliveryZoneInfo) {
		throw new AppError(httpStatus.NOT_FOUND, "There is no Delivery Zone found for this location!");
	}

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

	// 6. Upload Image to Cloudinary

	let cloudinaryResult: UploadApiResponse;

	cloudinaryResult = await new Promise<UploadApiResponse>((resolve, reject) => {
		cloudinary.uploader
			.upload_stream(
				{
					resource_type: "image",
					folder: "swiftcourier/shipments",
					format: "webp",
				},
				(error, result) => {
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
	});

	// Generate Tracking Number
	const trackNumber = await generateTrackingNumber();

	// Database Transaction
	try {
		const result = await prisma.$transaction(
			async (tx) => {
				const resultData = await tx.shipment.create({
					data: {
						parcelName,
						description: description || "",
						parcelWeightGM,
						pickupAddress: {
							...pickupLocation,
						},
						pickupLat,
						pickupLng,
						deliveryAddress: {
							...deliveryLocation,
						},
						deliveryLat: deliveryLocation.latitude,
						deliveryLng: deliveryLocation.longitude,
						pickupZoneId: pickUpZoneInfo.id,
						deliveryZoneId: deliveryZoneInfo.id,
						trackingNumber: trackNumber,
						imageUrl: cloudinaryResult.secure_url,
						imagePublicId: cloudinaryResult.public_id,
						customerId: userId,

						notification: {
							create: {
								title: "New Shipment Requested",
								message: "New Shipment Requested For Payment",
								type: NotificationType.GENERAL,
								userId,
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
          include : {
           pickupZone : {
            select : {
              id : true,
              name : true,
              code : true,
              address : true,
            }
           },
           deliveryZone : {
            select : {
              id : true,
              name : true,
              code : true,
              address : true,
            }
           }
          },
					omit: {
						imagePublicId: true,
					},
				});

				// Create Audit Log
				await tx.auditLog.create({
					data: {
						userId,
						action: AuditAction.CREATED,
						resource: AuditResource.SHIPMENT,
						resourceId: resultData.id,
						description: "New Shipment Created",
						metadata: {
							pickupAddress: pickupLocation.fullAddress,
							pickupZone: pickUpZoneInfo.name,
							deliveryAddress: deliveryLocation.fullAddress,
							deliveryZone: deliveryZoneInfo.name,
							trackingNumber: trackNumber,
						},
					},
				});

				return resultData;
			},
			{
				maxWait: 15000,
				timeout: 20000,
			},
		);

		return result;
	} catch (error) {
		if (cloudinaryResult.public_id) {
			try {
				await cloudinary.uploader.destroy(cloudinaryResult.public_id, {
					resource_type: "image",
				});
			} catch (deleteError) {
				console.error("Failed to delete Cloudinary image after transaction failure:", deleteError);
			}
		}
		throw error;
	}
};

// update shipment status by admin
const updateShipmentByAdmin = async (
	payload: IShipmentStatusAdmin,
	user: IReqUserPayload,
	shipmentId: string,
) => {
	const transactionResult = await prisma.$transaction(
		async (tx) => {
			const isExists = await tx.shipment.findUnique({
				where: {
					id: shipmentId,
					type: ShipmentType.NEW,
				},
        include : {
          pickupZone : {
            select : {
              id : true,
              name : true,
              code : true,
              address : true,
            }
          },
          deliveryZoneZone : {
            select : {
              id : true,
              name : true,
              code : true,
              address : true,
            }
          },

        }
			});

			if (!isExists) {
				throw new AppError(httpStatus.NOT_FOUND, "Shipment Not Found");
			}

			if (isExists.status === ShipmentStatus.CANCELLED) {
				throw new AppError(httpStatus.BAD_REQUEST, "Shipment Already Cancelled!");
			}

			if (user.role === UserRole.CUSTOMER || user.role === UserRole.COURIER) {
				throw new AppError(httpStatus.FORBIDDEN, "You Have No Permission!");
			}

			if (payload.status === isExists.status) {
				throw new AppError(
					httpStatus.CONFLICT,
					`This Shipment Status ALready Updated To ${payload.status}`,
				);
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

// update shipment status by courier
const updateShipmentByCourier = async (
	payload: IShipmentStatusCourier,
	user: IReqUserPayload,
	shipmentId: string,
) => {
	const transactionResult = await prisma.$transaction(
		async (tx) => {
			const isExists = await tx.shipment.findUnique({
				where: {
					id: shipmentId,
				},
				select: {
					id: true,
					status: true,
					customerId: true,
				},
			});

			if (!isExists) {
				throw new AppError(httpStatus.NOT_FOUND, "Shipment Not Found");
			}

			if (isExists.status === ShipmentStatus.CANCELLED) {
				throw new AppError(httpStatus.BAD_REQUEST, "Shipment Already Cancelled!");
			}

			if (user.role === UserRole.CUSTOMER) {
				throw new AppError(httpStatus.FORBIDDEN, "You Have No Permission!");
			}

			const shipmentStatusFlow: ShipmentStatus[] = [
				ShipmentStatus.PICKED_UP,
				ShipmentStatus.IN_TRANSIT,
				ShipmentStatus.OUT_FOR_DELIVERY,
				ShipmentStatus.DELIVERED,
			];

			const currentStatus = isExists.status;
			const nextStatus = payload.status;

			if (
				currentStatus === ShipmentStatus.DELIVERED ||
				currentStatus === ShipmentStatus.DELIVERY_FAILED
			) {
				throw new AppError(
					httpStatus.BAD_REQUEST,
					`Shipment is already ${currentStatus}. Status cannot be changed.`,
				);
			}

			if (nextStatus === ShipmentStatus.DELIVERY_FAILED) {
				const currentIndex = shipmentStatusFlow.indexOf(currentStatus as ShipmentStatus);

				if (currentIndex === -1) {
					throw new AppError(
						httpStatus.BAD_REQUEST,
						`Shipment cannot be marked as DELIVERY_FAILED from ${currentStatus}`,
					);
				}
			} else {
				const currentIndex = shipmentStatusFlow.indexOf(currentStatus as ShipmentStatus);

				const nextIndex = shipmentStatusFlow.indexOf(nextStatus);

				if (nextIndex === -1) {
					throw new AppError(
						httpStatus.BAD_REQUEST,
						`Invalid shipment status transition: ${currentStatus} → ${nextStatus}`,
					);
				}

				if (currentIndex === nextIndex) {
					throw new AppError(httpStatus.BAD_REQUEST, `Shipment is already ${currentStatus}`);
				}

				if (nextIndex !== currentIndex + 1) {
					throw new AppError(
						httpStatus.BAD_REQUEST,
						`Invalid status transition: ${currentStatus} → ${nextStatus}. ` +
							`Shipment must follow the status sequence.`,
					);
				}
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
	updateShipmentByCourier,
};
