import { shipmentServices } from "../shipment/shipment.service";
import { generateDeliveryFee } from "../../utils/generateDeliveryFee";
import { geocodeAddress } from "../../utils/zone-utils/geoapify";
import { SWIFTCOURIER_FAQ, SHIPPING_SERVICE_INFO } from "./ai-assistant.constants";
import type {
	IFaqToolResult,
	IPricingToolResult,
	IServiceInfoToolResult,
	ITrackingToolResult,
} from "./ai-assistant.interface";

export const trackShipmentTool = async (trackingNumber: string): Promise<ITrackingToolResult> => {
	const normalized = trackingNumber.trim();

	try {
		const shipment = await shipmentServices.getPublicShipmentByTrackingNumber(normalized);

		return {
			kind: "tracking",
			found: true,
			trackingNumber: shipment.trackingNumber,
			parcelName: shipment.parcelName,
			status: shipment.status,
			statusTimeline: shipment.tracking.map((t) => ({
				status: t.status,
				note: t.note,
				at: t.createdAt.toISOString(),
			})),
			pickupZone: shipment.pickupZone?.name,
			deliveryZone: shipment.deliveryZone?.name,
			deliveryFee: shipment.deliveryFee ? Number(shipment.deliveryFee) : null,
			createdAt: shipment.createdAt.toISOString(),
		};
	} catch {
		return { kind: "tracking", found: false, trackingNumber: normalized };
	}
};

export const calculateShippingPriceTool = async (input: {
	pickupAddress?: string;
	deliveryAddress?: string;
	weightGM?: number;
}): Promise<IPricingToolResult> => {
	if (!input.pickupAddress || !input.deliveryAddress || !input.weightGM) {
		return {
			kind: "pricing",
			success: false,
			note: "Missing pickup address, delivery address, or parcel weight.",
		};
	}

	try {
		const pickup = await geocodeAddress(input.pickupAddress);
		const delivery = await geocodeAddress(input.deliveryAddress);

		if (!pickup || !delivery) {
			return {
				kind: "pricing",
				success: false,
				note: "Could not locate one of the addresses. Please provide a more specific location.",
			};
		}

		const fee = await generateDeliveryFee({
			pickupLat: Number(pickup.latitude),
			pickupLng: Number(pickup.longitude),
			deliveryLat: Number(delivery.latitude),
			deliveryLng: Number(delivery.longitude),
			parcelWeightGM: input.weightGM,
		});

		return {
			kind: "pricing",
			success: true,
			weightGM: input.weightGM,
			distanceKm: fee.distance,
			serviceCharge: fee.serviceCharge,
			amountBDT: fee.amount,
			note: "Estimated delivery fee (BDT). Final amount may be confirmed when you create the shipment.",
		};
	} catch {
		return {
			kind: "pricing",
			success: false,
			note: "The pricing service could not calculate an estimate for these addresses. Please try more specific locations.",
		};
	}
};

export const getShippingFaqTool = (query?: string): IFaqToolResult => {
	if (!query) {
		return { kind: "faq", matched: SWIFTCOURIER_FAQ.slice(0, 3) };
	}

	const q = query.toLowerCase();
	const matched = SWIFTCOURIER_FAQ.filter(
		(f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q),
	);

	return { kind: "faq", matched: matched.length ? matched : SWIFTCOURIER_FAQ.slice(0, 3) };
};

export const getShippingServiceInformationTool = (): IServiceInfoToolResult => ({
	kind: "service",
	info: SHIPPING_SERVICE_INFO,
});
