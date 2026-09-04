export interface IShipmentStatusAdmin {
  status:
    | "READY_FOR_PAYMENT"
    | "RETURNED"
    | "ASSIGNED"
    | "CANCELLED";
note : string;
}

export interface IShipmentStatusCourier {
  status : 
  | "PICKED_UP" 
  | "OUT_FOR_DELIVERY"
  | "IN_TRANSIT"
  | "DELIVERY_FAILED"
  | "DELIVERED";

  note : string;
}
