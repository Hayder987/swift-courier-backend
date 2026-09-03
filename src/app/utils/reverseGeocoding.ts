import config from "../config";

interface GeoapifyProperties {
	name?: string;
	country?: string;
	country_code?: string;
	state?: string;
	state_code?: string;
	county?: string;
	county_code?: string;
	city?: string;
	postcode?: string;
	street?: string;
	housenumber?: string;
	suburb?: string;
	district?: string;
	neighbourhood?: string;
	formatted?: string;
	address_line1?: string;
	address_line2?: string;
	lat?: number;
	lon?: number;
	result_type?: string;
	rank?: {
		confidence?: number;
		confidence_city_level?: number;
		confidence_street_level?: number;
		match_type?: string;
	};
}

interface GeoapifyFeature {
	type?: string;
	properties?: GeoapifyProperties;
}

interface GeoapifyResponse {
	type?: string;
	features?: GeoapifyFeature[];
}

export interface ReverseGeocodingResult {
	fullAddress: string | null;
	road: string | null;
	city: string | null;
	district: string | null;
	state: string | null;
	postcode: string | null;
	country: string | null;
	countryCode: string | null;
}

export const reverseGeocode = async (
	latitude: number,
	longitude: number,
): Promise<ReverseGeocodingResult | null> => {
	if (
		!Number.isFinite(latitude) ||
		!Number.isFinite(longitude) ||
		latitude < -90 ||
		latitude > 90 ||
		longitude < -180 ||
		longitude > 180
	) {
		throw new Error("Invalid latitude or longitude");
	}

	if (!config.geoapify_api_key) {
		throw new Error("Geoapify API key is not configured");
	}

	const url = new URL(`${config.geoapify_map_url}`);

	url.searchParams.set("lat", latitude.toString());
	url.searchParams.set("lon", longitude.toString());
	url.searchParams.set("limit", "1");
	url.searchParams.set("lang", "en");
	url.searchParams.set("apiKey", config.geoapify_api_key);

	const response = await fetch(url, {
		method: "GET",
		headers: {
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		let errorMessage = `Reverse geocoding failed: ${response.status} ${response.statusText}`;

		try {
			const errorData = (await response.json()) as {
				message?: string;
				error?: string;
			};

			if (errorData.message) {
				errorMessage += ` - ${errorData.message}`;
			} else if (errorData.error) {
				errorMessage += ` - ${errorData.error}`;
			}
		} catch {
			// Ignore JSON parsing error
		}

		throw new Error(errorMessage);
	}

	const data = (await response.json()) as GeoapifyResponse;

	const properties = data.features?.[0]?.properties;

	if (!properties) {
		return null;
	}

	const buildFullAddress = (properties: GeoapifyProperties): string | null => {
		const parts = [
			properties.housenumber,
			properties.street,
			properties.neighbourhood,
			properties.suburb,
			properties.district,
			properties.city,
			properties.state,
			properties.postcode,
			properties.country,
		].filter(Boolean);

		return parts.length > 0 ? parts.join(", ") : null;
	};

	return {
		fullAddress: buildFullAddress(properties),
		road: properties.street ?? null,
		city: properties.city ?? null,
		district: properties.county ?? properties.district ?? properties.suburb ?? null,
		state: properties.state ?? null,
		postcode: properties.postcode ?? null,
		country: properties.country ?? null,
		countryCode: properties.country_code ?? null,
	};
};
