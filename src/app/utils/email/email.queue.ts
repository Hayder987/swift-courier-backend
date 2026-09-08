import { redisClient } from "../../lib/redis";
import type { ISalaryEmailData } from "../../modules/payroll/payroll.interface";

export const addSalaryEmailToQueue = async (data: ISalaryEmailData) => {
	try {
		const jobId = `salary-email:${data.email}:${data.year}-${data.month}`;

		await redisClient.set(
			jobId,
			JSON.stringify({
				type: "SALARY_GENERATED",
				data,
				createdAt: new Date().toISOString(),
			}),
			{
				EX: 60 * 60,
			},
		);

		return true;
	} catch (error) {
		console.error("Salary email queue error:", error);

		return false;
	}
};
