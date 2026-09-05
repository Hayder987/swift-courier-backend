interface GeoJSONPolygon {
	type: "Polygon";
	coordinates: [number, number][][];
}

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number): number => {
	return (degrees * Math.PI) / 180;
};

const toDegrees = (radians: number): number => {
	return (radians * 180) / Math.PI;
};

export const generateZoneBoundary = (
	latitude: number,
	longitude: number,
	radiusKm: number,
	points = 64,
): GeoJSONPolygon => {
	if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
		throw new Error("Invalid latitude");
	}

	if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
		throw new Error("Invalid longitude");
	}

	if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
		throw new Error("Radius must be greater than 0");
	}

	if (!Number.isInteger(points) || points < 16) {
		throw new Error("Boundary points must be at least 16");
	}

	const coordinates: [number, number][] = [];

	const latitudeRadians = toRadians(latitude);
	const longitudeRadians = toRadians(longitude);

	const angularDistance = radiusKm / EARTH_RADIUS_KM;

	for (let i = 0; i <= points; i++) {
		const bearing = (2 * Math.PI * i) / points;

		const pointLatitude = Math.asin(
			Math.sin(latitudeRadians) * Math.cos(angularDistance) +
				Math.cos(latitudeRadians) * Math.sin(angularDistance) * Math.cos(bearing),
		);

		const pointLongitude =
			longitudeRadians +
			Math.atan2(
				Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitudeRadians),
				Math.cos(angularDistance) - Math.sin(latitudeRadians) * Math.sin(pointLatitude),
			);

		coordinates.push([
			Number(toDegrees(pointLongitude).toFixed(7)),
			Number(toDegrees(pointLatitude).toFixed(7)),
		]);
	}

	return {
		type: "Polygon",
		coordinates: [coordinates],
	};
};
