import type { IQuery, IReqUserPayload } from "./../../interfaces/index";
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
import { getRandomAvailableCourier } from "./shipment.utils";
import type { ShipmentWhereInput } from "../../../generated/prisma/models";
import {
	startOfDay,
	endOfDay,
	startOfWeek,
	endOfWeek,
	subWeeks,
	subDays,
	startOfMonth,
	endOfMonth,
	startOfYear,
	endOfYear,
} from "date-fns";

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
					include: {
						pickupZone: {
							select: {
								id: true,
								name: true,
								code: true,
								address: true,
							},
						},
						deliveryZone: {
							select: {
								id: true,
								name: true,
								code: true,
								address: true,
							},
						},
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
				include: {
					pickupZone: {
						select: {
							id: true,
							name: true,
							code: true,
							address: true,
						},
					},
					deliveryZone: {
						select: {
							id: true,
							name: true,
							code: true,
							address: true,
						},
					},
					customer: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});

			if (!isExists) {
				throw new AppError(httpStatus.NOT_FOUND, "Shipment Not Found");
			}

			if (isExists.status === ShipmentStatus.CANCELLED) {
				throw new AppError(httpStatus.BAD_REQUEST, "Shipment Already Cancelled!");
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
								userId: isExists.customer.id,
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

				const templateData = {
					name: isExists?.customer?.name,
					parcelName: result.parcelName,
					status: ShipmentStatus.READY_FOR_PAYMENT,
					serviceCharge: deleveryInfo.serviceCharge,
					deliveryFee: deleveryInfo.amount,
					distance: deleveryInfo.distance,
				};

				await sendTemplateEmail({
					to: isExists?.customer?.email,
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
					customer: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
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
							userId: isExists.customer.id,
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

// assign courier
const assignCourierOnShipment = async (user: IReqUserPayload, shipmentId: string) => {
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
					pickupZoneId: true,
					deliveryZoneId: true,
					customer: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});

			if (!isExists) {
				throw new AppError(httpStatus.NOT_FOUND, "Shipment Not Found");
			}

			if (isExists.status === ShipmentStatus.CANCELLED) {
				throw new AppError(httpStatus.BAD_REQUEST, "Shipment Already Cancelled!");
			}

			if (isExists.status !== ShipmentStatus.PENDING) {
				throw new AppError(httpStatus.BAD_REQUEST, "Only Pending Shipment Can be Assign!");
			}

			if (user.role !== UserRole.ADMIN) {
				throw new AppError(httpStatus.FORBIDDEN, "You Have No Permission!");
			}

			if (!isExists.pickupZoneId || !isExists.deliveryZoneId) {
				throw new AppError(httpStatus.BAD_REQUEST, "Pickup and Delivery Zone are required!");
			}

			const picupZoneRandomCourier = await getRandomAvailableCourier(isExists.pickupZoneId);
			const deliveryZoneRandomCourier = await getRandomAvailableCourier(isExists.deliveryZoneId);
			console.log({ picupZoneRandomCourier, deliveryZoneRandomCourier });

			if (!picupZoneRandomCourier || !deliveryZoneRandomCourier) {
				throw new AppError(httpStatus.NOT_FOUND, "No Available Courier Found!");
			}

			const result = await tx.shipment.update({
				where: {
					id: isExists.id,
				},
				data: {
					status: ShipmentStatus.ASSIGNED,
					pickupCourierId: picupZoneRandomCourier.userId,
					deliveryCourierId: deliveryZoneRandomCourier.userId,
					tracking: {
						create: {
							updatedById: user.id,
							status: ShipmentStatus.ASSIGNED,
							note: "Assign Courier On this Shipment",
						},
					},
				},
			});

			await tx.notification.create({
				data: {
					title: "This Shipment Assign You As Pickup Courier",
					message: `Connected Customer Quickly For Pickup Shipment`,
					type: NotificationType.SHIPMENT,
					userId: picupZoneRandomCourier.userId,
					notificationDeadline: notificationDeadline,
				},
			});

			await tx.notification.create({
				data: {
					title: "This Shipment Assign You As Delivery Courier",
					message: `You Receive This Shipment Into 2 Days`,
					type: NotificationType.SHIPMENT,
					userId: deliveryZoneRandomCourier.userId,
					notificationDeadline: notificationDeadline,
				},
			});

			await tx.auditLog.create({
				data: {
					userId: user.id,
					action: AuditAction.ASSIGN,
					resource: AuditResource.SHIPMENT,
					resourceId: shipmentId,
					description: "Assign Courier On This Shipment",
					onboardingOldTime: onboardingAuditOldDeadline,
					metadata: {
						prevStatus: "PENDING",
						assignPickupCourier: picupZoneRandomCourier.userId,
						assigndeliveryCourierId: deliveryZoneRandomCourier.userId,
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

// get shipment by id
const getShipmentById = async (shipmentId: string) => {
	const shipment = await prisma.shipment.findUnique({
		where: {
			id: shipmentId,
		},
		include: {
			customer: {
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
				},
			},

			pickupCourier: {
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
				},
			},

			deliveryCourier: {
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
				},
			},
			pickupZone: {
				select: {
					id: true,
					code: true,
					name: true,
				},
			},
			deliveryZone: {
				select: {
					id: true,
					name: true,
				},
			},

			tracking: {
				orderBy: {
					createdAt: "desc",
				},
				include: {
					updatedBy: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			},
		},
	});

	if (!shipment) {
		throw new AppError(httpStatus.NOT_FOUND, "Shipment Not Found!");
	}

	return shipment;
};

// get all shipment
const getAllShipments = async (query: IQuery) => {
	const page = query.page ? Number(query.page) : 1;
	const limit = query.limit ? Number(query.limit) : 20;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy || "createdAt";
	const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

	const andConditions: ShipmentWhereInput[] = [];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					trackingNumber: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{
					parcelName: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			],
		});
	}

	if (query.status) {
		andConditions.push({
			status: query.status as ShipmentStatus,
		});
	}

	// Type filter
	if (query.type) {
		andConditions.push({
			type: query.type,
		});
	}

	if (query.dateFilter === "today") {
		andConditions.push({
			createdAt: {
				gte: startOfDay(new Date()),
				lte: endOfDay(new Date()),
			},
		});
	}

	if (query.dateFilter === "yesterday") {
		const yesterday = subDays(new Date(), 1);

		andConditions.push({
			createdAt: {
				gte: startOfDay(yesterday),
				lte: endOfDay(yesterday),
			},
		});
	}

	if (query.dateFilter === "last_week") {
		const lastWeek = subWeeks(new Date(), 1);

		andConditions.push({
			createdAt: {
				gte: startOfWeek(lastWeek, { weekStartsOn: 1 }),
				lte: endOfWeek(lastWeek, { weekStartsOn: 1 }),
			},
		});
	}

	if (query.pickupZoneId) {
		andConditions.push({
			pickupZoneId: query.pickupZoneId,
		});
	}

	if (query.deliveryZoneId) {
		andConditions.push({
			deliveryZoneId: query.deliveryZoneId,
		});
	}

	const whereConditions: ShipmentWhereInput =
		andConditions.length > 0
			? {
					AND: andConditions,
				}
			: {};

	const [result, total] = await Promise.all([
		prisma.shipment.findMany({
			where: whereConditions,

			skip,
			take: limit,

			orderBy: {
				[sortBy]: sortOrder,
			},

			include: {
				customer: {
					select: {
						id: true,
						name: true,
						email: true,
						phone: true,
					},
				},

				pickupCourier: {
					select: {
						id: true,
						name: true,
						email: true,
						phone: true,
					},
				},

				deliveryCourier: {
					select: {
						id: true,
						name: true,
						email: true,
						phone: true,
					},
				},

				pickupZone: {
					select: {
						id: true,
						code: true,
						name: true,
					},
				},

				deliveryZone: {
					select: {
						id: true,
						code: true,
						name: true,
					},
				},

				tracking: {
					orderBy: {
						createdAt: "desc",
					},
					take: 1,
				},
			},
		}),

		prisma.shipment.count({
			where: whereConditions,
		}),
	]);

	const totalPages = Math.ceil(total / limit);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages,
		},
		data: result,
	};
};

