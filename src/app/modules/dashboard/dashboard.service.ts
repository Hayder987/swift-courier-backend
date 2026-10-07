import { PaymentStatus, ShipmentStatus } from "../../../generated/prisma/enums";

import { endOfDay, startOfDay, subDays, subYears } from "date-fns";

import { prisma } from "../../lib/prisma";

import type {
	ICourierPerformance,
	IDashboardStats,
	IRevenueTrendItem,
	IShipmentTrendItem,
} from "./dashboard.interface";

import type { IDashboardQuery } from "./dashboard.validation";

const getPeriodStartDate = (period: IDashboardQuery["period"]): Date => {
	const now = new Date();

	switch (period) {
		case "7d":
			return subDays(now, 6);

		case "30d":
			return subDays(now, 29);

		case "90d":
			return subDays(now, 89);

		case "1y":
			return subYears(now, 1);

		default:
			return subDays(now, 29);
	}
};

const formatDate = (date: Date): string => {
	return date.toISOString().split("T")[0];
};

const getDashboardStats = async (query: IDashboardQuery): Promise<IDashboardStats> => {
	const now = new Date();

	const period = query.period ?? "30d";

	const periodStart = startOfDay(getPeriodStartDate(period));

	const periodEnd = endOfDay(now);

	const todayStart = startOfDay(now);

	const todayEnd = endOfDay(now);

	const [totalUsers, totalCustomers, totalCouriers, totalShipments] = await Promise.all([
		prisma.user.count({
			where: {
				isDeleted: false,
			},
		}),

		prisma.user.count({
			where: {
				role: "CUSTOMER",
				isDeleted: false,
			},
		}),

		prisma.user.count({
			where: {
				role: "COURIER",
				isDeleted: false,
			},
		}),

		prisma.shipment.count(),
	]);

	const shipmentStatusData = await prisma.shipment.groupBy({
		by: ["status"],

		_count: {
			_all: true,
		},
	});

	const shipmentStatusDistribution = shipmentStatusData.map((item) => ({
		status: item.status,
		count: item._count._all,
	}));

	const shipmentsForTrend = await prisma.shipment.findMany({
		where: {
			createdAt: {
				gte: periodStart,
				lte: periodEnd,
			},
		},

		select: {
			status: true,
			createdAt: true,
		},

		orderBy: {
			createdAt: "asc",
		},
	});

	const shipmentTrendMap = new Map<string, IShipmentTrendItem>();

	for (let date = new Date(periodStart); date <= periodEnd; date.setDate(date.getDate() + 1)) {
		const dateKey = formatDate(date);

		shipmentTrendMap.set(dateKey, {
			date: dateKey,
			created: 0,
			delivered: 0,
			cancelled: 0,
			failed: 0,
		});
	}

	for (const shipment of shipmentsForTrend) {
		const dateKey = formatDate(shipment.createdAt);

		const current = shipmentTrendMap.get(dateKey);

		if (!current) {
			continue;
		}

		current.created += 1;

		if (shipment.status === ShipmentStatus.DELIVERED) {
			current.delivered += 1;
		}

		if (shipment.status === ShipmentStatus.CANCELLED) {
			current.cancelled += 1;
		}

		if (shipment.status === ShipmentStatus.DELIVERY_FAILED) {
			current.failed += 1;
		}
	}

	const shipmentTrend = Array.from(shipmentTrendMap.values());

	const [
		allTimeRevenueResult,
		periodRevenueResult,
		todayRevenueResult,
		pendingPaymentResult,
		failedPaymentResult,
		cancelledPaymentResult,
	] = await Promise.all([
		prisma.payment.aggregate({
			where: {
				status: PaymentStatus.PAID,
			},

			_sum: {
				amount: true,
			},
		}),

		prisma.payment.aggregate({
			where: {
				status: PaymentStatus.PAID,

				createdAt: {
					gte: periodStart,
					lte: periodEnd,
				},
			},

			_sum: {
				amount: true,
			},
		}),

		prisma.payment.aggregate({
			where: {
				status: PaymentStatus.PAID,

				createdAt: {
					gte: todayStart,
					lte: todayEnd,
				},
			},

			_sum: {
				amount: true,
			},
		}),

		prisma.payment.aggregate({
			where: {
				status: PaymentStatus.PENDING,
			},

			_sum: {
				amount: true,
			},
		}),

		prisma.payment.aggregate({
			where: {
				status: PaymentStatus.FAILED,
			},

			_sum: {
				amount: true,
			},
		}),

		prisma.payment.aggregate({
			where: {
				status: PaymentStatus.CANCELLED,
			},

			_sum: {
				amount: true,
			},
		}),
	]);

	const totalRevenue = Number(allTimeRevenueResult._sum.amount ?? 0);

	const periodRevenue = Number(periodRevenueResult._sum.amount ?? 0);

	const todayRevenue = Number(todayRevenueResult._sum.amount ?? 0);

	const pendingPayment = Number(pendingPaymentResult._sum.amount ?? 0);

	const failedPayment = Number(failedPaymentResult._sum.amount ?? 0);

	const cancelledPayment = Number(cancelledPaymentResult._sum.amount ?? 0);

	const revenueOverview = {
		totalRevenue,
		periodRevenue,
		todayRevenue,
		pendingPayment,
		failedPayment,
		cancelledPayment,
	};

	const paidPaymentsForTrend = await prisma.payment.findMany({
		where: {
			status: PaymentStatus.PAID,

			createdAt: {
				gte: periodStart,
				lte: periodEnd,
			},
		},

		select: {
			amount: true,
			createdAt: true,
		},

		orderBy: {
			createdAt: "asc",
		},
	});

	const revenueTrendMap = new Map<string, IRevenueTrendItem>();

	for (let date = new Date(periodStart); date <= periodEnd; date.setDate(date.getDate() + 1)) {
		const dateKey = formatDate(date);

		revenueTrendMap.set(dateKey, {
			date: dateKey,
			revenue: 0,
		});
	}

	for (const payment of paidPaymentsForTrend) {
		const dateKey = formatDate(payment.createdAt);

		const current = revenueTrendMap.get(dateKey);

		if (!current) {
			continue;
		}

		current.revenue += Number(payment.amount ?? 0);
	}

	const revenueTrend = Array.from(revenueTrendMap.values());

	const paymentStatusData = await prisma.payment.groupBy({
		by: ["status"],

		_count: {
			_all: true,
		},

		_sum: {
			amount: true,
		},
	});

	const paymentStatusDistribution = paymentStatusData.map((item) => ({
		status: item.status,
		count: item._count._all,
		amount: Number(item._sum.amount ?? 0),
	}));

	const paymentMethodData = await prisma.payment.groupBy({
		by: ["method"],

		_count: {
			_all: true,
		},

		_sum: {
			amount: true,
		},
	});

	const paymentMethodDistribution = paymentMethodData.map((item) => ({
		method: item.method,
		count: item._count._all,
		amount: Number(item._sum.amount ?? 0),
	}));

	const courierAvailabilityData = await prisma.courier.groupBy({
		by: ["courierAvailability"],

		_count: {
			_all: true,
		},
	});

	const courierAvailability = courierAvailabilityData.map((item) => ({
		availability: item.courierAvailability,
		count: item._count._all,
	}));

	const courierEarnings = await prisma.courierEarning.findMany({
		where: {
			createdAt: {
				gte: periodStart,
				lte: periodEnd,
			},
		},

		select: {
			courierId: true,
			amount: true,

			courier: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},

			shipment: {
				select: {
					id: true,
					status: true,
				},
			},
		},
	});

	const courierPerformanceMap = new Map<string, ICourierPerformance>();

	for (const earning of courierEarnings) {
		const courier = earning.courier;

		if (!courier) {
			continue;
		}

		const existing = courierPerformanceMap.get(courier.id) ?? {
			courierId: courier.id,
			name: courier.name,
			email: courier.email,
			totalShipments: 0,
			deliveredShipments: 0,
			failedShipments: 0,
			earnings: 0,
		};

		existing.earnings += Number(earning.amount ?? 0);

		if (earning.shipment) {
			existing.totalShipments += 1;

			if (earning.shipment.status === ShipmentStatus.DELIVERED) {
				existing.deliveredShipments += 1;
			}

			if (
				earning.shipment.status === ShipmentStatus.DELIVERY_FAILED ||
				earning.shipment.status === ShipmentStatus.RETURNED
			) {
				existing.failedShipments += 1;
			}
		}

		courierPerformanceMap.set(courier.id, existing);
	}

	const courierPerformance = Array.from(courierPerformanceMap.values())
		.sort((a, b) => {
			if (b.deliveredShipments !== a.deliveredShipments) {
				return b.deliveredShipments - a.deliveredShipments;
			}

			return b.earnings - a.earnings;
		})
		.slice(0, 10);

	const recentAuditActivity = await prisma.auditLog.findMany({
		take: 10,

		orderBy: {
			createdAt: "desc",
		},

		select: {
			id: true,
			action: true,
			resource: true,
			description: true,
			createdAt: true,

			user: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
		},
	});

	return {
		overview: {
			totalUsers,
			totalCustomers,
			totalCouriers,
			totalShipments,
		},

		shipmentStatusDistribution,
		shipmentTrend,
		revenueOverview,
		revenueTrend,
		paymentStatusDistribution,
		paymentMethodDistribution,
		courierAvailability,
		courierPerformance,
		recentAuditActivity,
	};
};

export const dashboardService = {
	getDashboardStats,
};
