export interface IGeneratePayrollPayload {
	month: number;
	year: number;
	bonus?: number;
	totalDeduction?: number;
}

export interface IPayPayrollPayload {
	paymentReference?: string;
}

export interface IMySalaryQuery {
	month?: number;
	year?: number;
}

export interface IPaidSalaryQuery {
	month?: number;
	year?: number;
	page?: number;
	limit?: number;
}

export interface ISalaryEmailData {
	name: string;
	email: string;
	employeeCode?: string | null;

	month: number;
	year: number;

	basicSalary: string;
	totalAllowance: string;
	deliveryEarning: string;
	bonus: string;
	grossSalary: string;
	totalDeduction: string;
	netSalary: string;

	totalDeliveries: number;
	successfulDeliveries: number;
}
