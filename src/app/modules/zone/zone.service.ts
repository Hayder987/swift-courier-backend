import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { geocodeAddress } from "../../utils/zone-utils/geoapify";
import { generateZoneBoundary } from "../../utils/zone-utils/zoneBoundary";
import type { ICreateZonePayload, IUpdateZonePayload } from "./zone.interface";

// create zone by admin
const createZone = async (payload: ICreateZonePayload) => {
	const existingZone = await prisma.zone.findUnique({
		where: {
			code: payload.code,
		},
	});

	if (existingZone) {
		throw new Error("Zone code already exists");
	}

	const location = await geocodeAddress(payload.address);

	if (!location) {
		throw new Error("Unable to find the provided zone address");
	}

	const boundary = generateZoneBoundary(location?.latitude, location?.longitude, payload?.radiusKm);

	const zone = await prisma.zone.create({
		data: {
			name: payload.name,
			code: payload.code.toUpperCase(),
			address: payload.address,
			latitude: location.latitude,
			longitude: location.longitude,
			radiusKm: payload.radiusKm,
			boundary: boundary as unknown as Prisma.InputJsonValue,
			isActive: true,
		},
	});

	return zone;
};

// get all zone public
const getAllZones = async () => {
	return prisma.zone.findMany({
		orderBy: {
			createdAt: "desc",
		},
	});
};

// get zone by id
const getZoneById = async (zoneId: string) => {
	const zone = await prisma.zone.findUnique({
		where: {
			id: zoneId,
		},
	});

	if (!zone) {
		throw new Error("Zone not found");
	}

	return zone;
};

// update zone by id admin
const updateZone = async (zoneId: string, payload: IUpdateZonePayload) => {
	const existingZone = await prisma.zone.findUnique({
		where: {
			id: zoneId,
		},
	});

	if (!existingZone) {
		throw new Error("Zone not found");
	}

	const updateData: Record<string, unknown> = {};

	if (payload.name !== undefined) {
		updateData.name = payload.name;
	}

	if (payload.code !== undefined) {
		updateData.code = payload.code;
	}

	if (payload.isActive !== undefined) {
		updateData.isActive = payload.isActive;
	}


	if (payload.address !== undefined || payload.radiusKm !== undefined) {
		const address = payload.address ?? existingZone.address;

		const radiusKm = payload.radiusKm ?? existingZone.radiusKm;

		const location = await geocodeAddress(address);

		if (!location) {
			throw new Error("Unable to find the provided zone address");
		}

		const boundary = generateZoneBoundary(location.latitude, location.longitude, radiusKm);

		updateData.address = address;
		updateData.latitude = location.latitude;
		updateData.longitude = location.longitude;
		updateData.radiusKm = radiusKm;
		updateData.boundary = boundary;
	}

	return prisma.zone.update({
		where: {
			id: zoneId,
		},
		data: updateData,
	});
};

// delete zone by id admin
const deleteZone = async (zoneId: string) => {
	const zone = await prisma.zone.findUnique({
		where: {
			id: zoneId,
		},
		include: {
			couriers: {
				select: {
					id: true,
				},
			},
			pickupShipments: {
				select: {
					id: true,
				},
				take: 1,
			},
			deliveryShipments: {
				select: {
					id: true,
				},
				take: 1,
			},
		},
	});

	if (!zone) {
		throw new Error("Zone not found");
	}

	if (zone.couriers.length > 0) {
		throw new Error("Cannot delete zone because couriers are assigned to it");
	}

	if (zone.pickupShipments.length > 0 || zone.deliveryShipments.length > 0) {
		throw new Error("Cannot delete zone because shipments are associated with it");
	}

	await prisma.zone.delete({
		where: {
			id: zoneId,
		},
	});
};

// export zone service
export const zoneServices = {
	createZone,
	getAllZones,
	getZoneById,
	updateZone,
	deleteZone,
};