// get customer own shipment
const getMyShipments = async (user: IReqUserPayload, query: IQuery) => {
	const limit = query.limit ? Number(query.limit) : 20;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy || "createdAt";
	const sortOrder = query.sortOrder || "desc";

	const andConditions: ShipmentWhereInput[] = [
		{
			customerId: user.id,
		},
	];

	// Delivery zone filter
	if (query.deliveryZoneId) {
		andConditions.push({
			deliveryZoneId: query.deliveryZoneId,
		});
	}

	// Status filter
	if (query.status) {
		andConditions.push({
			status: query.status,
		});
	}

	// Date filter
	if (query.dateFilter === "last_week") {
		const lastWeek = subWeeks(new Date(), 1);

		andConditions.push({
			createdAt: {
				gte: startOfWeek(lastWeek, {
					weekStartsOn: 1,
				}),
				lte: endOfWeek(lastWeek, {
					weekStartsOn: 1,
				}),
			},
		});
	}

	if (query.dateFilter === "this_month") {
		const today = new Date();

		andConditions.push({
			createdAt: {
				gte: startOfMonth(today),
				lte: endOfMonth(today),
			},
		});
	}

	if (query.dateFilter === "this_year") {
		const today = new Date();

		andConditions.push({
			createdAt: {
				gte: startOfYear(today),
				lte: endOfYear(today),
			},
		});
	}

	const whereConditions: ShipmentWhereInput = {
		AND: andConditions,
	};

	const [shipments, total] = await Promise.all([
		prisma.shipment.findMany({
			where: whereConditions,
			skip,
			take: limit,
			orderBy: {
				[sortBy]: sortOrder,
			},
			include: {
				pickupZone: {
					select: {
						id: true,
						code: true,
						name: true,
					},
				},
				deliveryZone: {
					select: {
						id: true,
						code: true,
						name: true,
					},
				},
				pickupCourier: {
					include: {
						employee: {
							include: {
								user: {
									select: {
										id: true,
										name: true,
										email: true,
										phone: true,
									},
								},
							},
						},
					},
				},
			},
		}),

		prisma.shipment.count({
			where: whereConditions,
		}),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: shipments,
	};
};

// export shipment services
export const shipmentServices = {
	createShipment,
	updateShipmentByAdmin,
	updateShipmentByCourier,
	assignCourierOnShipment,
	getShipmentById,
	getAllShipments,
	getMyShipments,
};
