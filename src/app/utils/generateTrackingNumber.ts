import { prisma } from "../lib/prisma";

const ALPHANUMERIC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateRandomCode = (): string => {
	let result = "";

	for (let i = 0; i < 6; i++) {
		const randomIndex = Math.floor(Math.random() * ALPHANUMERIC.length);

		result += ALPHANUMERIC[randomIndex];
	}

	return result;
};

export const generateTrackingNumber = async (): Promise<string> => {
	const now = new Date();

	const year = now.getFullYear().toString().slice(-2);
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");

	for (let attempt = 0; attempt < 10; attempt++) {
		const randomCode = generateRandomCode();

		const trackingNumber = `SW-${year}${month}${day}-${randomCode}`;

		const existingShipment = await prisma.shipment.findUnique({
			where: {
				trackingNumber,
			},
			select: {
				id: true,
			},
		});

		if (!existingShipment) {
			return trackingNumber;
		}
	}

	throw new Error("Failed to generate a unique tracking number after multiple attempts");
};
