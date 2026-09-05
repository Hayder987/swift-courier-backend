export interface ICreateZonePayload {
	name: string;
	code: string;
	address: string;
	radiusKm: number;
}

export interface IUpdateZonePayload {
	name?: string;
	code?: string;
	address?: string;
	radiusKm?: number;
	isActive?: boolean;
}
