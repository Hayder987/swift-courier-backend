import { prisma } from "../../lib/prisma";

export const getRandomAvailableCourier = async (zoneId: string) => {
	const [randomCourier] = await prisma.$queryRaw<
		{
			userId: string;
			employeeId: string;
			courierId: string;
			name: string;
			email: string;
		}[]
	>`
    SELECT
      u.id AS "userId",
      e.id AS "employeeId",
      c.id AS "courierId",
      u.name,
      u.email
    FROM "employees" e
    INNER JOIN "couriers" c
      ON c."employeeId" = e.id
    INNER JOIN "users" u
      ON u.id = e."userId"
    WHERE e."employmentStatus" = 'ACTIVE'
      AND c."zoneId" = ${zoneId}
      AND c."courierAvailability" = 'AVAILABLE'
    ORDER BY RANDOM()
    LIMIT 1;
  `;

	return randomCourier;
};
