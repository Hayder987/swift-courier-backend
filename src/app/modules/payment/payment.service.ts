import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { ICreateCheckoutSession } from "./payment.interfaces";
import { PaymentStatus, ShipmentStatus } from "../../../generated/prisma/enums";
import { stripe } from "../../lib/stripe";
import config from "../../config";
import type Stripe from "stripe";
import {
	handleCheckoutCompleted,
	handleCheckoutExpired,
	handlePaymentFailed,
} from "./payment.utils";

// create checkout session
const createCheckoutSessionIntoDB = async (customerId: string, payload: ICreateCheckoutSession) => {
	console.log(payload);
	const shipment = await prisma.shipment.findUnique({
		where: {
			id: payload.shipmentId,
		},
		include: {
			customer: true,
			payment: true,
		},
	});

	// Rental exists
	if (!shipment) {
		throw new AppError(httpStatus.NOT_FOUND, "Shipment not found.");
	}

	// Rental belongs to logged in tenant
	if (shipment.customerId !== customerId) {
		throw new AppError(httpStatus.FORBIDDEN, "You are not allowed to pay for this Shipment");
	}

	// Rental approved
	if (shipment.status !== ShipmentStatus.READY_FOR_PAYMENT) {
		throw new AppError(httpStatus.BAD_REQUEST, "Shipment Does Not Ready For Payment");
	}

	// Payment already completed
	if (shipment.payment && shipment.payment.status === PaymentStatus.PAID) {
		throw new AppError(httpStatus.BAD_REQUEST, "Payment already completed.");
	}

	const session = await stripe.checkout.sessions.create({
		mode: "payment",

		payment_method_types: ["card"],

		customer_email: shipment.customer.email,

		line_items: [
			{
				quantity: 1,

				price_data: {
					currency: "bdt",

					unit_amount: Number(shipment.deliveryFee) * 100,

					product_data: {
						name: shipment.parcelName,
						description: shipment.description,
					},
				},
			},
		],

		metadata: {
			shipmentId: shipment.id,
			customerId,
		},

		success_url: `${config.frontend_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

		cancel_url: `${config.frontend_url}/payment/cancel`,
	});

	return {
		sessionId: session.id,
		checkoutUrl: session.url,
	};
};

// handle webhook and get data
const handleWebhook = async (payload: Buffer, signature: string) => {
	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(payload, signature, config.stripe_webhook_secret);
	} catch {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid Stripe webhook signature.");
	}

	switch (event.type) {
		case "checkout.session.completed":
			await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
			break;

		case "checkout.session.expired":
			await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
			break;

		case "payment_intent.payment_failed":
			await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
			break;

		default:
			console.log(`Unhandled Stripe Event: ${event.type}`);
			break;
	}
};

// export payment service
export const paymentService = {
	createCheckoutSessionIntoDB,
	handleWebhook,
};
