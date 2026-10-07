import type {
	PaymentMethod,
	PaymentStatus,
	ShipmentStatus,
	UserRole,
} from "../../../generated/prisma/enums";

export interface IShipmentStatusDistribution {
	status: ShipmentStatus;
	count: number;
}

export interface IShipmentTrendItem {
	date: string;
	created: number;
	delivered: number;
	cancelled: number;
	failed: number;
}

export interface IRevenueOverview {
	totalRevenue: number;
	periodRevenue: number;
	todayRevenue: number;
	pendingPayment: number;
	failedPayment: number;
	cancelledPayment: number;
}

export interface IRevenueTrendItem {
	date: string;
	revenue: number;
}

export interface IPaymentStatusDistribution {
	status: PaymentStatus;
	count: number;
	amount: number;
}

export interface IPaymentMethodDistribution {
	method: PaymentMethod;
	count: number;
	amount: number;
}

export interface ICourierAvailability {
	availability: string;
	count: number;
}

export interface ICourierPerformance {
	courierId: string;
	name: string;
	email: string;
	totalShipments: number;
	deliveredShipments: number;
	failedShipments: number;
	earnings: number;
}

export interface IRecentAuditActivity {
	id: string;
	action: string;
	resource: string;
	description: string | null;
	createdAt: Date;
	user: {
		id: string;
		name: string;
		email: string;
		role: UserRole;
	};
}

export interface IDashboardStats {
	overview: {
		totalUsers: number;
		totalCustomers: number;
		totalCouriers: number;
		totalShipments: number;
	};

	shipmentStatusDistribution: IShipmentStatusDistribution[];

	shipmentTrend: IShipmentTrendItem[];

	revenueOverview: IRevenueOverview;

	revenueTrend: IRevenueTrendItem[];

	paymentStatusDistribution: IPaymentStatusDistribution[];

	paymentMethodDistribution: IPaymentMethodDistribution[];

	courierAvailability: ICourierAvailability[];

	courierPerformance: ICourierPerformance[];

	recentAuditActivity: IRecentAuditActivity[];
}
