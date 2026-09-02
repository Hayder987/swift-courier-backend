import app from "./app";
import config from "./app/config";
import { transporter } from "./app/lib/nodemailer";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
import { seedSuperAdmin } from "./app/utils/seed";

const PORT = config.port;

const main = async () => {
	try {
		// prisma connect
		await prisma.$connect();
		console.log("Connected to the swift database successfully.");

		// connect redis
		await redisClient.connect();
		console.log("Connected to Redis Server SuccessFully");

		// connect nodemailer
		await transporter.verify();
		console.log("Nodemailer Connected Successfully.");

		// seed superAdmin
		await seedSuperAdmin();

		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT} SuccessFully!`);
		});
	} catch (error) {
		console.error("Error Found On starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
};

main();
