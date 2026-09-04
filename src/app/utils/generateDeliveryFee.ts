import axios from "axios";
import { AppError } from "./AppError";
import httpStatus from "http-status";

interface IGenerateDeliveryFeePayload {
	pickupLat: number;
	pickupLng: number;
	deliveryLat: number;
	deliveryLng: number;
	parcelWeightGM: number;
}

interface IGenerateDeliveryFeeResponse {
	distance: number;
	amount: number;
	serviceCharge: number;
}

export const generateDeliveryFee = async (
	payload: IGenerateDeliveryFeePayload,
): Promise<IGenerateDeliveryFeeResponse> => {
	const { pickupLat, pickupLng, deliveryLat, deliveryLng, parcelWeightGM } = payload;

	const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

	if (!GEOAPIFY_API_KEY) {
		throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "GEOAPIFY_API_KEY is not configured!");
	}

	if (parcelWeightGM <= 0) {
		throw new AppError(httpStatus.BAD_REQUEST, "Parcel weight must be greater than 0!");
	}

	try {
		const response = await axios.get("https://api.geoapify.com/v1/routing", {
			params: {
				waypoints: `${pickupLat},${pickupLng}|${deliveryLat},${deliveryLng}`,
				mode: "drive",
				apiKey: GEOAPIFY_API_KEY,
			},
		});

		const distanceInMeters = response.data?.features?.[0]?.properties?.distance;

		if (typeof distanceInMeters !== "number" || distanceInMeters < 0) {
			throw new AppError(httpStatus.BAD_REQUEST, "Unable to calculate delivery distance!");
		}

		// Convert meters to kilometers
		const distanceInKM = distanceInMeters / 1000;

		// Convert gram to kilogram
		const weightInKG = parcelWeightGM / 1000;

		// 10 TK per kilometer
		const distanceFee = distanceInKM * 5;

		// 25 TK per kilogram
		const weightFee = weightInKG * 25;

		const serviceCharge = 120;

		// Total delivery fee
		const amount = distanceFee + weightFee + serviceCharge;

		return {
			distance: Number(distanceInKM.toFixed(2)),
			amount: Number(amount.toFixed(2)),
			serviceCharge,
		};
	} catch (error) {
		if (error instanceof AppError) {
			throw error;
		}

		throw new AppError(httpStatus.BAD_REQUEST, "Failed to calculate delivery fee!");
	}
};
