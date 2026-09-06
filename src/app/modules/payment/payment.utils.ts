import httpStatus from "http-status";
import type Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	AuditAction,
	AuditResource,
	NotificationType,
	PaymentMethod,
	PaymentProvider,
	PaymentStatus,
	ShipmentStatus,
} from "../../../generated/prisma/enums";
import { format } from "date-fns";
import { notificationDeadline, onboardingAuditOldDeadline } from "../../utils/comon.utils";

export const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
	console.log({ session });

	const shipmentId = session.metadata?.shipmentId;

	if (!shipmentId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Shipment id not found in metadata.");
	}

	await prisma.$transaction(
		async (tx) => {
			// Prevent duplicate payment
			const existingPayment = await tx.payment.findUnique({
				where: {
					shipmentId,
				},
			});

			if (existingPayment) {
				return;
			}

			const shipment = await tx.shipment.findUniqueOrThrow({
				where: {
					id: shipmentId,
				},
				include: {
					payment: true,
					customer: true,
				},
			});

			await tx.payment.create({
				data: {
					shipmentId,
					provider: PaymentProvider.STRIPE,
					method: PaymentMethod.CARD,
					sessionId: session?.id,
					transactionId:
						typeof session.payment_intent === "string"
							? session.payment_intent
							: (session.payment_intent?.id ?? session.id),

					amount: shipment?.deliveryFee!,
					status: PaymentStatus.PAID,
					paidAt: new Date(),
				},
			});

			await tx.shipment.update({
				where: {
					id: shipmentId,
				},
				data: {
					status: ShipmentStatus.PENDING,
					tracking: {
						create: {
							updatedById: session.metadata?.customerId!,
							status: ShipmentStatus.PENDING,
							note: "Payment SuccessFully and Ready For Pickup",
						},
					},
				},
			});

			const date = new Date();

			await tx.notification.create({
				data: {
					title: `${shipment.parcelName} Payment SuccessFully Created`,
					message: `ShipmentID = ${shipment.id} Payment SuccessFully Created At ${format(date, "dd/MM/yyyy HH:mm")}`,
					type: NotificationType.GENERAL,
					shipmentId: shipment.id,
					userId: session.metadata?.customerId!,
					notificationDeadline: notificationDeadline,
				},
			});

			await tx.auditLog.create({
				data: {
					userId: session.metadata?.customerId!,
					action: AuditAction.PAYMENT,
					resource: AuditResource.SHIPMENT,
					resourceId: shipment.id,
					description: "Payment created",
					onboardingOldTime: onboardingAuditOldDeadline,
					metadata: {
						prevStatus: ShipmentStatus.CREATED,
					},
				},
			});
		},
		{
			maxWait: 10000,
			timeout: 25000,
		},
	);
};

export const handleCheckoutExpired = async (session: Stripe.Checkout.Session) => {
	console.log(`Checkout session expired: ${session.id}`);
};

export const handlePaymentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
	console.log(`Payment failed: ${paymentIntent.id}`);

	console.log(paymentIntent.last_payment_error?.message);
};
