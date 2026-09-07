import cron from "node-cron";
import { redisClient } from "../../lib/redis";
import { sendTemplateEmail } from "../../services/sendTemplateEmail";

export const startSalaryEmailWorker = () => {
	cron.schedule("* * * * *", async () => {
		try {
			const keys = await redisClient.keys("salary-email:*");

			if (!keys.length) {
				return;
			}

			for (const key of keys) {
				const data = await redisClient.get(key);

				if (!data) {
					continue;
				}

				try {
					const job = JSON.parse(data);

					if (job.type !== "SALARY_GENERATED") {
						await redisClient.del(key);
						continue;
					}

					const emailData = job.data;

					await sendTemplateEmail({
						to: emailData.email,
						subject: `SwiftCourier Salary Generated - ${emailData.month}/${emailData.year}`,
						templateName: "salary-generated",
						data: emailData,
					});

					// Email successfully sent
					await redisClient.del(key);

					console.log(`Salary email sent: ${emailData.email}`);
				} catch (error) {
					console.error(`Salary email failed for ${key}:`, error);
				}
			}
		} catch (error) {
			console.error("Salary email worker error:", error);
		}
	});
};
