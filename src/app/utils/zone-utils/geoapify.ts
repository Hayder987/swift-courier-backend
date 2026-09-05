import config from "../../config";

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

export interface GeocodingResult {
	latitude: number;
	longitude: number;

	fullAddress: string | null;

	city: string | null;
	district: string | null;
	state: string | null;

	postcode: string | null;

	country: string | null;
	countryCode: string | null;
}

export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
	if (!address || !address.trim()) {
		throw new Error("Address is required");
	}

	if (!config.geoapify_api_key) {
		throw new Error("Geoapify API key is not configured");
	}

	const url = new URL(config.geoapify_geocode_url || "https://api.geoapify.com/v1/geocode/search");

	url.searchParams.set("text", address.trim());
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
		let errorMessage = `Geocoding failed: ${response.status} ${response.statusText}`;

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
			// Ignore JSON parse error
		}

		throw new Error(errorMessage);
	}

	const data = (await response.json()) as GeoapifyResponse;

	const properties = data.features?.[0]?.properties;

	if (!properties) {
		return null;
	}

	if (typeof properties.lat !== "number" || typeof properties.lon !== "number") {
		return null;
	}

	return {
		latitude: properties.lat,
		longitude: properties.lon,

		fullAddress: properties.formatted ?? properties.address_line1 ?? null,

		city: properties.city ?? null,

		district: properties.county ?? properties.district ?? properties.suburb ?? null,

		state: properties.state ?? null,

		postcode: properties.postcode ?? null,

		country: properties.country ?? null,

		countryCode: properties.country_code ?? null,
	};
};
