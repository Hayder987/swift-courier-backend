import httpStatus from "http-status";
import sharp from "sharp";
import { generateTrackingNumber } from "../../utils/generateTrackingNumber";
import type { ICreateShipmentPayload } from "./shipment.validation";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

const createShipment = async (buffer: Buffer, payload: ICreateShipmentPayload, userId: string) => {
	if (!payload) {
		throw new AppError(httpStatus.NOT_FOUND, "Payload Data Missing!");
	}

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
	const cloudinaryResult = await new Promise<UploadApiResponse>((resolve, reject) => {
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
	});

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
		},
		omit: {
			imagePublicId: true,
		},
	});
	return result;
};

// export shipment services
export const shipmentServices = {
	createShipment,
};
