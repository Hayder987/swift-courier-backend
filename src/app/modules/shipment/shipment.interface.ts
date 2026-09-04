export interface IShipmentStatusAdmin {
  status:
    | "READY_FOR_PAYMENT"
    | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "DELIVERY_FAILED"
    | "RETURNED"
    | "CANCELLED";
note : string;
}
