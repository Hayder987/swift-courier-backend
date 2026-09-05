import { point, polygon } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

interface ZoneBoundary {
	type: "Polygon";
	coordinates: [number, number][][];
}

interface ZoneWithBoundary {
	id: string;
	name: string;
	boundary: unknown;
}

const isValidBoundary = (boundary: unknown): boundary is ZoneBoundary => {
	if (!boundary || typeof boundary !== "object") {
		return false;
	}

	const data = boundary as Partial<ZoneBoundary>;

	return (
		data.type === "Polygon" &&
		Array.isArray(data.coordinates) &&
		Array.isArray(data.coordinates[0]) &&
		data.coordinates[0].length >= 4
	);
};

export const findZoneFromCoordinates = (
	latitude: number,
	longitude: number,
	zones: ZoneWithBoundary[],
): ZoneWithBoundary | null => {
	if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
		throw new Error("Invalid latitude");
	}

	if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
		throw new Error("Invalid longitude");
	}

	const userPoint = point([longitude, latitude]);

	for (const zone of zones) {
		if (!isValidBoundary(zone.boundary)) {
			continue;
		}

		const zonePolygon = polygon(zone.boundary.coordinates);

		const isInside = booleanPointInPolygon(userPoint, zonePolygon);

		if (isInside) {
			return zone;
		}
	}

	return null;
};
