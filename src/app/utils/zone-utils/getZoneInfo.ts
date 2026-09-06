import { prisma } from "../../lib/prisma";
import { findZoneFromCoordinates } from "./findZoneByCoordinates";

export const getZoneInfo = async (latitude: number, longitude: number) => {
    const zones = await prisma.zone.findMany({
		where: {
			isActive: true,
		},
		select: {
			id: true,
			name: true,
			boundary: true,
		},
	});

	const zone = findZoneFromCoordinates(latitude, longitude, zones);
    return zone
};
