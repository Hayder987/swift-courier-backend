export interface IShipmentStatusAdmin {
	status:
		| "READY_FOR_PAYMENT"
		| "OUT_FOR_DELIVERY"
		| "IN_TRANSIT"
		| "RETURNED"
		| "ASSIGNED"
		| "CANCELLED"
		| "DELIVERED"
		| "DELIVERY_FAILED";

	note: string;
}

export interface IShipmentStatusCourier {
	status: "PICKED_UP" | "DELIVERY_FAILED" | "DELIVERED";

	note: string;
}
