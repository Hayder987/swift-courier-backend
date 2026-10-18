export const SWIFTCOURIER_FAQ: Array<{ question: string; answer: string }> = [
	{
		question: "How does SwiftCourier work?",
		answer:
			"SwiftCourier makes parcel delivery simple. Create a shipment with your pickup and delivery information, choose your preferred service, complete the payment, and track your parcel from pickup to final delivery.",
	},
	{
		question: "How can I track my parcel?",
		answer:
			"Every shipment receives a unique tracking ID. You can use that tracking ID to check your parcel status and follow its delivery progress in real time from your SwiftCourier dashboard.",
	},
	{
		question: "How is the delivery charge calculated?",
		answer:
			"Delivery charges depend on pickup location, delivery location, parcel weight, delivery distance, and the selected delivery service. The estimated charge is calculated before you confirm your shipment.",
	},
	{
		question: "Is online payment available?",
		answer:
			"Yes. SwiftCourier supports secure online payments. You can complete the payment during the shipment creation process and receive confirmation after a successful transaction.",
	},
	{
		question: "Can I become a SwiftCourier courier?",
		answer:
			"Yes. You can apply to become a courier through the Be a Courier section. After submitting your application, the SwiftCourier team can review your information and process your application.",
	},
	{
		question: "What happens if my parcel cannot be delivered?",
		answer:
			"If a delivery attempt fails, the shipment status is updated accordingly. Depending on the situation, the parcel may be scheduled for another attempt or processed according to the applicable return procedure.",
	},
	{
		question: "Can I cancel a shipment?",
		answer:
			"Shipment cancellation depends on the current shipment status. If the shipment has not progressed to a stage where cancellation is restricted, you may be able to cancel it from your dashboard.",
	},
	{
		question: "How can I contact SwiftCourier support?",
		answer:
			"You can contact the SwiftCourier support team through the Contact page. Provide your shipment or account details when necessary so the support team can assist you more efficiently.",
	},
];

export const SHIPPING_SERVICE_INFO = {
	serviceChargeBDT: 120,
	distanceRatePerKmBDT: 5,
	weightRatePerKgBDT: 25,
	weightUnit: "grams",
	distanceUnit: "kilometers",
	currency: "BDT",
	trackingFormatHint: "Tracking numbers are provided when you create a shipment.",
};
