export interface IAIChatMessage {
	role: "user" | "assistant";
	content: string;
}

export interface IAIChatRequest {
	message: string;
	history?: IAIChatMessage[];
}

export interface ITrackingToolResult {
	kind: "tracking";
	found: boolean;
	trackingNumber: string;
	parcelName?: string;
	status?: string;
	statusTimeline?: Array<{ status: string; note?: string | null; at: string }>;
	pickupZone?: string;
	deliveryZone?: string;
	deliveryFee?: number | null;
	createdAt?: string;
}

export interface IPricingToolResult {
	kind: "pricing";
	success: boolean;
	pickupLat?: number;
	pickupLng?: number;
	deliveryLat?: number;
	deliveryLng?: number;
	weightGM?: number;
	distanceKm?: number;
	serviceCharge?: number;
	amountBDT?: number;
	note?: string;
}

export interface IFaqToolResult {
	kind: "faq";
	matched: Array<{ question: string; answer: string }>;
}

export interface IServiceInfoToolResult {
	kind: "service";
	info: Record<string, string | number>;
}

export type IAIToolResult =
	| ITrackingToolResult
	| IPricingToolResult
	| IFaqToolResult
	| IServiceInfoToolResult;

export interface IAIChatResponse {
	reply: string;
	toolResult?: IAIToolResult | null;
}
