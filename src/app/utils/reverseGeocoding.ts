import config from "../config";

interface NominatimAddress {
	road?: string;
	house_number?: string;
	neighbourhood?: string;
	suburb?: string;
	village?: string;
	town?: string;
	city?: string;
	municipality?: string;
	county?: string;
	state?: string;
	postcode?: string;
	country?: string;
	country_code?: string;
}

interface NominatimResponse {
	display_name?: string;
	address?: NominatimAddress;
}

export interface ReverseGeocodingResult {
	fullAddress: string | null;
	houseNumber: string | null;
	road: string | null;
	neighbourhood: string | null;
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

	const url = new URL(`${config.openstreet_map_url}`);

	url.searchParams.set("format", "jsonv2");
	url.searchParams.set("lat", latitude.toString());
	url.searchParams.set("lon", longitude.toString());
	url.searchParams.set("addressdetails", "1");
	url.searchParams.set("zoom", "18");
	url.searchParams.set("accept-language", "en");

	const response = await fetch(url, {
		headers: {
			"User-Agent": "SwiftCourier/1.0 (swift_service@gamil.com.com)",
			Accept: "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Reverse geocoding failed: ${response.status} ${response.statusText}`);
	}

	const data = (await response.json()) as NominatimResponse;

	if (!data.address) {
		return null;
	}

	const address = data.address;

	return {
		fullAddress: data.display_name ?? null,
		houseNumber: address.house_number ?? null,
		road: address.road ?? null,
		neighbourhood: address.neighbourhood ?? address.suburb ?? null,
		city: address.city ?? address.town ?? address.village ?? address.municipality ?? null,
		district: address.county ?? null,
		state: address.state ?? null,
		postcode: address.postcode ?? null,
		country: address.country ?? null,
		countryCode: address.country_code ?? null,
	};
};
